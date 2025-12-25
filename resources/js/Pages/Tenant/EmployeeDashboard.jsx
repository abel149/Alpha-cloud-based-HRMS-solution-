import { Head } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { FiHome, FiChevronDown, FiLogOut, FiUser, FiClock, FiCalendar, FiFileText, FiCheck } from 'react-icons/fi';

export default function EmployeeDashboard({ user }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [wifiOnline, setWifiOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [fingerVerified, setFingerVerified] = useState(false);
    const [companyWifiVerified, setCompanyWifiVerified] = useState(false);
    const [wifiCheckLoading, setWifiCheckLoading] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState('Not checked in');
    const [lastCheckIn, setLastCheckIn] = useState(null);
    const [lastCheckOut, setLastCheckOut] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [attendanceSubmitLoading, setAttendanceSubmitLoading] = useState(false);

    const [attendancePolicy, setAttendancePolicy] = useState({
        requires_company_wifi: false,
        requires_fingerprint: false,
        policy_name: '',
    });
    const [policyLoading, setPolicyLoading] = useState(false);

    const [leaveForm, setLeaveForm] = useState({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveError, setLeaveError] = useState('');
    const [leaveSuccess, setLeaveSuccess] = useState('');

    const [payslips] = useState([
        { id: 1, month: '2025-11', amount: '—', status: 'Available' },
        { id: 2, month: '2025-10', amount: '—', status: 'Available' },
        { id: 3, month: '2025-09', amount: '—', status: 'Processing' },
    ]);

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <FiHome className="mr-2" /> },
        { key: 'attendance', label: 'Attendance', icon: <FiClock className="mr-2" /> },
        { key: 'leave', label: 'Leave', icon: <FiCalendar className="mr-2" /> },
        { key: 'payslips', label: 'Pay Slips', icon: <FiFileText className="mr-2" /> },
    ];

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

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

    useEffect(() => {
        const fetchLeaveRequests = async () => {
            try {
                const res = await fetch(route('tenant.employee.leave.index'), {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data?.ok) {
                    setLeaveRequests(Array.isArray(data.requests) ? data.requests : []);
                }
            } catch (e) {
                // ignore
            }
        };

        fetchLeaveRequests();
    }, []);

    useEffect(() => {
        const fetchPolicy = async () => {
            setPolicyLoading(true);
            try {
                const res = await fetch(route('tenant.attendance.policy'), {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                const p = data?.policy || {};
                setAttendancePolicy({
                    requires_company_wifi: Boolean(p?.requires_company_wifi),
                    requires_fingerprint: Boolean(p?.requires_fingerprint),
                    policy_name: p?.policy_name || '',
                });
            } catch (e) {
                // ignore - keep defaults
            } finally {
                setPolicyLoading(false);
            }
        };

        fetchPolicy();
    }, []);

    const simulateFingerprintScan = () => {
        // purely frontend simulation of fingerprint verification
        setFingerVerified(true);
        setTimeout(() => {
            setFingerVerified(false);
        }, 5 * 60 * 1000); // auto-expire after 5 minutes
    };

    const verifyCompanyWifi = async () => {
        if (!attendancePolicy.requires_company_wifi) {
            setCompanyWifiVerified(true);
            return;
        }
        setWifiCheckLoading(true);
        try {
            const res = await fetch(route('tenant.wifi.check'), {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                setCompanyWifiVerified(false);
                return;
            }

            const data = await res.json();
            setCompanyWifiVerified(Boolean(data?.ok));
        } catch (e) {
            setCompanyWifiVerified(false);
        } finally {
            setWifiCheckLoading(false);
        }
    };

    const canMarkAttendance = (!attendancePolicy.requires_fingerprint || fingerVerified)
        && (!attendancePolicy.requires_company_wifi || companyWifiVerified);

    const getCsrfToken = () => {
        const el = document.querySelector('meta[name="csrf-token"]');
        return el ? el.getAttribute('content') : '';
    };

    const submitAttendance = async (type) => {
        if (!canMarkAttendance) return;

        if (type === 'check_in' && attendanceStatus === 'Checked in') return;
        if (type === 'check_out' && attendanceStatus !== 'Checked in') return;

        setAttendanceSubmitLoading(true);
        try {
            const res = await fetch(
                type === 'check_in' ? route('tenant.employee.attendance.check_in') : route('tenant.employee.attendance.check_out'),
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ fingerprint_verified: fingerVerified }),
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
                return;
            }

            const now = new Date();
            if (type === 'check_in') {
                setAttendanceStatus('Checked in');
                setLastCheckIn(now.toLocaleTimeString());
            } else {
                setAttendanceStatus('Checked out');
                setLastCheckOut(now.toLocaleTimeString());
            }

            setAttendanceHistory((prev) => [
                {
                    id: data?.log?.id || `${now.getTime()}-${type}`,
                    type: type === 'check_in' ? 'Check In' : 'Check Out',
                    time: now.toLocaleString(),
                },
                ...prev,
            ]);
        } catch (e) {
            // ignore
        } finally {
            setAttendanceSubmitLoading(false);
        }
    };

    const handleCheckIn = () => submitAttendance('check_in');
    const handleCheckOut = () => submitAttendance('check_out');

    const handleLeaveChange = (e) => {
        setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
    };

    const submitLeaveRequest = (e) => {
        e.preventDefault();
        setLeaveError('');
        setLeaveSuccess('');

        if (!leaveForm.start_date || !leaveForm.end_date) {
            setLeaveError('Start date and end date are required.');
            return;
        }

        const start = new Date(leaveForm.start_date);
        const end = new Date(leaveForm.end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
            setLeaveError('Please provide a valid date range.');
            return;
        }

        fetch(route('tenant.employee.leave.store'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                leave_type: leaveForm.leave_type,
                start_date: leaveForm.start_date,
                end_date: leaveForm.end_date,
                reason: leaveForm.reason,
            }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.ok) {
                    setLeaveError(data?.message || 'Failed to submit leave request.');
                    return;
                }

                setLeaveRequests((prev) => [data.leave, ...prev]);
                setLeaveForm({
                    leave_type: 'annual',
                    start_date: '',
                    end_date: '',
                    reason: '',
                });
                setLeaveSuccess('Leave request submitted.');
            })
            .catch(() => {
                setLeaveError('Failed to submit leave request.');
            });
    };

    const viewLeaveRequest = (req) => {
        alert(`Leave request (${req.status})\n${req.start_date} → ${req.end_date}\nType: ${req.leave_type}${req.reason ? `\nReason: ${req.reason}` : ''}`);
    };

    const cancelLeaveRequest = (id) => {
        setLeaveError('Cancel is not available yet.');
    };

    const viewPayslip = (p) => {
        alert(`Viewing payslip for ${p.month} (demo).`);
    };

    const downloadPayslip = (p) => {
        alert(`Downloading payslip for ${p.month} (demo).`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head title="Employee" />

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Employee Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {user?.name}
                            </p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-medium shadow-lg">
                                    {getInitials(user?.name)}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                                </div>
                                <FiChevronDown className="h-4 w-4 text-gray-400" />
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
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Today</p>
                                <p className="text-3xl font-bold">{attendanceStatus === 'Checked in' ? 'On duty' : 'Off duty'}</p>
                            </div>
                            <div className="text-xs text-white/80 text-right">
                                {lastCheckIn && <p>In: {lastCheckIn}</p>}
                                {lastCheckOut && <p>Out: {lastCheckOut}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Attendance</p>
                                <p className="text-3xl font-bold">Check In/Out</p>
                            </div>
                            <FiClock className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Leave</p>
                                <p className="text-3xl font-bold">Requests</p>
                            </div>
                            <FiCalendar className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Security</p>
                                <p className="text-3xl font-bold">{canMarkAttendance ? 'Ready' : 'Locked'}</p>
                            </div>
                            <FiCheck className="h-10 w-10 text-white/80" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-fit">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === tab.key
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="flex-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {policyLoading ? 'Loading policy…' : (attendancePolicy.policy_name || 'Attendance Policy')}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            wifiOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        } dark:bg-opacity-20 dark:text-white`}
                                    >
                                        <span className={`h-2 w-2 rounded-full mr-2 ${wifiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        Internet
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            companyWifiVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                        } dark:bg-opacity-20 dark:text-white`}
                                    >
                                        <span className={`h-2 w-2 rounded-full mr-2 ${companyWifiVerified ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        Company Wi‑Fi{attendancePolicy.requires_company_wifi ? '' : ' (Not required)'}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            fingerVerified ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                                        } dark:bg-opacity-20 dark:text-white`}
                                    >
                                        <span className={`h-2 w-2 rounded-full mr-2 ${fingerVerified ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                                        Fingerprint{attendancePolicy.requires_fingerprint ? '' : ' (Not required)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'overview' && (
                            <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold mb-1">Quick Actions</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Go straight to the actions you use most.</p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Attendance</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{attendanceStatus}</p>
                                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                            {lastCheckIn && <p>Last check-in: {lastCheckIn}</p>}
                                            {lastCheckOut && <p>Last check-out: {lastCheckOut}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('attendance')}
                                            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Go to Check In/Out
                                        </button>
                                    </div>
                                    <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Leave Requests</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{leaveRequests.length} submitted</p>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Submit a new request and track status.</p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('leave')}
                                            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700"
                                        >
                                            Submit Leave Request
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Profile & leave/pay slips side column */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold mb-2">Pay Slips</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">View your recent pay slips.</p>
                                    <div className="space-y-2">
                                        {payslips.slice(0, 2).map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.month}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.status}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('payslips')}
                                                    className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                        {activeTab === 'attendance' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold mb-1">Attendance</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {policyLoading
                                        ? 'Loading policy...'
                                        : (attendancePolicy.policy_name ? `${attendancePolicy.policy_name} • ` : '')
                                    }
                                    {attendancePolicy.requires_company_wifi && attendancePolicy.requires_fingerprint
                                        ? 'Requires Company Wi‑Fi and Fingerprint.'
                                        : attendancePolicy.requires_company_wifi
                                            ? 'Requires Company Wi‑Fi.'
                                            : attendancePolicy.requires_fingerprint
                                                ? 'Requires Fingerprint.'
                                                : 'No extra restrictions.'}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Current status</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">{attendanceStatus}</p>
                                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                {lastCheckIn && <p>Last check-in: {lastCheckIn}</p>}
                                                {lastCheckOut && <p>Last check-out: {lastCheckOut}</p>}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={simulateFingerprintScan}
                                            disabled={!attendancePolicy.requires_fingerprint}
                                            className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {!attendancePolicy.requires_fingerprint
                                                ? 'Fingerprint Not Required'
                                                : (fingerVerified ? 'Fingerprint Verified' : 'Verify Fingerprint')}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={verifyCompanyWifi}
                                            disabled={wifiCheckLoading || !attendancePolicy.requires_company_wifi}
                                            className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
                                                wifiCheckLoading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                        >
                                            {!attendancePolicy.requires_company_wifi
                                                ? 'Company Wi‑Fi Not Required'
                                                : (companyWifiVerified ? 'Company Wi‑Fi Verified' : (wifiCheckLoading ? 'Checking...' : 'Verify Company Wi‑Fi'))}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={handleCheckIn}
                                            disabled={!canMarkAttendance || attendanceStatus === 'Checked in'}
                                            className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-semibold text-white ${
                                                canMarkAttendance && attendanceStatus !== 'Checked in'
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            Check In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCheckOut}
                                            disabled={!canMarkAttendance || attendanceStatus !== 'Checked in'}
                                            className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-semibold text-white ${
                                                canMarkAttendance && attendanceStatus === 'Checked in'
                                                    ? 'bg-red-600 hover:bg-red-700'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            Check Out
                                        </button>
                                        {!canMarkAttendance && (
                                            <p className="text-xs text-red-500 mt-2">
                                                Attendance requirements are not satisfied.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold">History</h3>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('overview')}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                                    >
                                        Back
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {attendanceHistory.length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">No attendance actions yet.</div>
                                    ) : (
                                        attendanceHistory.slice(0, 8).map((row) => (
                                            <div key={row.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.type}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.time}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                        {activeTab === 'leave' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold mb-1">Submit Leave Request</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Submit a leave request to HR (demo UI).</p>

                                {leaveError && (
                                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                                        {leaveError}
                                    </div>
                                )}
                                {leaveSuccess && (
                                    <div className="mb-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-200">
                                        {leaveSuccess}
                                    </div>
                                )}

                                <form onSubmit={submitLeaveRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Leave Type</label>
                                        <select
                                            name="leave_type"
                                            value={leaveForm.leave_type}
                                            onChange={handleLeaveChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="annual">Annual Leave</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="unpaid">Unpaid Leave</option>
                                            <option value="maternity">Maternity/Paternity</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="hidden md:block" />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            value={leaveForm.start_date}
                                            onChange={handleLeaveChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={leaveForm.end_date}
                                            onChange={handleLeaveChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Reason (optional)</label>
                                        <textarea
                                            name="reason"
                                            value={leaveForm.reason}
                                            onChange={handleLeaveChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('overview')}
                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Submit Request
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold mb-3">My Requests</h3>
                                <div className="space-y-2">
                                    {leaveRequests.length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">No leave requests yet.</div>
                                    ) : (
                                        leaveRequests.slice(0, 6).map((r) => (
                                            <div key={r.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.leave_type}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{r.start_date} → {r.end_date}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Submitted: {r.submitted_at}</div>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                        {r.status}
                                                    </span>
                                                </div>
                                                {r.reason ? (
                                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">{r.reason}</div>
                                                ) : null}
                                                <div className="mt-3 flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => viewLeaveRequest(r)}
                                                        className="px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                                                    >
                                                        View
                                                    </button>
                                                    {r.status === 'Pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelLeaveRequest(r.id)}
                                                            className="px-3 py-2 rounded-lg text-xs font-semibold text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                        {activeTab === 'payslips' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Pay Slips</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">View or download your pay slips (demo UI).</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Back
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {payslips.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{p.month}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{p.amount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'Available'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => viewPayslip(p)}
                                                        className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadPayslip(p)}
                                                        className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
