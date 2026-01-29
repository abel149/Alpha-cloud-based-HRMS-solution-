import { usePage } from '@inertiajs/inertia-react';
import { useEffect, useMemo, useState } from 'react';

export default function FlashMessages({ variant = 'default' }) {
    const { flash, errors } = usePage().props;

    const [dismissedSuccess, setDismissedSuccess] = useState(false);
    const [dismissedError, setDismissedError] = useState(false);
    const [dismissedValidation, setDismissedValidation] = useState(false);

    const successMessage = useMemo(() => {
        return flash?.success || flash?.status || null;
    }, [flash?.success, flash?.status]);

    useEffect(() => {
        if (successMessage) {
            setDismissedSuccess(false);
        }
    }, [successMessage]);

    useEffect(() => {
        if (flash?.error) {
            setDismissedError(false);
        }
    }, [flash?.error]);

    const genericError = useMemo(() => {
        if (flash?.error) return null;
        if (!errors || typeof errors !== 'object') return null;

        const v = errors.error ?? errors.message;
        if (!v) return null;
        if (Array.isArray(v)) return String(v[0] ?? '');
        return String(v);
    }, [errors, flash?.error]);

    const errorList = useMemo(() => {
        if (!errors || typeof errors !== 'object') return [];
        return Object.entries(errors)
            .filter(([key]) => key !== 'error' && key !== 'message')
            .flatMap(([, v]) => (Array.isArray(v) ? v : [v]))
            .map((v) => String(v))
            .filter(Boolean);
    }, [errors]);

    useEffect(() => {
        if (errorList.length > 0) {
            setDismissedValidation(false);
        }
    }, [errorList.length]);

    const wrapClassName =
        variant === 'compact'
            ? 'mb-4'
            : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6';

    const hasSuccess = Boolean(successMessage) && !dismissedSuccess;
    const hasError = (Boolean(flash?.error) || Boolean(genericError)) && !dismissedError;
    const hasValidation = errorList.length > 0 && !dismissedValidation;

    useEffect(() => {
        if (hasSuccess || hasError || hasValidation) {
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch {
                window.scrollTo(0, 0);
            }
        }
    }, [hasSuccess, hasError, hasValidation]);

    if (!hasSuccess && !hasError && !hasValidation) {
        return null;
    }

    return (
        <div className={wrapClassName}>
            <div className="space-y-3">
                {hasSuccess && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm flex items-start justify-between gap-4">
                        <div className="font-medium">{successMessage}</div>
                        <button
                            type="button"
                            onClick={() => setDismissedSuccess(true)}
                            className="shrink-0 rounded px-2 py-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                            Close
                        </button>
                    </div>
                )}

                {hasError && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm flex items-start justify-between gap-4">
                        <div className="font-medium">{flash?.error || genericError}</div>
                        <button
                            type="button"
                            onClick={() => setDismissedError(true)}
                            className="shrink-0 rounded px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                            Close
                        </button>
                    </div>
                )}

                {hasValidation && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="font-semibold">Please fix the following:</div>
                            <button
                                type="button"
                                onClick={() => setDismissedValidation(true)}
                                className="shrink-0 rounded px-2 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                            >
                                Close
                            </button>
                        </div>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                            {errorList.slice(0, 8).map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
