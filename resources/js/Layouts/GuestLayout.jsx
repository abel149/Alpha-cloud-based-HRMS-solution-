import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashMessages from '@/Components/FlashMessages';
import { Link } from '@inertiajs/inertia-react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-gray-950 pt-6 sm:justify-center sm:pt-0 text-gray-900 dark:text-white">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500 dark:text-gray-300" />
                </Link>
            </div>

            <div className="w-full">
                <FlashMessages variant="compact" />
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white dark:bg-gray-900 px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg border border-gray-200 dark:border-gray-800">
                {children}
            </div>
        </div>
    );
}
