import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformationForm({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden ${className}`}>
            <div className="p-6 sm:px-8">
                <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                        Profile Information
                    </h2>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Update your account's profile information and email address.
                </p>

                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-2">
                        <InputLabel htmlFor="name" value="Name" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            autoComplete="name"
                        />
                        <InputError className="mt-1 text-sm" message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="email" value="Email" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-1 text-sm" message={errors.email} />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                Your email address is unverified.
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="ml-1 font-medium text-yellow-700 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 rounded"
                                >
                                    Click here to re-send the verification email.
                                </Link>
                            </p>
                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end">
                        <div className="flex items-center space-x-4">
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out duration-150"
                                enterFrom="opacity-0 -translate-x-2"
                                enterTo="opacity-100 translate-x-0"
                                leave="transition ease-in-out duration-150"
                                leaveFrom="opacity-100 translate-x-0"
                                leaveTo="opacity-0 translate-x-2"
                            >
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                            </Transition>
                            <PrimaryButton 
                                className="px-4 py-2 text-sm font-medium"
                                disabled={processing}
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
