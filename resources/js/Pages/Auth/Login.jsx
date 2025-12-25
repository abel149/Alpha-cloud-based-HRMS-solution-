import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiLogIn, FiUser, FiLock, FiBriefcase, FiChevronDown, FiArrowLeft } from 'react-icons/fi';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        tenant_id: '',   
        email: '',
        password: '',
        role: 'employee',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (

            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="w-full max-w-md">
                            {/* Back Button */}
                    <div className="mt-2 ">
                        <Link 
                            href="/"
                            className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Logo and Title */}
                    <div className="text-center mb-3">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
                
                    </div>

                    {status && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                            {status}
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                        <form onSubmit={submit} className="space-y-5">
                            {/* Tenant ID */}
                            <div className="relative">
                                <InputLabel htmlFor="tenant_id" value="Tenant ID" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" />
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiBriefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="tenant_id"
                                        type="text"
                                        name="tenant_id"
                                        value={data.tenant_id}
                                        className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Your company ID"
                                        autoComplete="off"
                                        onChange={(e) => setData('tenant_id', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.tenant_id} className="mt-1 text-sm" />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <InputLabel htmlFor="email" value="Email Address" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" />
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="your@email.com"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1 text-sm" />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <InputLabel htmlFor="password" value="Password" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
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
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-1 text-sm" />
                            </div>

                            {/* Role */}
                            <div className="relative">
                                <InputLabel htmlFor="role" value="Login As" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" />
                                <div className="relative">
                                    <select
                                        id="role"
                                        name="role"
                                        value={data.role}
                                        className="appearance-none pl-10 pr-10 py-2.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                        onChange={(e) => setData('role', e.target.value)}
                                    >
                                        <option value="company_admin">Company Admin</option>
                                        <option value="hr_manager">HR Manager</option>
                                        <option value="finance_manager">Finance Manager</option>
                                        <option value="department_manager">Department Manager</option>
                                        <option value="employee">Employee</option>
                                        <option value="Super_admin">Super Admin</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FiChevronDown className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <InputError message={errors.role} className="mt-1 text-sm" />
                            </div>

                            {/* Remember Me & Submit */}
                            <div className="flex items-center justify-between mt-6">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Remember me
                                    </span>
                                </label>

                                <PrimaryButton 
                                    className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                    disabled={processing}
                                >
                                    <FiLogIn className="w-4 h-4 mr-2" />
                                    {processing ? 'Signing in...' : 'Sign In'}
                                </PrimaryButton>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Don't have an account?{' '}
                                    <Link 
                                        href={route('tenant.apply')} 
                                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Get started
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        
    );
}