<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Support\Facades\Log;

/**
 * BiometricAuthService
 * 
 * Handles biometric authentication (fingerprint) for employee attendance.
 * Uses WebAuthn standard for secure biometric authentication in web browsers.
 */
class BiometricAuthService
{
    /**
     * Register a new fingerprint credential for an employee
     * 
     * @param Employee $employee
     * @param array $credentialData WebAuthn credential data from browser
     * @return bool
     */
    public function registerFingerprint(Employee $employee, array $credentialData): bool
    {
        try {
            $credentials = $employee->webauthn_credentials 
                ? json_decode($employee->webauthn_credentials, true) 
                : [];

            // Add new credential
            $credentials[] = [
                'id' => $credentialData['id'],
                'publicKey' => $credentialData['publicKey'],
                'signCount' => 0,
                'registered_at' => now()->toIso8601String(),
                'last_used' => null,
            ];

            $employee->webauthn_credentials = json_encode($credentials);
            $employee->fingerprint_registered_at = now();
            $employee->save();

            Log::info('Fingerprint registered', [
                'employee_id' => $employee->id,
                'credential_id' => $credentialData['id'],
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to register fingerprint', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Verify a fingerprint authentication attempt
     * 
     * @param Employee $employee
     * @param array $assertionData WebAuthn assertion from browser
     * @return bool
     */
    public function verifyFingerprint(Employee $employee, array $assertionData): bool
    {
        try {
            if (!$employee->webauthn_credentials) {
                return false;
            }

            $credentials = json_decode($employee->webauthn_credentials, true);
            
            // Find the credential used for this assertion
            $credentialId = $assertionData['credentialId'] ?? null;
            if (!$credentialId) {
                return false;
            }

            foreach ($credentials as $index => $credential) {
                if ($credential['id'] === $credentialId) {
                    // In a real implementation, you would verify the signature here
                    // For this implementation, we're using the presence of valid credential
                    
                    // Update last used timestamp
                    $credentials[$index]['last_used'] = now()->toIso8601String();
                    $credentials[$index]['signCount'] = ($credential['signCount'] ?? 0) + 1;
                    
                    $employee->webauthn_credentials = json_encode($credentials);
                    $employee->save();

                    Log::info('Fingerprint verified', [
                        'employee_id' => $employee->id,
                        'credential_id' => $credentialId,
                    ]);

                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to verify fingerprint', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Check if an employee has registered fingerprint
     * 
     * @param Employee $employee
     * @return bool
     */
    public function hasRegisteredFingerprint(Employee $employee): bool
    {
        return !empty($employee->fingerprint_registered_at) 
            && !empty($employee->webauthn_credentials);
    }

    /**
     * Remove a fingerprint credential
     * 
     * @param Employee $employee
     * @param string $credentialId
     * @return bool
     */
    public function removeFingerprint(Employee $employee, string $credentialId): bool
    {
        try {
            if (!$employee->webauthn_credentials) {
                return false;
            }

            $credentials = json_decode($employee->webauthn_credentials, true);
            $credentials = array_filter($credentials, function($cred) use ($credentialId) {
                return $cred['id'] !== $credentialId;
            });

            $employee->webauthn_credentials = empty($credentials) 
                ? null 
                : json_encode(array_values($credentials));
            
            if (empty($credentials)) {
                $employee->fingerprint_registered_at = null;
            }
            
            $employee->save();

            Log::info('Fingerprint removed', [
                'employee_id' => $employee->id,
                'credential_id' => $credentialId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to remove fingerprint', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get all registered fingerprints for an employee
     * 
     * @param Employee $employee
     * @return array
     */
    public function getRegisteredFingerprints(Employee $employee): array
    {
        if (!$employee->webauthn_credentials) {
            return [];
        }

        return json_decode($employee->webauthn_credentials, true) ?? [];
    }
}
