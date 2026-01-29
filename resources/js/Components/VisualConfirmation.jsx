import React, { useState, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CameraOff, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';

const VisualConfirmation = ({ 
    onConfirmationComplete, 
    onConfirmationClear,
    required = false,
    message = "Please take a photo to confirm you are in the building",
    className = ""
}) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [confirmedAt, setConfirmedAt] = useState(null);
    const [faceEnrolled, setFaceEnrolled] = useState(false);
    const [faceEnrolledAt, setFaceEnrolledAt] = useState(null);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [faceApiReady, setFaceApiReady] = useState(false);
    const [faceApiLoading, setFaceApiLoading] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const faceApiModelsPromiseRef = useRef(null);

    const appBasePath = () => {
        const meta = document.querySelector('meta[name="app-base-url"]');
        const v = meta?.getAttribute('content') || '';
        try {
            const u = new URL(v, window.location.origin);
            return String(u.pathname || '').replace(/\/+$/, '');
        } catch {
            return '';
        }
    };

    const checkFaceEnrollmentStatus = async () => {
        try {
            const response = await fetch(endpoint('tenant/employee/face/status'), {
                credentials: 'include',
                headers: requestHeaders(),
            });
            const data = await response.json().catch(() => ({}));

            if (data?.ok) {
                setFaceEnrolled(Boolean(data.enrolled));
                setFaceEnrolledAt(data.enrolled_at || null);
            }
        } catch (err) {
            // ignore
        }
    };

    const endpoint = (path) => {
        const base = appBasePath();
        const cleanPath = String(path || '').replace(/^\/+/, '');
        return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
    };

    const faceModelsUrl = () => {
        const base = appBasePath();
        return base ? `${base}/models/face-api` : '/models/face-api';
    };

    const ensureFaceApiModels = async () => {
        if (faceApiReady) return true;
        if (faceApiModelsPromiseRef.current) {
            return faceApiModelsPromiseRef.current;
        }

        setFaceApiLoading(true);
        faceApiModelsPromiseRef.current = (async () => {
            const url = faceModelsUrl();
            await faceapi.nets.tinyFaceDetector.loadFromUri(url);
            await faceapi.nets.faceLandmark68Net.loadFromUri(url);
            await faceapi.nets.faceRecognitionNet.loadFromUri(url);
            setFaceApiReady(true);
            return true;
        })().catch((e) => {
            console.error('Failed to load face-api models:', e);
            setError('Face recognition models are not available. Please contact the administrator.');
            return false;
        }).finally(() => {
            setFaceApiLoading(false);
            faceApiModelsPromiseRef.current = null;
        });

        return faceApiModelsPromiseRef.current;
    };

    const computeFaceDescriptor = async (dataUrl) => {
        if (!dataUrl) return null;

        const ok = await ensureFaceApiModels();
        if (!ok) return null;

        const img = new Image();
        img.decoding = 'async';
        img.src = dataUrl;

        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
        });

        const detections = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (!Array.isArray(detections) || detections.length !== 1) {
            return null;
        }

        const det = detections[0];
        if (!det?.descriptor) return null;

        return Array.from(det.descriptor);
    };

    // Check confirmation/enrollment status on mount
    React.useEffect(() => {
        checkConfirmationStatus();
        checkFaceEnrollmentStatus();
        return () => {
            stopCamera();
        };
    }, []);

    const checkConfirmationStatus = async () => {
        try {
            const response = await fetch(endpoint('tenant/employee/visual-confirmation/status'), {
                credentials: 'include',
                headers: requestHeaders(),
            });
            const data = await response.json();
            
            if (data.ok) {
                setConfirmed(data.visual_confirmed);
                setConfirmedAt(data.visual_confirmed_at);
                if (data.visual_confirmed && onConfirmationComplete) {
                    onConfirmationComplete(data);
                }
            }
        } catch (err) {
            console.error('Failed to check visual confirmation status:', err);
        }
    };

    const getCookie = (name) => {
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

    const csrfTokenFromMeta = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const csrfTokenForRequest = () => {
        const meta = csrfTokenFromMeta();
        if (meta) return meta;
        const xsrf = xsrfTokenFromCookie();
        return xsrf || '';
    };

    const requestHeaders = (extra = {}) => ({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfTokenForRequest() ? { 'X-CSRF-TOKEN': csrfTokenForRequest() } : {}),
        ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
        ...extra,
    });

    const computeAHash = async (dataUrl) => {
        if (!dataUrl) return null;

        const img = new Image();
        img.decoding = 'async';
        img.src = dataUrl;

        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
        });

        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 8;
        const ctx = c.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0, 8, 8);
        const { data } = ctx.getImageData(0, 0, 8, 8);

        const grays = [];
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            grays.push(gray);
            sum += gray;
        }

        const avg = Math.round(sum / grays.length);
        let bits = '';
        for (const g of grays) {
            bits += g >= avg ? '1' : '0';
        }

        let hex = '';
        for (let i = 0; i < bits.length; i += 4) {
            hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
        }

        return hex.padStart(16, '0');
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsStreaming(true);
                setError('');

                // Ensure video metadata is loaded so capture has dimensions.
                await new Promise((resolve) => {
                    const v = videoRef.current;
                    if (!v) return resolve();
                    if (v.readyState >= 1 && v.videoWidth > 0) return resolve();
                    const onLoaded = () => {
                        v.removeEventListener('loadedmetadata', onLoaded);
                        resolve();
                    };
                    v.addEventListener('loadedmetadata', onLoaded);
                });

                try {
                    await videoRef.current.play();
                } catch {
                    // Some browsers block autoplay; user interaction already happened so usually ok.
                }
            }
        } catch (err) {
            setError('Camera access denied. Please allow camera access or use file upload.');
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Small warm-up delay improves capture reliability on some webcams.
        const doCapture = () => {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (!w || !h) {
                setError('Camera is not ready yet. Please wait 1 second and try again.');
                return;
            }

            canvas.width = w;
            canvas.height = h;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(imageData);
            stopCamera();
        };

        window.requestAnimationFrame(() => setTimeout(doCapture, 150));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target.result);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const submitConfirmation = async () => {
        if (!capturedImage) return;

        setIsProcessing(true);
        setError('');

        try {
            const hash = await computeAHash(capturedImage);
            if (!hash) {
                setError('Unable to process photo. Please try again.');
                return;
            }

            const descriptor = await computeFaceDescriptor(capturedImage);
            if (!descriptor) {
                setError('No face detected. Please try again with better lighting and keep your face centered.');
                return;
            }

            const response = await fetch(endpoint('tenant/employee/visual-confirmation'), {
                method: 'POST',
                headers: requestHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'same-origin',
                body: JSON.stringify({
                    _token: csrfTokenForRequest(),
                    image: capturedImage,
                    hash,
                    descriptor,
                    attendance_type: 'check_in' // This could be dynamic based on context
                })
            });

            const raw = await response.text();
            const data = (() => {
                try {
                    return raw ? JSON.parse(raw) : {};
                } catch {
                    return { ok: false, error: raw };
                }
            })();

            if (response.ok && data.ok) {
                setConfirmed(true);
                setConfirmedAt(data.confirmed_at);
                setCapturedImage(null);
                if (onConfirmationComplete) {
                    onConfirmationComplete(data);
                }
            } else {
                const msg = data?.error || data?.message || 'Failed to submit visual confirmation';
                setError(`${msg}${response?.status ? ` (HTTP ${response.status})` : ''}`);
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Submission error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const enrollFace = async () => {
        if (!capturedImage) return;

        setEnrollLoading(true);
        setError('');

        try {
            const hash = await computeAHash(capturedImage);
            if (!hash) {
                setError('Unable to process photo. Please try again.');
                return;
            }

            const descriptor = await computeFaceDescriptor(capturedImage);
            if (!descriptor) {
                setError('No face detected. Please try again with better lighting and keep your face centered.');
                return;
            }

            const response = await fetch(endpoint('tenant/employee/face/enroll'), {
                method: 'POST',
                headers: requestHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'same-origin',
                body: JSON.stringify({ _token: csrfTokenForRequest(), image: capturedImage, hash, descriptor }),
            });

            const raw = await response.text();
            const data = (() => {
                try {
                    return raw ? JSON.parse(raw) : {};
                } catch {
                    return { ok: false, message: raw };
                }
            })();

            if (!response.ok || !data?.ok) {
                const msg = data?.message || data?.error || 'Failed to register photo.';
                setError(`${msg}${response?.status ? ` (HTTP ${response.status})` : ''}`);
                return;
            }

            setFaceEnrolled(true);
            setFaceEnrolledAt(data?.enrolled_at || null);
            setCapturedImage(null);
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setEnrollLoading(false);
        }
    };

    const clearConfirmation = async () => {
        try {
            await fetch(endpoint('tenant/employee/visual-confirmation'), {
                method: 'DELETE',
                headers: requestHeaders(),
                credentials: 'include'
            });
        } catch (err) {
            console.error('Failed to clear visual confirmation:', err);
        }

        setConfirmed(false);
        setConfirmedAt(null);
        setCapturedImage(null);
        if (onConfirmationClear) {
            onConfirmationClear();
        }
    };

    const resetCapture = () => {
        setCapturedImage(null);
        setError('');
    };

    if (confirmed && confirmedAt) {
        const confirmedTime = new Date(confirmedAt);
        const isExpired = (Date.now() - confirmedTime.getTime()) > (5 * 60 * 1000); // 5 minutes

        if (isExpired) {
            setConfirmed(false);
            setConfirmedAt(null);
        } else {
            return (
                <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 ${className}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div>
                                <p className="text-green-800 dark:text-green-200 font-medium">Visual confirmation completed</p>
                                <p className="text-green-600 dark:text-green-300 text-sm">
                                    Confirmed at {confirmedTime.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={clearConfirmation}
                            className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200 p-1"
                            title="Clear confirmation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Visual Confirmation {required && <span className="text-red-500">*</span>}
                </h3>
                {message && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
                )}
                {!faceEnrolled && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        You must register a reference photo first.
                    </p>
                )}
            </div>

            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {!capturedImage ? (
                <div className="space-y-4">
                    {/* Camera View */}
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: '320px' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 w-full h-full object-cover ${isStreaming ? '' : 'hidden'}`}
                        />

                        {isStreaming ? (
                            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center space-x-4">
                                <button
                                    onClick={capturePhoto}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Capture Photo</span>
                                </button>
                                <button
                                    onClick={stopCamera}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                                >
                                    <CameraOff className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8">
                                <Camera className="w-16 h-16 text-gray-400 mb-4" />
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                                    {faceEnrolled ? 'Step 2: Take a photo to verify your face' : 'Step 1: Take a photo to register your face'}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={startCamera}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                                    >
                                        <Camera className="w-4 h-4" />
                                        <span>Open Camera</span>
                                    </button>
                                    <label className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Photo</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Captured Image Preview */}
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                            src={capturedImage}
                            alt="Captured confirmation"
                            className="w-full h-auto max-h-96 object-contain"
                        />
                        <button
                            onClick={resetCapture}
                            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                            title="Retake photo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center">
                        {!faceEnrolled ? (
                            <button
                                onClick={enrollFace}
                                disabled={enrollLoading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                {enrollLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Registering...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Register Photo</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={submitConfirmation}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Verify & Continue</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={enrollFace}
                                    disabled={enrollLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                                >
                                    {enrollLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Update Registered Photo</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default VisualConfirmation;
