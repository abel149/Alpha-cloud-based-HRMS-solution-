import { Link } from '@inertiajs/inertia-react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 focus:border-indigo-700 focus:bg-indigo-100 dark:focus:bg-indigo-900/40 focus:text-indigo-800 dark:focus:text-indigo-100'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white focus:border-gray-300 dark:focus:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-800 focus:text-gray-800 dark:focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
