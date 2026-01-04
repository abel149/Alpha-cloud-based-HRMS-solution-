<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\TenantUser;
use App\Services\BiometricAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * BiometricController
 * 
 * Handles biometric authentication endpoints for employee fingerprint registration and verification
 */
class BiometricController extends Controller
{
    protected $biometricService;

    public function __construct(BiometricAuthService $biometricService)
    {
        $this->biometricService = $biometricService;
    }

    /**
     * Get registration options for WebAuthn
     * This generates a challenge for the browser to create credentials
     */
    public function getRegistrationOptions(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            // Generate a random challenge
            $challenge = base64_encode(random_bytes(32));

            // Store challenge in session for verification
            session(['webauthn_challenge' => $challenge]);

            return response()->json([
                'ok' => true,
                'options' => [
                    'challenge' => $challenge,
                    'rp' => [
                        'name' => config('app.name', 'Alpha HRMS'),
                    ],
                    'user' => [
                        'id' => base64_encode((string)$employee->id),
                        'name' => $tenantUser->email,
                        'displayName' => $tenantUser->name,
                    ],
                    'pubKeyCredParams' => [
                        ['type' => 'public-key', 'alg' => -7],  // ES256
                        ['type' => 'public-key', 'alg' => -257], // RS256
                    ],
                    'authenticatorSelection' => [
                        'authenticatorAttachment' => 'platform',
                        'userVerification' => 'required',
                    ],
                    'timeout' => 60000,
                    'attestation' => 'none',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate registration options', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to generate registration options'
            ], 500);
        }
    }

    /**
     * Register a new fingerprint credential
     */
    public function registerFingerprint(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            // Validate the challenge
            $storedChallenge = session('webauthn_challenge');
            if (!$storedChallenge) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Invalid session. Please try again.'
                ], 400);
            }

            // Get credential data from request
            $credentialData = [
                'id' => $request->input('id'),
                'publicKey' => $request->input('publicKey'),
                'challenge' => $storedChallenge,
            ];

            // Register the fingerprint
            $success = $this->biometricService->registerFingerprint($employee, $credentialData);

            // Clear the challenge from session
            session()->forget('webauthn_challenge');

            if ($success) {
                return response()->json([
                    'ok' => true,
                    'message' => 'Fingerprint registered successfully',
                ]);
            } else {
                return response()->json([
                    'ok' => false,
                    'message' => 'Failed to register fingerprint'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Failed to register fingerprint', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to register fingerprint'
            ], 500);
        }
    }

    /**
     * Get authentication options for WebAuthn
     * This generates a challenge for fingerprint verification
     */
    public function getAuthenticationOptions(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            // Check if employee has registered fingerprint
            if (!$this->biometricService->hasRegisteredFingerprint($employee)) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No fingerprint registered. Please register first.'
                ], 400);
            }

            // Generate a random challenge
            $challenge = base64_encode(random_bytes(32));

            // Store challenge in session for verification
            session(['webauthn_auth_challenge' => $challenge]);

            // Get registered credentials
            $credentials = $this->biometricService->getRegisteredFingerprints($employee);
            $allowCredentials = array_map(function($cred) {
                return [
                    'type' => 'public-key',
                    'id' => $cred['id'],
                ];
            }, $credentials);

            return response()->json([
                'ok' => true,
                'options' => [
                    'challenge' => $challenge,
                    'allowCredentials' => $allowCredentials,
                    'userVerification' => 'required',
                    'timeout' => 60000,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate authentication options', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to generate authentication options'
            ], 500);
        }
    }

    /**
     * Verify fingerprint authentication
     */
    public function verifyFingerprint(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            // Validate the challenge
            $storedChallenge = session('webauthn_auth_challenge');
            if (!$storedChallenge) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Invalid session. Please try again.'
                ], 400);
            }

            // Get assertion data from request
            $assertionData = [
                'credentialId' => $request->input('credentialId'),
                'authenticatorData' => $request->input('authenticatorData'),
                'signature' => $request->input('signature'),
                'challenge' => $storedChallenge,
            ];

            // Verify the fingerprint
            $verified = $this->biometricService->verifyFingerprint($employee, $assertionData);

            // Clear the challenge from session
            session()->forget('webauthn_auth_challenge');

            if ($verified) {
                // Store verification in session (valid for 5 minutes)
                session([
                    'fingerprint_verified' => true,
                    'fingerprint_verified_at' => now()->timestamp,
                ]);

                return response()->json([
                    'ok' => true,
                    'message' => 'Fingerprint verified successfully',
                ]);
            } else {
                return response()->json([
                    'ok' => false,
                    'message' => 'Fingerprint verification failed'
                ], 401);
            }
        } catch (\Exception $e) {
            Log::error('Failed to verify fingerprint', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to verify fingerprint'
            ], 500);
        }
    }

    /**
     * Check if fingerprint is currently verified
     */
    public function checkVerificationStatus(Request $request)
    {
        $verified = session('fingerprint_verified', false);
        $verifiedAt = session('fingerprint_verified_at', 0);

        // Check if verification is still valid (5 minutes)
        $isValid = $verified && (now()->timestamp - $verifiedAt) < 300;

        if (!$isValid) {
            session()->forget(['fingerprint_verified', 'fingerprint_verified_at']);
        }

        return response()->json([
            'ok' => true,
            'verified' => $isValid,
            'expires_in' => $isValid ? (300 - (now()->timestamp - $verifiedAt)) : 0,
        ]);
    }

    /**
     * Get fingerprint registration status
     */
    public function getRegistrationStatus(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            $hasFingerprint = $this->biometricService->hasRegisteredFingerprint($employee);
            $credentials = $this->biometricService->getRegisteredFingerprints($employee);

            return response()->json([
                'ok' => true,
                'registered' => $hasFingerprint,
                'registered_at' => $employee->fingerprint_registered_at,
                'credentials_count' => count($credentials),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get registration status', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to get registration status'
            ], 500);
        }
    }

    /**
     * Remove fingerprint credential
     */
    public function removeFingerprint(Request $request)
    {
        try {
            $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
            $employee = $tenantUser
                ? Employee::where('user_id', $tenantUser->id)->first()
                : null;

            if (!$employee) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Employee record not found'
                ], 404);
            }

            $credentialId = $request->input('credentialId');
            if (!$credentialId) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Credential ID required'
                ], 400);
            }

            $success = $this->biometricService->removeFingerprint($employee, $credentialId);

            if ($success) {
                return response()->json([
                    'ok' => true,
                    'message' => 'Fingerprint removed successfully',
                ]);
            } else {
                return response()->json([
                    'ok' => false,
                    'message' => 'Failed to remove fingerprint'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Failed to remove fingerprint', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Failed to remove fingerprint'
            ], 500);
        }
    }
}
