import { Head, usePage } from '@inertiajs/inertia-react';
import React, { useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { FiUsers, FiCalendar, FiClock, FiPlus, FiLogOut, FiUser, FiChevronDown, FiX, FiSearch, FiCheck } from 'react-icons/fi';
import PaginationControls from '../../Components/PaginationControls';

export default function HrDashboard({ employees = [], departments = [], leaveRequests = [], attendanceLogs = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [activeTab, setActiveTab] = useState('employees');
    const [searchTerm, setSearchTerm] = useState('');
    const [showHireForm, setShowHireForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedLeaveId, setSelectedLeaveId] = useState(null);

    const [employeesPage, setEmployeesPage] = useState(1);
    const [employeesPageSize, setEmployeesPageSize] = useState(10);
    const [leavePage, setLeavePage] = useState(1);
    const [leavePageSize, setLeavePageSize] = useState(10);
    const [attendancePage, setAttendancePage] = useState(1);
    const [attendancePageSize, setAttendancePageSize] = useState(10);

    const [hireForm, setHireForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department_id: '',
        hire_date: '',
        job_title: '',
        employee_code: '',
        phone: '',
        salary: '',
        employment_type: 'full_time',
    });

    const employeesSorted = useMemo(() => {
        const list = Array.isArray(employees) ? employees : [];
        return [...list].sort((a, b) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
    }, [employees]);

    const leaveRequestsSorted = useMemo(() => {
        const list = Array.isArray(leaveRequests) ? leaveRequests : [];
        return [...list].sort((a, b) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
    }, [leaveRequests]);

    const filteredEmployees = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return employeesSorted;
        return employeesSorted.filter((e) => {
            const name = e?.user?.name || '';
            const email = e?.user?.email || '';
            const code = e?.employee_code || '';
            return `${name} ${email} ${code}`.toLowerCase().includes(q);
        });
    }, [employeesSorted, searchTerm]);

    const pagedEmployees = useMemo(() => {
        const size = Number(employeesPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredEmployees.length || 0) / size));
        const page = Math.min(Math.max(1, Number(employeesPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredEmployees.slice(start, start + size);
    }, [filteredEmployees, employeesPage, employeesPageSize]);

    const filteredLeaveRequests = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return leaveRequestsSorted;
        return leaveRequestsSorted.filter((r) => {
            const name = r?.employee?.user?.name || '';
            const email = r?.employee?.user?.email || '';
            const type = r?.leave_type || '';
            const status = r?.status || '';
            return `${name} ${email} ${type} ${status}`.toLowerCase().includes(q);
        });
    }, [leaveRequestsSorted, searchTerm]);

    const pagedLeaveRequests = useMemo(() => {
        const size = Number(leavePageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredLeaveRequests.length || 0) / size));
        const page = Math.min(Math.max(1, Number(leavePage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredLeaveRequests.slice(start, start + size);
    }, [filteredLeaveRequests, leavePage, leavePageSize]);

    const attendanceRows = useMemo(() => {
        const sorted = [...(attendanceLogs || [])].sort((a, b) => {
            const ad = a?.logged_at ? new Date(a.logged_at).getTime() : 0;
            const bd = b?.logged_at ? new Date(b.logged_at).getTime() : 0;
            return ad - bd;
        });

        const byKey = new Map();

        for (const l of sorted) {
            const empId = l?.employee_id ?? l?.employee?.id;
            const day = l?.logged_at ? String(l.logged_at).slice(0, 10) : '';
            if (!empId || !day) continue;

            const key = `${empId}:${day}`;
            const existing = byKey.get(key);
            const row = existing || {
                key,
                employee_id: empId,
                employee: l?.employee,
                day,
                check_in_at: null,
                check_out_at: null,
                wifi_in: null,
                wifi_out: null,
                visual_in: null,
                visual_out: null,
            };

            if (l?.type === 'check_in') {
                if (!row.check_in_at || new Date(l.logged_at).getTime() < new Date(row.check_in_at).getTime()) {
                    row.check_in_at = l.logged_at;
                    row.wifi_in = Boolean(l?.wifi_verified);
                    row.visual_in = Boolean(l?.visual_confirmed_at);
                }
            }

            if (l?.type === 'check_out') {
                if (!row.check_out_at || new Date(l.logged_at).getTime() > new Date(row.check_out_at).getTime()) {
                    row.check_out_at = l.logged_at;
                    row.wifi_out = Boolean(l?.wifi_verified);
                    row.visual_out = Boolean(l?.visual_confirmed_at);
                }
            }

            byKey.set(key, row);
        }

        const rows = Array.from(byKey.values());
        rows.sort((a, b) => {
            const d = String(b.day).localeCompare(String(a.day));
            if (d) return d;
            const an = a?.employee?.user?.name || '';
            const bn = b?.employee?.user?.name || '';
            return an.localeCompare(bn);
        });

        return rows;
    }, [attendanceLogs]);

    const filteredAttendanceRows = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return attendanceRows;
        return attendanceRows.filter((r) => {
            const name = r?.employee?.user?.name || '';
            const email = r?.employee?.user?.email || '';
            const day = r?.day || '';
            return `${name} ${email} ${day}`.toLowerCase().includes(q);
        });
    }, [attendanceRows, searchTerm]);

    const pagedAttendanceRows = useMemo(() => {
        const size = Number(attendancePageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredAttendanceRows.length || 0) / size));
        const page = Math.min(Math.max(1, Number(attendancePage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredAttendanceRows.slice(start, start + size);
    }, [filteredAttendanceRows, attendancePage, attendancePageSize]);

    const formatTime = (v) => {
        if (!v) return '—';
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (v) => {
        if (!v) return '—';
        const s = String(v);
        const m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
        const d = m
            ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
            : new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const formatDuration = (start, end) => {
        if (!start || !end) return '—';
        const a = new Date(start).getTime();
        const b = new Date(end).getTime();
        if (!a || !b || b < a) return '—';
        const mins = Math.floor((b - a) / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h <= 0) return `${m}m`;
        return `${h}h ${m}m`;
    };

    const submitHire = (e) => {
        e.preventDefault();
        Inertia.post(route('tenant.hr.employees.store'), hireForm, {
            onSuccess: () => {
                setShowHireForm(false);
                setHireForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'employee',
                    department_id: '',
                    hire_date: '',
                    job_title: '',
                    employee_code: '',
                    phone: '',
                    salary: '',
                    employment_type: 'full_time',
                });
            },
        });
    };

    const offboardEmployee = (empId) => {
        if (!confirm('Offboard this employee?')) return;
        Inertia.post(route('tenant.hr.employees.offboard', empId));
    };

    const approveLeave = (leaveId) => {
        Inertia.post(route('tenant.hr.leave.approve', leaveId));
    };

    const openRejectModal = (leaveId) => {
        setSelectedLeaveId(leaveId);
        setRejectionReason('');
    };

    const rejectLeave = (e) => {
        e.preventDefault();
        if (!selectedLeaveId) return;
        Inertia.post(route('tenant.hr.leave.reject', selectedLeaveId), { rejection_reason: rejectionReason }, {
            onSuccess: () => {
                setSelectedLeaveId(null);
                setRejectionReason('');
            },
        });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const totalEmployees = employees?.length || 0;
    const activeEmployees = (employees || []).filter((e) => e?.status === 'active').length;
    const pendingLeave = (leaveRequests || []).filter((r) => r?.status === 'pending').length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayAttendance = (attendanceLogs || []).filter((l) => {
        const v = l?.logged_at;
        if (!v) return false;
        return String(v).slice(0, 10) === todayKey;
    }).length;

    const tabs = [
        { key: 'employees', label: 'Employees', icon: <FiUsers className="mr-2" /> },
        { key: 'leave', label: 'Leave Requests', icon: <FiCalendar className="mr-2" /> },
        { key: 'attendance', label: 'Attendance', icon: <FiClock className="mr-2" /> },
    ];


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head title="HR Team" />

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                                HR Team Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage employees, leave requests, and attendance</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-medium shadow-lg">
                                    {getInitials(user?.name || 'User')}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="font-medium">{user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
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
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Total Employees</p>
                                <p className="text-3xl font-bold">{totalEmployees}</p>
                            </div>
                            <FiUsers className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Active Staff</p>
                                <p className="text-3xl font-bold">{activeEmployees}</p>
                            </div>
                            <FiCheck className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Pending Leave</p>
                                <p className="text-3xl font-bold">{pendingLeave}</p>
                            </div>
                            <FiCalendar className="h-10 w-10 text-white/80" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Attendance Today</p>
                                <p className="text-3xl font-bold">{todayAttendance}</p>
                            </div>
                            <FiClock className="h-10 w-10 text-white/80" />
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
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setEmployeesPage(1);
                                        setLeavePage(1);
                                        setAttendancePage(1);
                                    }}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === tab.key
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md transform scale-105'
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
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full lg:w-80">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setEmployeesPage(1);
                                                setLeavePage(1);
                                                setAttendancePage(1);
                                            }}
                                            placeholder="Search employees, leave requests, attendance..."
                                            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    {activeTab === 'employees' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowHireForm(true)}
                                            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-medium shadow"
                                        >
                                            <FiPlus className="mr-2" /> Hire Employee
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {activeTab === 'employees' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold">Employees</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hire new employees and offboard staff.</p>
                                </div>

                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <PaginationControls
                                        page={employeesPage}
                                        pageSize={employeesPageSize}
                                        total={filteredEmployees.length}
                                        onPageChange={(p) => setEmployeesPage(p)}
                                        onPageSizeChange={(n) => { setEmployeesPageSize(n); setEmployeesPage(1); }}
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedEmployees.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-semibold">
                                                                {getInitials(emp?.user?.name || 'U')}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{emp?.user?.name}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{emp?.user?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{emp.employee_code}</td>
                                                    <td className="px-6 py-4 text-sm">{emp?.department?.name || '—'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            emp.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                                        }`}>
                                                            {emp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {emp.status === 'active' ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => offboardEmployee(emp.id)}
                                                                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                                                            >
                                                                Offboard
                                                            </button>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedEmployees.length === 0 && (
                                                <tr>
                                                    <td className="px-6 py-10 text-center text-gray-500 dark:text-gray-400" colSpan="5">No employees found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leave' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold">Leave Requests</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Approve or reject employee leave requests.</p>
                                </div>

                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <PaginationControls
                                        page={leavePage}
                                        pageSize={leavePageSize}
                                        total={filteredLeaveRequests.length}
                                        onPageChange={(p) => setLeavePage(p)}
                                        onPageSizeChange={(n) => { setLeavePageSize(n); setLeavePage(1); }}
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Dates</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedLeaveRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{req?.employee?.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{req?.employee?.user?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{req.leave_type}</td>
                                                    <td className="px-6 py-4 text-sm">{formatDate(req.start_date)} → {formatDate(req.end_date)}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            req.status === 'approved'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                : req.status === 'rejected'
                                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {req.status === 'pending' ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => approveLeave(req.id)}
                                                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openRejectModal(req.id)}
                                                                    className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedLeaveRequests.length === 0 && (
                                                <tr>
                                                    <td className="px-6 py-10 text-center text-gray-500 dark:text-gray-400" colSpan="5">No leave requests found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold">Attendance Logs</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest check-ins and check-outs.</p>
                                </div>

                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <PaginationControls
                                        page={attendancePage}
                                        pageSize={attendancePageSize}
                                        total={filteredAttendanceRows.length}
                                        onPageChange={(p) => setAttendancePage(p)}
                                        onPageSizeChange={(n) => { setAttendancePageSize(n); setAttendancePage(1); }}
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Day</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Check In</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Check Out</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Time Worked</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Wi‑Fi</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visual</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedAttendanceRows.map((row) => (
                                                <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm">{row.day}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{row?.employee?.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{row?.employee?.user?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{formatTime(row.check_in_at)}</td>
                                                    <td className="px-6 py-4 text-sm">{formatTime(row.check_out_at)}</td>
                                                    <td className="px-6 py-4 text-sm">{formatDuration(row.check_in_at, row.check_out_at)}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {(row.wifi_in === true || row.wifi_out === true) ? 'Yes' : (row.wifi_in === false || row.wifi_out === false) ? 'No' : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {(row.visual_in === true || row.visual_out === true) ? 'Yes' : (row.visual_in === false || row.visual_out === false) ? 'No' : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedAttendanceRows.length === 0 && (
                                                <tr>
                                                    <td className="px-6 py-10 text-center text-gray-500 dark:text-gray-400" colSpan="7">No attendance logs found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {showHireForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowHireForm(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold">Hire Employee</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Create a new employee account for this company.</p>
                            </div>
                            <button type="button" onClick={() => setShowHireForm(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={submitHire} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Name" value={hireForm.name} onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Email" value={hireForm.email} onChange={(e) => setHireForm({ ...hireForm, email: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Password" type="password" value={hireForm.password} onChange={(e) => setHireForm({ ...hireForm, password: e.target.value })} />
                                <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" value={hireForm.role} onChange={(e) => setHireForm({ ...hireForm, role: e.target.value })}>
                                    <option value="employee">Employee</option>
                                    <option value="department_manager">Department Manager</option>
                                    <option value="finance_manager">Finance Manager</option>
                                    <option value="hr_manager">HR Manager</option>
                                </select>
                                <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" value={hireForm.department_id} onChange={(e) => setHireForm({ ...hireForm, department_id: e.target.value })}>
                                    <option value="">No Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" type="date" value={hireForm.hire_date} onChange={(e) => setHireForm({ ...hireForm, hire_date: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Job title" value={hireForm.job_title} onChange={(e) => setHireForm({ ...hireForm, job_title: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Employee code" value={hireForm.employee_code} onChange={(e) => setHireForm({ ...hireForm, employee_code: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Phone" value={hireForm.phone} onChange={(e) => setHireForm({ ...hireForm, phone: e.target.value })} />
                                <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" placeholder="Salary" value={hireForm.salary} onChange={(e) => setHireForm({ ...hireForm, salary: e.target.value })} />
                                <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" value={hireForm.employment_type} onChange={(e) => setHireForm({ ...hireForm, employment_type: e.target.value })}>
                                    <option value="full_time">Full time</option>
                                    <option value="part_time">Part time</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowHireForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Hire
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedLeaveId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLeaveId(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold">Reject Leave Request</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Optionally provide a reason for rejection.</p>
                            </div>
                            <button type="button" onClick={() => setSelectedLeaveId(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={rejectLeave} className="p-6 space-y-4">
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Optional reason..."
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 min-h-[110px]"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setSelectedLeaveId(null)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">
                                    Reject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
