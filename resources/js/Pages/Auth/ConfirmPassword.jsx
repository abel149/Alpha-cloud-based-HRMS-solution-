import { Head, useForm, Link } from '@inertiajs/inertia-react';
import { FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <div className="mb-6">
                    <Link 
                        href={route('login')}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Confirm Password
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            This is a secure area of the application. Please confirm your
                            password before continuing.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-6">
                        {/* Password Field */}
                        <div className="space-y-2">
                            <InputLabel 
                                htmlFor="password" 
                                value="Password" 
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    isFocused={true}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1 text-sm" />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <PrimaryButton 
                                className="w-full justify-center py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                disabled={processing}
                            >
                                <FiCheckCircle className="w-4 h-4 mr-2" />
                                {processing ? 'Verifying...' : 'Confirm Password'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
