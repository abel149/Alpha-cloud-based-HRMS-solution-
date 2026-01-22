import React, { useMemo } from 'react';

export default function PaginationControls({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 25, 50],
    className = '',
}) {
    const totalPages = useMemo(() => Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 1))), [total, pageSize]);

    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const from = total === 0 ? 0 : ((safePage - 1) * pageSize + 1);
    const to = Math.min(safePage * pageSize, total);

    const canPrev = safePage > 1;
    const canNext = safePage < totalPages;

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
        >
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{from}</span>
                {' '}to <span className="font-semibold text-gray-900 dark:text-white">{to}</span>
                {' '}of <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rows</span>
                    <select
                        value={String(pageSize)}
                        onChange={(e) => onPageSizeChange?.(Number(e.target.value) || 10)}
                        className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                    >
                        {pageSizeOptions.map((n) => (
                            <option key={n} value={String(n)}>{n}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange?.(safePage - 1)}
                    disabled={!canPrev}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Prev
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
                    Page <span className="font-semibold text-gray-900 dark:text-white">{safePage}</span> / {totalPages}
                </div>
                <button
                    type="button"
                    onClick={() => onPageChange?.(safePage + 1)}
                    disabled={!canNext}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
