import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

export default function EmployeeDashboard({ user, tenant_db }) {
    const [wifiOnline, setWifiOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [fingerVerified, setFingerVerified] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState('Not checked in');
    const [lastCheckIn, setLastCheckIn] = useState(null);
    const [lastCheckOut, setLastCheckOut] = useState(null);

    useEffect(() => {
        const handleOnline = () => setWifiOnline(true);
        const handleOffline = () => setWifiOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const simulateFingerprintScan = () => {
        // purely frontend simulation of fingerprint verification
        setFingerVerified(true);
        setTimeout(() => {
            setFingerVerified(false);
        }, 5 * 60 * 1000); // auto-expire after 5 minutes
    };

    const canMarkAttendance = wifiOnline && fingerVerified;

    const handleCheckIn = () => {
        if (!canMarkAttendance) return;
        const now = new Date();
        setAttendanceStatus('Checked in');
        setLastCheckIn(now.toLocaleTimeString());
    };

    const handleCheckOut = () => {
        if (!canMarkAttendance) return;
        const now = new Date();
        setAttendanceStatus('Checked out');
        setLastCheckOut(now.toLocaleTimeString());
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    Employee Portal
                </h2>
            }
        >
            <Head title="Employee" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/80 mb-1">Today</p>
                                <p className="text-2xl font-bold">{attendanceStatus === 'Checked in' ? 'On duty' : 'Off duty'}</p>
                            </div>
                            <div className="text-xs text-white/80 text-right">
                                {lastCheckIn && <p>In: {lastCheckIn}</p>}
                                {lastCheckOut && <p>Out: {lastCheckOut}</p>}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/80 mb-1">Attendance</p>
                                <p className="text-2xl font-bold">This Month</p>
                            </div>
                            <p className="text-xs text-white/80">Detailed charts coming soon</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/80 mb-1">Leave Balance</p>
                                <p className="text-2xl font-bold">—</p>
                            </div>
                            <p className="text-xs text-white/80">Synced with HR policies</p>
                        </div>
                    </div>

                    {/* Top info */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Logged in as</p>
                            <p className="font-semibold text-gray-900">
                                {user?.name} <span className="text-xs text-gray-500">({user?.role})</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Tenant DB: {tenant_db}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 md:mt-0">
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    wifiOnline
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full mr-2 ${wifiOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                                Wi-Fi {wifiOnline ? 'Online' : 'Offline'}
                            </span>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    fingerVerified
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full mr-2 ${fingerVerified ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                                Fingerprint {fingerVerified ? 'Verified' : 'Not verified'}
                            </span>
                        </div>
                    </div>

                    {/* Main grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Attendance card */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-1">Attendance & Check-in</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Attendance requires both active Wi-Fi and fingerprint verification.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-gray-50">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Current status</p>
                                        <p className="text-base font-semibold text-gray-900">{attendanceStatus}</p>
                                        <div className="mt-3 text-xs text-gray-500 space-y-1">
                                            {lastCheckIn && (
                                                <p>Last check-in: {lastCheckIn}</p>
                                            )}
                                            {lastCheckOut && (
                                                <p>Last check-out: {lastCheckOut}</p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={simulateFingerprintScan}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {fingerVerified ? 'Fingerprint Verified' : 'Verify Fingerprint'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={handleCheckIn}
                                        disabled={!canMarkAttendance}
                                        className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-semibold text-white ${
                                            canMarkAttendance ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                    >
                                        Check In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCheckOut}
                                        disabled={!canMarkAttendance}
                                        className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-semibold text-white ${
                                            canMarkAttendance ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                    >
                                        Check Out
                                    </button>
                                    {!canMarkAttendance && (
                                        <p className="text-xs text-red-500 mt-2">
                                            To mark attendance, ensure you are online and fingerprint is verified.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile & leave/pay slips side column */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-2">Personal Profile</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Manage your basic personal details.
                                </p>
                                <div className="space-y-3 text-sm text-gray-700">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-medium">{user?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-medium">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-2">Leave & Pay Slips</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Overview of your leave and pay slip history (UI shell, ready to connect to backend).
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                    <li>Submit and track leave requests</li>
                                    <li>See remaining leave balance</li>
                                    <li>View/download monthly pay slips</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
