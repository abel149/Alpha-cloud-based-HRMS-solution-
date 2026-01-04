import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiLock } from 'react-icons/fi';

/**
 * BiometricAuth Component
 * 
 * Handles fingerprint authentication using WebAuthn API
 * This component provides:
 * - Fingerprint registration
 * - Fingerprint verification
 * - Real-time verification status
 */
export default function BiometricAuth({
    isRequired = false,
    onVerificationChange = () => { },
    showRegistration = true
}) {
    const [registered, setRegistered] = useState(false);
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expiresIn, setExpiresIn] = useState(0);
    const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const getCookie = (name) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const xsrfTokenFromCookie = () => {
        const v = getCookie('XSRF-TOKEN');
        if (!v) return null;
        try {
            return decodeURIComponent(v);
        } catch {
            return v;
        }
    };

    const appBaseUrl = () => {
        const meta = document.querySelector('meta[name="app-base-url"]');
        const v = meta?.getAttribute('content');
        return (v || '').replace(/\/+$/, '');
    };

    const endpoint = (path) => {
        const base = appBaseUrl();
        const cleanPath = String(path || '').replace(/^\/+/, '');
        return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
    };

    const isIpHost = (host) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host || '');

    const ensureWebAuthnAllowed = () => {
        const host = window?.location?.hostname || '';
        const protocol = window?.location?.protocol || '';

        if (isIpHost(host)) {
            throw new Error('This is an invalid domain for fingerprint registration. Please open the app using http://localhost:8000 (not 127.0.0.1), or use a real domain/https.');
        }

        if (protocol !== 'https:' && host !== 'localhost') {
            throw new Error('Fingerprint registration requires a secure context. Use https, or open the app on http://localhost.');
        }
    };

    // Check WebAuthn support
    useEffect(() => {
        const checkSupport = () => {
            const supported = window.PublicKeyCredential !== undefined &&
                window.navigator.credentials !== undefined;
            setSupportsWebAuthn(supported);

            if (!supported && isRequired) {
                setError('Your browser does not support fingerprint authentication. Please use a modern browser like Chrome, Edge, or Safari.');
            }
        };

        checkSupport();
    }, [isRequired]);

    // Check registration status
    useEffect(() => {
        const checkRegistrationStatus = async () => {
            try {
                const res = await fetch(endpoint('tenant/employee/biometric/registration-status'), {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                        ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setRegistered(data.registered || false);
                }
            } catch (e) {
                console.error('Failed to check registration status:', e);
            }
        };

        if (supportsWebAuthn) {
            checkRegistrationStatus();
        }
    }, [supportsWebAuthn]);

    // Check verification status periodically
    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                const res = await fetch(endpoint('tenant/employee/biometric/status'), {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                        ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setVerified(data.verified || false);
                    setExpiresIn(data.expires_in || 0);
                    onVerificationChange(data.verified || false);
                }
            } catch (e) {
                console.error('Failed to check verification status:', e);
            }
        };

        if (supportsWebAuthn) {
            checkVerificationStatus();
            const interval = setInterval(checkVerificationStatus, 5000); // Check every 5 seconds
            return () => clearInterval(interval);
        }
    }, [supportsWebAuthn, onVerificationChange]);

    // Helper function to convert base64 to Uint8Array
    const base64ToUint8Array = (base64) => {
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        const base64String = (base64 + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64String);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // Helper function to convert Uint8Array to base64
    const uint8ArrayToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };

    // Register fingerprint
    const handleRegisterFingerprint = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            ensureWebAuthnAllowed();
            // Get registration options from server
            const optionsRes = await fetch(endpoint('tenant/employee/biometric/registration-options'), {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                    ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                },
            });

            if (!optionsRes.ok) {
                throw new Error('Failed to get registration options');
            }

            const optionsData = await optionsRes.json();
            const options = optionsData.options;

            // Convert challenge and user ID from base64
            const publicKeyCredentialCreationOptions = {
                challenge: base64ToUint8Array(options.challenge),
                rp: options.rp,
                user: {
                    id: base64ToUint8Array(options.user.id),
                    name: options.user.name,
                    displayName: options.user.displayName,
                },
                pubKeyCredParams: options.pubKeyCredParams,
                authenticatorSelection: options.authenticatorSelection,
                timeout: options.timeout,
                attestation: options.attestation,
            };

            // Create credential using WebAuthn
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (!credential) {
                throw new Error('Failed to create credential');
            }

            // Send credential to server
            const registerRes = await fetch(endpoint('tenant/employee/biometric/register'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                    ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: credential.id,
                    publicKey: uint8ArrayToBase64(credential.response.attestationObject),
                }),
            });

            const registerData = await registerRes.json();

            if (!registerRes.ok || !registerData.ok) {
                throw new Error(registerData.message || 'Failed to register fingerprint');
            }

            setRegistered(true);
            setSuccess('Biometric registered successfully. You can now verify to check in/out.');
        } catch (e) {
            console.error('Registration error:', e);
            const msg = String(e?.message || 'Failed to register fingerprint. Please try again.');
            if (msg.toLowerCase().includes('insecure')) {
                setError('Fingerprint registration requires a secure context. Use https, or open the app on http://localhost (not a public IP).');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Verify fingerprint
    const handleVerifyFingerprint = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            ensureWebAuthnAllowed();
            // Get authentication options from server
            const optionsRes = await fetch(endpoint('tenant/employee/biometric/authentication-options'), {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                    ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                },
            });

            if (!optionsRes.ok) {
                const errorData = await optionsRes.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to get authentication options');
            }

            const optionsData = await optionsRes.json();
            const options = optionsData.options;

            // Convert challenge and allowed credentials from base64
            const publicKeyCredentialRequestOptions = {
                challenge: base64ToUint8Array(options.challenge),
                allowCredentials: options.allowCredentials.map(cred => ({
                    type: cred.type,
                    id: base64ToUint8Array(cred.id),
                })),
                userVerification: options.userVerification,
                timeout: options.timeout,
            };

            if (options.rpId) {
                publicKeyCredentialRequestOptions.rpId = options.rpId;
            }

            // Get assertion using WebAuthn
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (!assertion) {
                throw new Error('Failed to get assertion');
            }

            // Send assertion to server for verification
            const verifyRes = await fetch(endpoint('tenant/employee/biometric/verify'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                    ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    credentialId: assertion.id,
                    authenticatorData: uint8ArrayToBase64(assertion.response.authenticatorData),
                    signature: uint8ArrayToBase64(assertion.response.signature),
                }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.ok) {
                throw new Error(verifyData.message || 'Failed to verify fingerprint');
            }

            setVerified(true);
            setExpiresIn(300); // 5 minutes
            setSuccess('Biometric verified. You can now check in/out.');
            onVerificationChange(true);
        } catch (e) {
            console.error('Verification error:', e);
            setError(e.message || 'Failed to verify fingerprint. Please try again.');
            setVerified(false);
            onVerificationChange(false);
        } finally {
            setLoading(false);
        }
    };

    if (!supportsWebAuthn && isRequired) {
        return (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start">
                    <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Browser Not Supported
                        </h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                            Your browser does not support fingerprint authentication. Please use Chrome, Edge, Safari, or Firefox.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <div className="flex items-start">
                        <FiX className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <div className="flex items-start">
                        <FiCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${verified
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : registered
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                        <FiLock className={`h-6 w-6 ${verified
                            ? 'text-green-600 dark:text-green-400'
                            : registered
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400'
                            }`} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {verified ? 'Biometric Verified' : registered ? 'Biometric Registered' : 'Biometric Not Registered'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {verified
                                ? `Expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`
                                : registered
                                    ? 'Ready to verify'
                                    : 'Register your device biometric (fingerprint/FaceID)'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {!registered && showRegistration && (
                        <button
                            type="button"
                            onClick={handleRegisterFingerprint}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Processing...' : 'Register Biometric'}
                        </button>
                    )}

                    {registered && !verified && (
                        <button
                            type="button"
                            onClick={handleVerifyFingerprint}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Verifying...' : 'Verify Biometric'}
                        </button>
                    )}

                    {verified && (
                        <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <FiCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Active</span>
                        </div>
                    )}
                </div>
            </div>

            {isRequired && !verified && (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                    <FiAlertCircle className="h-4 w-4 mr-2" />
                    Biometric verification is required for attendance check-in/out
                </div>
            )}

            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Your device may show this as a “Passkey” prompt. Use your fingerprint/FaceID to continue.
            </div>
        </div>
    );
}
