import { Head, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { FiChevronDown, FiLogOut, FiUser, FiUsers, FiHome } from 'react-icons/fi';

export default function TenantDashboard({ users, tenant_db }) {
    const { auth } = usePage().props;
    const me = auth?.user || {};
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const totalUsers = Array.isArray(users) ? users.length : 0;
    const latestUsers = useMemo(() => (Array.isArray(users) ? users.slice(0, 10) : []), [users]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head title="Dashboard" />

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                                Tenant Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Welcome back</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 dark:from-slate-300 dark:to-slate-500 flex items-center justify-center text-white font-medium shadow-lg">
                                    {getInitials(me?.name || 'User')}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="font-medium">{me?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{me?.role}</div>
                                </div>
                                <FiChevronDown className="h-4 w-4" />
                            </button>

                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <a
                                                href={route('profile.edit')}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <FiUser className="mr-3 h-5 w-5 text-gray-400" /> Your Profile
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => Inertia.post(route('logout'))}
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <FiLogOut className="mr-3 h-5 w-5" /> Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Workspace</p>
                                <p className="text-2xl font-bold">Tenant</p>
                            </div>
                            <FiHome className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connected</p>
                        <p className="text-lg font-semibold">Tenant ID: <span className="font-mono">{me?.tenant_id}</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">DB: <span className="font-mono">{tenant_db}</span></p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-fit">
                        <nav className="space-y-1">
                            <button
                                type="button"
                                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-md transform scale-105"
                            >
                                <FiUsers className="mr-2" /> Users
                            </button>
                        </nav>
                    </aside>

                    <section className="flex-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold">Users in this Tenant</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total: {totalUsers}</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {latestUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono">{u.id}</td>
                                                <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                                            </tr>
                                        ))}
                                        {latestUsers.length === 0 && (
                                            <tr>
                                                <td className="px-6 py-10 text-center text-gray-500 dark:text-gray-400" colSpan="3">No users found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
