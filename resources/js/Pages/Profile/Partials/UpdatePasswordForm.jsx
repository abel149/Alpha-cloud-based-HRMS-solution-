import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/inertia-react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden ${className}`}>
            <div className="p-6 sm:px-8">
                <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                        Update Password
                    </h2>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Ensure your account is using a long, random password to stay secure.
                </p>

                <form onSubmit={updatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <InputLabel 
                            htmlFor="current_password" 
                            value="Current Password" 
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type="password"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoComplete="current-password"
                        />
                        <InputError
                            message={errors.current_password}
                            className="mt-1 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <InputLabel 
                            htmlFor="password" 
                            value="New Password" 
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoComplete="new-password"
                        />
                        <InputError 
                            message={errors.password} 
                            className="mt-1 text-sm" 
                        />
                    </div>

                    <div className="space-y-2">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm New Password"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type="password"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoComplete="new-password"
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-1 text-sm"
                        />
                    </div>

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
                                {processing ? 'Updating...' : 'Update Password'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
