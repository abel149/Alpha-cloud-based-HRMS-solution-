import { Head, useForm, Link } from '@inertiajs/inertia-react';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        
         <div>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="w-full max-w-md">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link 
                            href={route('login')} 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4 mr-1" />
                            Back to login
                        </Link>
                    </div>

                    {/* Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Reset Your Password
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Enter your email and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                                {status}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <InputLabel 
                                    htmlFor="email" 
                                    value="Email Address" 
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                />
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="your@email.com"
                                        autoComplete="email"
                                        required
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1 text-sm" />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <PrimaryButton 
                                    className="w-full justify-center py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                    disabled={processing}
                                >
                                    <FiSend className="w-4 h-4 mr-2" />
                                    {processing ? 'Sending...' : 'Send Reset Link'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Remember your password?{' '}
                            <Link 
                                href={route('login')}
                                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
      </div>
    );
}
