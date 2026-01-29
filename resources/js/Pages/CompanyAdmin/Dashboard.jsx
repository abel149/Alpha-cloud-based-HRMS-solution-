import React, { useEffect, useMemo, useState } from "react";
import PaginationControls from '@/Components/PaginationControls';
import FlashMessages from '@/Components/FlashMessages';
import LoadingButton from '@/Components/LoadingButton';
import { Inertia } from '@inertiajs/inertia';
import { router, usePage } from '@inertiajs/inertia-react';
import { FiUsers, FiBriefcase, FiCalendar, FiClock, FiShield, FiPlus, FiLogOut, FiUser, FiChevronDown, FiX, FiCheck, FiSearch, FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';

export default function CompanyAdminDashboard({ employees = [], departments = [], leavePolicies = [], attendancePolicies = [], roles = [], permissions = [], stats }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [showDepartmentForm, setShowDepartmentForm] = useState(false);
    const [showLeavePolicyForm, setShowLeavePolicyForm] = useState(false);
    const [showAttendancePolicyForm, setShowAttendancePolicyForm] = useState(false);
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [wifiDetectLoading, setWifiDetectLoading] = useState(false);
    const [wifiDetectError, setWifiDetectError] = useState('');

    const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
    const [departmentSubmitting, setDepartmentSubmitting] = useState(false);
    const [leavePolicySubmitting, setLeavePolicySubmitting] = useState(false);
    const [attendancePolicySubmitting, setAttendancePolicySubmitting] = useState(false);
    const [roleSubmitting, setRoleSubmitting] = useState(false);

    const [employeesPage, setEmployeesPage] = useState(1);
    const [employeesPageSize, setEmployeesPageSize] = useState(10);

    const [departmentsPage, setDepartmentsPage] = useState(1);
    const [departmentsPageSize, setDepartmentsPageSize] = useState(10);

    const [leavePoliciesPage, setLeavePoliciesPage] = useState(1);
    const [leavePoliciesPageSize, setLeavePoliciesPageSize] = useState(10);

    const [attendancePoliciesPage, setAttendancePoliciesPage] = useState(1);
    const [attendancePoliciesPageSize, setAttendancePoliciesPageSize] = useState(10);

    const [rolesPage, setRolesPage] = useState(1);
    const [rolesPageSize, setRolesPageSize] = useState(10);

    const { auth, errors, flash } = usePage().props;
    const user = auth?.user || {};

    const scrollToTop = () => {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            window.scrollTo(0, 0);
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const filteredEmployees = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return employees || [];
        return (employees || []).filter((e) => {
            const name = e?.user?.name || '';
            const email = e?.user?.email || '';
            const code = e?.employee_code || '';
            const title = e?.job_title || '';
            const dept = e?.department?.name || '';
            return `${name} ${email} ${code} ${title} ${dept}`.toLowerCase().includes(q);
        });
    }, [employees, searchTerm]);

    const pagedEmployees = useMemo(() => {
        const size = Number(employeesPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredEmployees.length || 0) / size));
        const page = Math.min(Math.max(1, Number(employeesPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredEmployees.slice(start, start + size);
    }, [filteredEmployees, employeesPage, employeesPageSize]);

    const filteredDepartments = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return departments || [];
        return (departments || []).filter((d) => {
            const name = d?.name || '';
            const manager = d?.manager?.name || '';
            const desc = d?.description || '';
            return `${name} ${manager} ${desc}`.toLowerCase().includes(q);
        });
    }, [departments, searchTerm]);

    const pagedDepartments = useMemo(() => {
        const size = Number(departmentsPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredDepartments.length || 0) / size));
        const page = Math.min(Math.max(1, Number(departmentsPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredDepartments.slice(start, start + size);
    }, [filteredDepartments, departmentsPage, departmentsPageSize]);

    const filteredLeavePolicies = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return leavePolicies || [];
        return (leavePolicies || []).filter((p) => {
            const name = p?.policy_name || '';
            const type = p?.leave_type || '';
            const desc = p?.description || '';
            return `${name} ${type} ${desc}`.toLowerCase().includes(q);
        });
    }, [leavePolicies, searchTerm]);

    const pagedLeavePolicies = useMemo(() => {
        const size = Number(leavePoliciesPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredLeavePolicies.length || 0) / size));
        const page = Math.min(Math.max(1, Number(leavePoliciesPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredLeavePolicies.slice(start, start + size);
    }, [filteredLeavePolicies, leavePoliciesPage, leavePoliciesPageSize]);

    const filteredAttendancePolicies = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return attendancePolicies || [];
        return (attendancePolicies || []).filter((p) => {
            const name = p?.policy_name || '';
            const hours = `${p?.work_start_time || ''} ${p?.work_end_time || ''}`;
            return `${name} ${hours}`.toLowerCase().includes(q);
        });
    }, [attendancePolicies, searchTerm]);

    const pagedAttendancePolicies = useMemo(() => {
        const size = Number(attendancePoliciesPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredAttendancePolicies.length || 0) / size));
        const page = Math.min(Math.max(1, Number(attendancePoliciesPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredAttendancePolicies.slice(start, start + size);
    }, [filteredAttendancePolicies, attendancePoliciesPage, attendancePoliciesPageSize]);

    const filteredRoles = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return roles || [];
        return (roles || []).filter((r) => {
            const name = r?.display_name || '';
            const sys = r?.name || '';
            const desc = r?.description || '';
            return `${name} ${sys} ${desc}`.toLowerCase().includes(q);
        });
    }, [roles, searchTerm]);

    const pagedRoles = useMemo(() => {
        const size = Number(rolesPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredRoles.length || 0) / size));
        const page = Math.min(Math.max(1, Number(rolesPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredRoles.slice(start, start + size);
    }, [filteredRoles, rolesPage, rolesPageSize]);

    // Form States
    const [employeeForm, setEmployeeForm] = useState({
        name: "", email: "", password: "", role: "employee", department_id: "",
        hire_date: "", job_title: "", employee_code: "", phone: "", salary: "", employment_type: "full_time"
    });

    const [departmentForm, setDepartmentForm] = useState({ name: "", description: "", manager_id: "" });

    const [leavePolicyForm, setLeavePolicyForm] = useState({
        policy_name: "", leave_type: "", days_allowed_per_year: "", is_paid: true, description: "", max_consecutive_days: ""
    });

    const [attendancePolicyForm, setAttendancePolicyForm] = useState({
        policy_name: "", work_start_time: "09:00", work_end_time: "17:00", grace_period_minutes: 15, minimum_work_hours: 8,
        requires_company_wifi: false,
        company_wifi_allowed_ips: "",
        company_wifi_allowed_cidrs: "",
        requires_fingerprint: false,
        requires_visual_confirmation: false,
        visual_confirmation_message: "",
    });

    const [roleForm, setRoleForm] = useState({ name: "", display_name: "", description: "", permissions: [] });

    // Handlers
    const handleEmployeeChange = (e) => setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
    const handleDepartmentChange = (e) => setDepartmentForm({ ...departmentForm, [e.target.name]: e.target.value });
    const handleLeavePolicyChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setLeavePolicyForm({ ...leavePolicyForm, [e.target.name]: value });
    };
    const handleAttendancePolicyChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setAttendancePolicyForm({ ...attendancePolicyForm, [e.target.name]: value });
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const xsrfTokenFromCookie = () => {
        const v = getCookie('XSRF-TOKEN');
        if (!v) return null;
        try {
            return decodeURIComponent(v);
        } catch {
            return v;
        }
    };

    const csrfTokenFromMeta = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const requestHeaders = (extra = {}) => ({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfTokenFromMeta() ? { 'X-CSRF-TOKEN': csrfTokenFromMeta() } : {}),
        ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
        ...extra,
    });

    const detectWifi = async () => {
        setWifiDetectError('');
        setWifiDetectLoading(true);
        try {
            const res = await fetch(route('company-admin.attendance-policies.detect-wifi'), {
                method: 'GET',
                credentials: 'include',
                headers: requestHeaders(),
            });

            const raw = await res.text();
            const data = (() => {
                try {
                    return raw ? JSON.parse(raw) : {};
                } catch {
                    return { ok: false, error: raw };
                }
            })();

            if (!res.ok || !data?.ok) {
                const msg = data?.error || data?.message || 'Failed to detect Wi-Fi IP.';
                setWifiDetectError(`${msg}${res?.status ? ` (HTTP ${res.status})` : ''}`);
                return;
            }

            setAttendancePolicyForm((prev) => ({
                ...prev,
                requires_company_wifi: true,
                company_wifi_allowed_ips: String(data?.ip || '').trim(),
                company_wifi_allowed_cidrs: String(data?.suggested_cidr || '').trim(),
            }));
        } catch (e) {
            setWifiDetectError('Network error. Please try again.');
        } finally {
            setWifiDetectLoading(false);
        }
    };
    const handleRoleChange = (e) => setRoleForm({ ...roleForm, [e.target.name]: e.target.value });

    const handlePermissionToggle = (permissionId) => {
        const current = roleForm.permissions || [];
        const updated = current.includes(permissionId)
            ? current.filter(id => id !== permissionId)
            : [...current, permissionId];
        setRoleForm({ ...roleForm, permissions: updated });
    };

    // Edit Handlers
    const handleEditEmployee = (emp) => {
        setEditingItem(emp);
        setEmployeeForm({
            name: emp.user?.name || "",
            email: emp.user?.email || "",
            password: "", // Don't prefill password
            role: emp.user?.role || "employee",
            department_id: emp.department_id || "",
            hire_date: emp.hire_date || "",
            job_title: emp.job_title || "",
            employee_code: emp.employee_code || "",
            phone: emp.phone || "",
            salary: emp.salary || "",
            employment_type: emp.employment_type || "full_time"
        });
        setShowEmployeeForm(true);
    };

    const handleEditDepartment = (dept) => {
        setEditingItem(dept);
        setDepartmentForm({
            name: dept.name,
            description: dept.description || "",
            manager_id: dept.manager_id || ""
        });
        setShowDepartmentForm(true);
    };

    const handleEditLeavePolicy = (policy) => {
        setEditingItem(policy);
        setLeavePolicyForm({
            policy_name: policy.policy_name,
            leave_type: policy.leave_type,
            days_allowed_per_year: policy.days_allowed_per_year,
            is_paid: policy.is_paid,
            description: policy.description || "",
            max_consecutive_days: policy.max_consecutive_days || ""
        });
        setShowLeavePolicyForm(true);
    };

    const handleEditAttendancePolicy = (policy) => {
        setEditingItem(policy);
        setAttendancePolicyForm({
            policy_name: policy.policy_name,
            work_start_time: policy.work_start_time,
            work_end_time: policy.work_end_time,
            grace_period_minutes: policy.grace_period_minutes,
            minimum_work_hours: policy.minimum_work_hours,
            requires_company_wifi: Boolean(policy.requires_company_wifi),
            company_wifi_allowed_ips: policy.company_wifi_allowed_ips || "",
            company_wifi_allowed_cidrs: policy.company_wifi_allowed_cidrs || "",
            requires_fingerprint: false,
            requires_visual_confirmation: Boolean(policy.requires_visual_confirmation),
            visual_confirmation_message: policy.visual_confirmation_message || "",
        });
        setShowAttendancePolicyForm(true);
    };

    const handleEditRole = (role) => {
        setEditingItem(role);
        setRoleForm({
            name: role.name,
            display_name: role.display_name,
            description: role.description || "",
            permissions: role.permissions?.map(p => p.id) || []
        });
        setShowRoleForm(true);
    };

    // Delete Handlers
    const handleDelete = (id, type) => {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            let url = "";
            if (type === "employee") url = route('company-admin.employees.destroy', id);
            if (type === "department") url = route('company-admin.departments.destroy', id);
            if (type === "leave policy") url = route('company-admin.leave-policies.destroy', id);
            if (type === "attendance policy") url = route('company-admin.attendance-policies.destroy', id);
            if (type === "role") url = route('company-admin.roles.destroy', id);

            Inertia.delete(url);
        }
    };

    // Submit Handlers
    const handleEmployeeSubmit = (e) => {
        e.preventDefault();
        setEmployeeSubmitting(true);
        const url = editingItem
            ? route('company-admin.employees.update', editingItem.id)
            : route('company-admin.employees.store');

        const method = editingItem ? 'put' : 'post';

        Inertia[method](url, employeeForm, {
            preserveState: false,
            onSuccess: () => {
                setShowEmployeeForm(false);
                setEditingItem(null);
                setEmployeesPage(1);
                setEmployeeForm({
                    name: "", email: "", password: "", role: "employee", department_id: "",
                    hire_date: "", job_title: "", employee_code: "", phone: "", salary: "", employment_type: "full_time"
                });
                scrollToTop();
            },
            onFinish: () => setEmployeeSubmitting(false),
        });
    };

    const handleDepartmentSubmit = (e) => {
        e.preventDefault();
        setDepartmentSubmitting(true);
        const url = editingItem
            ? route('company-admin.departments.update', editingItem.id)
            : route('company-admin.departments.store');

        const method = editingItem ? 'put' : 'post';

        Inertia[method](url, departmentForm, {
            preserveState: false,
            onSuccess: () => {
                setShowDepartmentForm(false);
                setEditingItem(null);
                setDepartmentsPage(1);
                setDepartmentForm({ name: "", description: "", manager_id: "" });
                scrollToTop();
            },
            onFinish: () => setDepartmentSubmitting(false),
        });
    };

    const handleLeavePolicySubmit = (e) => {
        e.preventDefault();
        setLeavePolicySubmitting(true);
        const url = editingItem
            ? route('company-admin.leave-policies.update', editingItem.id)
            : route('company-admin.leave-policies.store');

        const method = editingItem ? 'put' : 'post';

        Inertia[method](url, leavePolicyForm, {
            preserveState: false,
            onSuccess: () => {
                setShowLeavePolicyForm(false);
                setEditingItem(null);
                setLeavePoliciesPage(1);
                setLeavePolicyForm({
                    policy_name: "", leave_type: "", days_allowed_per_year: "", is_paid: true, description: "", max_consecutive_days: ""
                });
                scrollToTop();
            },
            onFinish: () => setLeavePolicySubmitting(false),
        });
    };

    const handleAttendancePolicySubmit = (e) => {
        e.preventDefault();
        setAttendancePolicySubmitting(true);
        const url = editingItem
            ? route('company-admin.attendance-policies.update', editingItem.id)
            : route('company-admin.attendance-policies.store');

        const method = editingItem ? 'put' : 'post';

        Inertia[method](url, attendancePolicyForm, {
            preserveState: false,
            onSuccess: () => {
                setShowAttendancePolicyForm(false);
                setEditingItem(null);
                setAttendancePoliciesPage(1);
                setAttendancePolicyForm({
                    policy_name: "", work_start_time: "09:00", work_end_time: "17:00", grace_period_minutes: 15, minimum_work_hours: 8,
                    requires_company_wifi: false,
                    company_wifi_allowed_ips: "",
                    company_wifi_allowed_cidrs: "",
                    requires_fingerprint: false,
                    requires_visual_confirmation: false,
                    visual_confirmation_message: "",
                });
                scrollToTop();
            },
            onFinish: () => setAttendancePolicySubmitting(false),
        });
    };

    const handleRoleSubmit = (e) => {
        e.preventDefault();
        setRoleSubmitting(true);
        const url = editingItem
            ? route('company-admin.roles.update', editingItem.id)
            : route('company-admin.roles.store');

        const method = editingItem ? 'put' : 'post';

        Inertia[method](url, roleForm, {
            preserveState: false,
            onSuccess: () => {
                setShowRoleForm(false);
                setEditingItem(null);
                setRolesPage(1);
                setRoleForm({ name: "", display_name: "", description: "", permissions: [] });
                scrollToTop();
            },
            onFinish: () => setRoleSubmitting(false),
        });
    };

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: <FiBriefcase className="mr-2" /> },
        { key: "employees", label: "Staff Management", icon: <FiUsers className="mr-2" /> },
        { key: "departments", label: "Departments", icon: <FiBriefcase className="mr-2" /> },
        { key: "leave", label: "Leave Policies", icon: <FiCalendar className="mr-2" /> },
        { key: "attendance", label: "Attendance Policies", icon: <FiClock className="mr-2" /> },
        { key: "roles", label: "Roles & Permissions", icon: <FiShield className="mr-2" /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Company Admin Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your organization's workforce</p>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-medium shadow-lg">
                                    {getInitials(user?.name)}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="text-sm font-semibold">{user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                                </div>
                                <FiChevronDown className="h-4 w-4" />
                            </button>
                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <a href={route('profile.edit')} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <FiUser className="mr-3 h-5 w-5 text-gray-400" /> Your Profile
                                            </a>
                                            <button onClick={() => Inertia.post(route('logout'))}
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <FlashMessages />

                {/* Stats Overview for Dashboard Tab */}
                {activeTab === "dashboard" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm mb-1">Total Employees</p>
                                    <p className="text-4xl font-bold">{stats?.total_employees || 0}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <FiUsers className="h-8 w-8" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm mb-1">Active Staff</p>
                                    <p className="text-4xl font-bold">{stats?.active_employees || 0}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <FiCheck className="h-8 w-8" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm mb-1">Departments</p>
                                    <p className="text-4xl font-bold">{stats?.total_departments || 0}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <FiBriefcase className="h-8 w-8" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm mb-1">Custom Roles</p>
                                    <p className="text-4xl font-bold">{stats?.total_roles || 0}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <FiShield className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-fit">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md transform scale-105'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                        }`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Dashboard Tab */}
                        {activeTab === "dashboard" && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <button onClick={() => { setActiveTab("employees"); setShowEmployeeForm(true); }}
                                            className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                            <FiPlus className="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-500" />
                                            <p className="text-sm font-medium">Add Employee</p>
                                        </button>
                                        <button onClick={() => { setActiveTab("departments"); setShowDepartmentForm(true); }}
                                            className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                                            <FiPlus className="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-purple-500" />
                                            <p className="text-sm font-medium">Add Department</p>
                                        </button>
                                        <button onClick={() => { setActiveTab("roles"); setShowRoleForm(true); }}
                                            className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group">
                                            <FiPlus className="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-orange-500" />
                                            <p className="text-sm font-medium">Add Role</p>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-xl font-bold mb-4">Recent Employees</h3>
                                    <div className="space-y-3">
                                        {employees?.slice(0, 5).map((emp) => (
                                            <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                        {getInitials(emp.user?.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{emp.user?.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{emp.job_title}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800'
                                                    }`}>{emp.status}</span>
                                            </div>
                                        ))}
                                        {(!employees || employees.length === 0) && (
                                            <div className="text-center py-12">
                                                <FiUsers className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                                <p className="text-gray-500 dark:text-gray-400">No employees yet. Add your first employee to get started!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Staff Management Tab */}
                        {activeTab === "employees" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h3 className="text-xl font-bold">Staff Directory</h3>
                                    <button onClick={() => { setEditingItem(null); setEmployeeForm({ name: "", email: "", password: "", role: "employee", department_id: "", hire_date: "", job_title: "", employee_code: "", phone: "", salary: "", employment_type: "full_time" }); setShowEmployeeForm(true); }}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
                                        <FiPlus className="mr-2" /> Add Employee
                                    </button>
                                </div>
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="relative w-full lg:max-w-sm">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setEmployeesPage(1); scrollToTop(); }}
                                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 w-full"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={employeesPage}
                                        pageSize={employeesPageSize}
                                        total={filteredEmployees.length}
                                        onPageChange={(p) => { setEmployeesPage(p); scrollToTop(); }}
                                        onPageSizeChange={(n) => { setEmployeesPageSize(n); setEmployeesPage(1); scrollToTop(); }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Employee</th>
                                                <th className="px-6 py-4 font-semibold">Department</th>
                                                <th className="px-6 py-4 font-semibold">Contact</th>
                                                <th className="px-6 py-4 font-semibold">Joining Date</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedEmployees.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 uppercase">
                                                                {getInitials(emp.user?.name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{emp.user?.name}</p>
                                                                <p className="text-xs text-gray-500">{emp.job_title}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{emp.department?.name || 'Unassigned'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <p>{emp.user?.email}</p>
                                                        <p className="text-gray-500">{emp.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{new Date(emp.hire_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {emp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditEmployee(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit /></button>
                                                        <button onClick={() => handleDelete(emp.id, 'employee')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedEmployees.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No employees found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Departments Tab */}
                        {activeTab === "departments" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Departments</h3>
                                    <button onClick={() => { setEditingItem(null); setDepartmentForm({ name: "", description: "", manager_id: "" }); setShowDepartmentForm(true); }}
                                        className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm">
                                        <FiPlus className="mr-2" /> Add Department
                                    </button>
                                </div>
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="relative w-full lg:max-w-sm">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search departments..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setDepartmentsPage(1); scrollToTop(); }}
                                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 w-full"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={departmentsPage}
                                        pageSize={departmentsPageSize}
                                        total={filteredDepartments.length}
                                        onPageChange={(p) => { setDepartmentsPage(p); scrollToTop(); }}
                                        onPageSizeChange={(n) => { setDepartmentsPageSize(n); setDepartmentsPage(1); scrollToTop(); }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Manager</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedDepartments.map((dept) => (
                                                <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-semibold">{dept.name}</td>
                                                    <td className="px-6 py-4 text-sm">{dept.manager?.name || 'No Manager'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{dept.description}</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditDepartment(dept)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit /></button>
                                                        <button onClick={() => handleDelete(dept.id, 'department')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedDepartments.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No departments found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Leave Policies Tab */}
                        {activeTab === "leave" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Leave Policies</h3>
                                    <button onClick={() => { setEditingItem(null); setLeavePolicyForm({ policy_name: "", leave_type: "", days_allowed_per_year: "", is_paid: true, description: "", max_consecutive_days: "" }); setShowLeavePolicyForm(true); }}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
                                        <FiPlus className="mr-2" /> Add Policy
                                    </button>
                                </div>
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="relative w-full lg:max-w-sm">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search leave policies..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setLeavePoliciesPage(1); scrollToTop(); }}
                                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 w-full"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={leavePoliciesPage}
                                        pageSize={leavePoliciesPageSize}
                                        total={filteredLeavePolicies.length}
                                        onPageChange={(p) => { setLeavePoliciesPage(p); scrollToTop(); }}
                                        onPageSizeChange={(n) => { setLeavePoliciesPageSize(n); setLeavePoliciesPage(1); scrollToTop(); }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Policy Name</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Allowance</th>
                                                <th className="px-6 py-4">Paid</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedLeavePolicies.map((policy) => (
                                                <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-semibold">{policy.policy_name}</td>
                                                    <td className="px-6 py-4 capitalize">{policy.leave_type}</td>
                                                    <td className="px-6 py-4">{policy.days_allowed_per_year} Days/Year</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${policy.is_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                                            {policy.is_paid ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditLeavePolicy(policy)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit /></button>
                                                        <button onClick={() => handleDelete(policy.id, 'leave policy')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedLeavePolicies.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No leave policies found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Attendance Policies Tab */}
                        {activeTab === "attendance" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Attendance Policies</h3>
                                    <button onClick={() => { setEditingItem(null); setAttendancePolicyForm({ policy_name: "", work_start_time: "09:00", work_end_time: "17:00", grace_period_minutes: 15, minimum_work_hours: 8, requires_company_wifi: false, company_wifi_allowed_ips: "", company_wifi_allowed_cidrs: "", requires_fingerprint: false }); setShowAttendancePolicyForm(true); }}
                                        className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm">
                                        <FiPlus className="mr-2" /> Add Policy
                                    </button>
                                </div>
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="relative w-full lg:max-w-sm">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search attendance policies..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setAttendancePoliciesPage(1); scrollToTop(); }}
                                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 w-full"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={attendancePoliciesPage}
                                        pageSize={attendancePoliciesPageSize}
                                        total={filteredAttendancePolicies.length}
                                        onPageChange={(p) => { setAttendancePoliciesPage(p); scrollToTop(); }}
                                        onPageSizeChange={(n) => { setAttendancePoliciesPageSize(n); setAttendancePoliciesPage(1); scrollToTop(); }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Policy Name</th>
                                                <th className="px-6 py-4">Work Hours</th>
                                                <th className="px-6 py-4">Grace Period</th>
                                                <th className="px-6 py-4">Min. Hours</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedAttendancePolicies.map((policy) => (
                                                <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-semibold">{policy.policy_name}</td>
                                                    <td className="px-6 py-4 text-sm">{policy.work_start_time} - {policy.work_end_time}</td>
                                                    <td className="px-6 py-4 text-sm">{policy.grace_period_minutes} Mins</td>
                                                    <td className="px-6 py-4 text-sm">{policy.minimum_work_hours} Hours</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditAttendancePolicy(policy)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit /></button>
                                                        <button onClick={() => handleDelete(policy.id, 'attendance policy')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedAttendancePolicies.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No attendance policies found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Roles Tab */}
                        {activeTab === "roles" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Roles & Permissions</h3>
                                    <button onClick={() => { setEditingItem(null); setRoleForm({ name: "", display_name: "", description: "", permissions: [] }); setShowRoleForm(true); }}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm">
                                        <FiPlus className="mr-2" /> Add Role
                                    </button>
                                </div>
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="relative w-full lg:max-w-sm">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search roles..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setRolesPage(1); scrollToTop(); }}
                                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 w-full"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={rolesPage}
                                        pageSize={rolesPageSize}
                                        total={filteredRoles.length}
                                        onPageChange={(p) => { setRolesPage(p); scrollToTop(); }}
                                        onPageSizeChange={(n) => { setRolesPageSize(n); setRolesPage(1); scrollToTop(); }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Role Name</th>
                                                <th className="px-6 py-4">Permissions Count</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedRoles.map((role) => (
                                                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-semibold">{role.display_name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold ring-1 ring-red-200">
                                                            {role.permissions?.length || 0} Permissions
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">{role.description}</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditRole(role)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit /></button>
                                                        <button onClick={() => handleDelete(role.id, 'role')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pagedRoles.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No roles found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Employee Form Modal */}
            {showEmployeeForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowEmployeeForm(false)} />

                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-auto p-6 sm:p-8">
                            <button onClick={() => setShowEmployeeForm(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <FiX className="h-6 w-6" />
                            </button>

                            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Employee' : 'Add New Employee'}</h3>

                            <form onSubmit={handleEmployeeSubmit} className="space-y-6">
                                {(errors?.name || errors?.email || errors?.password || errors?.role || errors?.department_id || errors?.hire_date || errors?.job_title || errors?.employee_code || errors?.phone || errors?.salary || errors?.employment_type) && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                                        {errors?.name && <div>{errors.name}</div>}
                                        {errors?.email && <div>{errors.email}</div>}
                                        {errors?.password && <div>{errors.password}</div>}
                                        {errors?.role && <div>{errors.role}</div>}
                                        {errors?.department_id && <div>{errors.department_id}</div>}
                                        {errors?.hire_date && <div>{errors.hire_date}</div>}
                                        {errors?.job_title && <div>{errors.job_title}</div>}
                                        {errors?.employee_code && <div>{errors.employee_code}</div>}
                                        {errors?.phone && <div>{errors.phone}</div>}
                                        {errors?.salary && <div>{errors.salary}</div>}
                                        {errors?.employment_type && <div>{errors.employment_type}</div>}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                                        <input type="text" name="name" value={employeeForm.name} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="John Doe" required />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email *</label>
                                        <input type="email" name="email" value={employeeForm.email} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="john@company.com" required />
                                    </div>

                                    {/* Password */}
                                    {!editingItem && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Password *</label>
                                            <input type="password" name="password" value={employeeForm.password} onChange={handleEmployeeChange}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                placeholder="Min. 8 characters" required minLength="8" />
                                        </div>
                                    )}

                                    {/* Employee Code */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Employee Code *</label>
                                        <input type="text" name="employee_code" value={employeeForm.employee_code} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="EMP001" required />
                                    </div>

                                    {/* Job Title */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Job Title *</label>
                                        <input type="text" name="job_title" value={employeeForm.job_title} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="Software Engineer" required />
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Department</label>
                                        <select name="department_id" value={employeeForm.department_id} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700">
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Role *</label>
                                        <select name="role" value={employeeForm.role} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" required>
                                            <option value="employee">Employee</option>
                                            <option value="hr_manager">HR Manager</option>
                                            <option value="finance_manager">Finance Manager</option>
                                            <option value="department_manager">Department Manager</option>
                                        </select>
                                    </div>

                                    {/* Employment Type */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Employment Type *</label>
                                        <select name="employment_type" value={employeeForm.employment_type} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" required>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                            <option value="contract">Contract</option>
                                            <option value="intern">Intern</option>
                                        </select>
                                    </div>

                                    {/* Hire Date */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Hire Date *</label>
                                        <input type="date" name="hire_date" value={employeeForm.hire_date} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" required />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input type="tel" name="phone" value={employeeForm.phone} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="+1234567890" />
                                    </div>

                                    {/* Salary */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Salary</label>
                                        <input type="number" name="salary" value={employeeForm.salary} onChange={handleEmployeeChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            placeholder="50000" step="0.01" />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowEmployeeForm(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        loading={employeeSubmitting}
                                        loadingText={editingItem ? 'Updating...' : 'Creating...'}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all"
                                    >
                                        {editingItem ? 'Update Employee' : 'Create Employee'}
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Form Modal */}
            {showDepartmentForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDepartmentForm(false)} />

                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                            <button onClick={() => setShowDepartmentForm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX className="h-6 w-6" />
                            </button>

                            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Department' : 'Add New Department'}</h3>

                            <form onSubmit={handleDepartmentSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Department Name *</label>
                                    <input type="text" name="name" value={departmentForm.name} onChange={handleDepartmentChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                                        placeholder="Engineering" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea name="description" value={departmentForm.description} onChange={handleDepartmentChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                                        placeholder="Department responsibilities..." rows="3" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Department Manager</label>
                                    <select name="manager_id" value={departmentForm.manager_id} onChange={handleDepartmentChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700">
                                        <option value="">Select Manager (Optional)</option>
                                        {employees.map(emp => (
                                            <option key={emp.user?.id} value={emp.user?.id}>{emp.user?.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowDepartmentForm(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        loading={departmentSubmitting}
                                        loadingText={editingItem ? 'Updating...' : 'Creating...'}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md"
                                    >
                                        {editingItem ? 'Update Department' : 'Create Department'}
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Policy Form Modal */}
            {showLeavePolicyForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLeavePolicyForm(false)} />

                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                            <button onClick={() => setShowLeavePolicyForm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX className="h-6 w-6" />
                            </button>

                            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Leave Policy' : 'Add Leave Policy'}</h3>

                            <form onSubmit={handleLeavePolicySubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Policy Name *</label>
                                        <input type="text" name="policy_name" value={leavePolicyForm.policy_name} onChange={handleLeavePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                                            placeholder="Annual Vacation" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Leave Type *</label>
                                        <select name="leave_type" value={leavePolicyForm.leave_type} onChange={handleLeavePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" required>
                                            <option value="">Select Type</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="vacation">Vacation</option>
                                            <option value="personal">Personal Leave</option>
                                            <option value="maternity">Maternity Leave</option>
                                            <option value="paternity">Paternity Leave</option>
                                            <option value="unpaid">Unpaid Leave</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Days per Year *</label>
                                        <input type="number" name="days_allowed_per_year" value={leavePolicyForm.days_allowed_per_year} onChange={handleLeavePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                                            placeholder="20" min="1" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Max Consecutive Days</label>
                                        <input type="number" name="max_consecutive_days" value={leavePolicyForm.max_consecutive_days} onChange={handleLeavePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                                            placeholder="10" min="1" />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="is_paid" checked={leavePolicyForm.is_paid} onChange={handleLeavePolicyChange}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                                        <span className="text-sm font-medium">This is a paid leave</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea name="description" value={leavePolicyForm.description} onChange={handleLeavePolicyChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                                        placeholder="Policy details..." rows="3" />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowLeavePolicyForm(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        loading={leavePolicySubmitting}
                                        loadingText={editingItem ? 'Updating...' : 'Creating...'}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md"
                                    >
                                        {editingItem ? 'Update Policy' : 'Create Policy'}
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Policy Form Modal */}
            {showAttendancePolicyForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAttendancePolicyForm(false)} />

                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                            <button onClick={() => setShowAttendancePolicyForm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX className="h-6 w-6" />
                            </button>

                            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Attendance Policy' : 'Add Attendance Policy'}</h3>

                            <form onSubmit={handleAttendancePolicySubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Policy Name *</label>
                                    <input type="text" name="policy_name" value={attendancePolicyForm.policy_name} onChange={handleAttendancePolicyChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                        placeholder="Standard Office Hours" required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Work Start Time *</label>
                                        <input type="time" name="work_start_time" value={attendancePolicyForm.work_start_time} onChange={handleAttendancePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Work End Time *</label>
                                        <input type="time" name="work_end_time" value={attendancePolicyForm.work_end_time} onChange={handleAttendancePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Grace Period (minutes)</label>
                                        <input type="number" name="grace_period_minutes" value={attendancePolicyForm.grace_period_minutes} onChange={handleAttendancePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                            placeholder="15" min="0" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Minimum Work Hours</label>
                                        <input type="number" name="minimum_work_hours" value={attendancePolicyForm.minimum_work_hours} onChange={handleAttendancePolicyChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                            placeholder="8" min="1" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                        <div>
                                            <div className="font-semibold">Company Wi-Fi Restriction</div>
                                            <div className="text-sm text-gray-500">Require employees to be on the company network to check in/out.</div>
                                        </div>
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="requires_company_wifi"
                                                checked={Boolean(attendancePolicyForm.requires_company_wifi)}
                                                onChange={handleAttendancePolicyChange}
                                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                        </label>
                                    </div>

                                    {attendancePolicyForm.requires_company_wifi && (
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="text-sm text-gray-500">
                                                    Click Detect while connected to your company Wi-Fi.
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={detectWifi}
                                                    disabled={wifiDetectLoading}
                                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-sm"
                                                >
                                                    {wifiDetectLoading ? 'Detecting...' : 'Detect Wi-Fi IP/CIDR'}
                                                </button>
                                            </div>

                                            {wifiDetectError && (
                                                <div className="text-sm text-red-600">{wifiDetectError}</div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Allowed IPs (comma separated)</label>
                                                <input
                                                    type="text"
                                                    name="company_wifi_allowed_ips"
                                                    value={attendancePolicyForm.company_wifi_allowed_ips}
                                                    onChange={handleAttendancePolicyChange}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                                    placeholder="192.168.1.10, 192.168.1.11"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Allowed CIDR Ranges (comma separated)</label>
                                                <input
                                                    type="text"
                                                    name="company_wifi_allowed_cidrs"
                                                    value={attendancePolicyForm.company_wifi_allowed_cidrs}
                                                    onChange={handleAttendancePolicyChange}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                                    placeholder="192.168.1.0/24, 10.0.0.0/24"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                        <div>
                                            <div className="font-semibold">Visual Confirmation</div>
                                            <div className="text-sm text-gray-500">Require employees to take a photo before check in/out.</div>
                                        </div>
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="requires_visual_confirmation"
                                                checked={Boolean(attendancePolicyForm.requires_visual_confirmation)}
                                                onChange={handleAttendancePolicyChange}
                                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                        </label>
                                    </div>

                                    {attendancePolicyForm.requires_visual_confirmation && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Visual Confirmation Message (optional)</label>
                                            <input
                                                type="text"
                                                name="visual_confirmation_message"
                                                value={attendancePolicyForm.visual_confirmation_message}
                                                onChange={handleAttendancePolicyChange}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700"
                                                placeholder="Please take a photo to confirm you are in the building"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowAttendancePolicyForm(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        loading={attendancePolicySubmitting}
                                        loadingText={editingItem ? 'Updating...' : 'Creating...'}
                                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md"
                                    >
                                        {editingItem ? 'Update Policy' : 'Create Policy'}
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Form Modal */}
            {showRoleForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRoleForm(false)} />

                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setShowRoleForm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 z-10">
                                <FiX className="h-6 w-6" />
                            </button>

                            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Role' : 'Add New Role'}</h3>

                            <form onSubmit={handleRoleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Role Name (slug) *</label>
                                        <input type="text" name="name" value={roleForm.name} onChange={handleRoleChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                                            placeholder="senior_manager" required />
                                        <p className="text-xs text-gray-500 mt-1">Use lowercase with underscores</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Display Name *</label>
                                        <input type="text" name="display_name" value={roleForm.display_name} onChange={handleRoleChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                                            placeholder="Senior Manager" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea name="description" value={roleForm.description} onChange={handleRoleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                                        placeholder="Role responsibilities..." rows="3" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">Permissions</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {permissions && permissions.length > 0 ? (
                                            permissions.map(permission => (
                                                <label key={permission.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleForm.permissions.includes(permission.id)}
                                                        onChange={() => handlePermissionToggle(permission.id)}
                                                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                    />
                                                    <span className="text-sm">{permission.name}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                                                No permissions available. Please create permissions first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowRoleForm(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        loading={roleSubmitting}
                                        loadingText={editingItem ? 'Updating...' : 'Creating...'}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md"
                                    >
                                        {editingItem ? 'Update Role' : 'Create Role'}
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
