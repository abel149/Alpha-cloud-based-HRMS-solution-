import { Head } from '@inertiajs/inertia-react';
import FlashMessages from '@/Components/FlashMessages';

export default function ProfileLayout({ children, title }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Head title={title} />
            <FlashMessages />
            <main>{children}</main>
        </div>
    );
}
