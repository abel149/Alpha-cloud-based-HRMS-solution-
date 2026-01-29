export default function LoadingButton({
    type = 'button',
    loading = false,
    disabled = false,
    className = '',
    children,
    loadingText = 'Loading…',
    ...props
}) {
    const isDisabled = disabled || loading;

    return (
        <button
            {...props}
            type={type}
            disabled={isDisabled}
            aria-busy={loading ? 'true' : 'false'}
            className={
                `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ` +
                `${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''} ` +
                className
            }
        >
            {loading && (
                <span
                    className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}
            <span>{loading ? loadingText : children}</span>
        </button>
    );
}
