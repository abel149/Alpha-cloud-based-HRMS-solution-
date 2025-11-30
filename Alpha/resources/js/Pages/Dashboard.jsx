import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth }) {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            <Head title="Dashboard" />

            {/* Header with logout button */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        
                        {/* Profile Section */}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Welcome, {auth.user.name}
                            </span>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                            >
                                Sign out
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <svg 
                                    className="w-8 h-8 text-blue-600 dark:text-blue-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M5 13l4 4L19 7" 
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                You're logged in!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Welcome to your dashboard. You've successfully accessed the Superadmin area please signout to signin again.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}