import { Head } from '@inertiajs/react';

export default function ProfileLayout({ children, title }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Head title={title} />
            <main>{children}</main>
        </div>
    );
}
