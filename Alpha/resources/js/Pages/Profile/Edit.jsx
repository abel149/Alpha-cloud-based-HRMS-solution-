import ProfileLayout from '@/Layouts/ProfileLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useState } from 'react';
import { FiHome, FiUser, FiLock, FiTrash2, FiChevronRight, FiShield } from 'react-icons/fi';
export default function Edit({ mustVerifyEmail, status, auth }) {
    const [activeTab, setActiveTab] = useState('profile');
    const { user } = auth;

    // Function to get user initials
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <ProfileLayout title="Profile Settings">

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Profile Header */}
                    <div className="md:flex md:items-center md:justify-between mb-8">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                                Account Settings
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage your account settings and preferences
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <div className="md:flex">
                            {/* Sidebar Navigation */}
                            <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-medium">
                                                {getInitials(user.name)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                                {user.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <nav className="space-y-1 px-2 pb-4">
                                    <button
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                                            activeTab === 'dashboard'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <FiHome className={`mr-3 h-5 w-5 ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-400'}`} />
                                        Dashboard
                                        <FiChevronRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                    </button>
                                    
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                    
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                                            activeTab === 'profile'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <FiUser className={`mr-3 h-5 w-5 ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-400'}`} />
                                        Profile Information
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('password')}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                                            activeTab === 'password'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <FiLock className={`mr-3 h-5 w-5 ${activeTab === 'password' ? 'text-blue-500' : 'text-gray-400'}`} />
                                        Update Password
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('delete')}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                                            activeTab === 'delete'
                                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <FiTrash2 className={`mr-3 h-5 w-5 ${activeTab === 'delete' ? 'text-red-500' : 'text-gray-400'}`} />
                                        Delete Account
                                    </button>
                                </nav>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 p-6">
                                <div className="max-w-2xl mx-auto">
                                    {activeTab === 'dashboard' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard</h3>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    Overview of your account and recent activities.
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-medium">Welcome back, {auth.user.name}!</h3>
                                                <p className="text-gray-600">
                                                    Manage your profile information, update your password, or delete your account.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'profile' && (
                                        <UpdateProfileInformationForm
                                            mustVerifyEmail={mustVerifyEmail}
                                            status={status}
                                            className="max-w-xl"
                                        />
                                    )}
                                    {activeTab === 'password' && (
                                        <UpdatePasswordForm className="max-w-xl" />
                                    )}

                                    {activeTab === 'delete' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Account</h3>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    Permanently delete your account and all of your data.
                                                </p>
                                            </div>
                                            <DeleteUserForm />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProfileLayout>
    );
}
