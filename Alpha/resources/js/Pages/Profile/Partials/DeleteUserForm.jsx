import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden ${className}`}>
            <div className="p-6 sm:px-8">
                <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                        Delete Account
                    </h2>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Once your account is deleted, all of its resources and data will be permanently deleted. 
                    Before deleting your account, please download any data or information you wish to retain.
                </p>

                <DangerButton 
                    onClick={confirmUserDeletion}
                    className="px-4 py-2 text-sm font-medium"
                >
                    Delete Account
                </DangerButton>

                <Modal show={confirmingUserDeletion} onClose={closeModal}>
                    <div className="p-6 sm:p-8">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Delete Account
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Are you sure you want to delete your account? This action cannot be undone. 
                                        All of your data will be permanently removed from our servers forever.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={deleteUser} className="mt-6 space-y-6">
                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    isFocused
                                    placeholder="Enter your password to confirm"
                                />
                                <InputError
                                    message={errors.password}
                                    className="mt-1 text-sm"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <DangerButton
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium"
                                    disabled={processing}
                                >
                                    {processing ? 'Deleting...' : 'Delete Account'}
                                </DangerButton>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
