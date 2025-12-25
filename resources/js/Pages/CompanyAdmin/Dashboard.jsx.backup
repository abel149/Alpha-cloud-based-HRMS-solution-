import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { usePage } from '@inertiajs/react';
import { FiUsers, FiBriefcase, FiCalendar, FiClock, FiShield, FiPlus, FiLogOut, FiUser, FiChevronDown, FiX } from 'react-icons/fi';

export default function CompanyAdminDashboard({ employees, departments, leavePolicies, attendancePolicies, roles, permissions, stats }) {
    const [activeTab, setActiveTab] = useState("employees");
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [showDepartmentForm, setShowDepartmentForm] = useState(false);
    const [showLeavePolicyForm, setShowLeavePolicyForm] = useState(false);
    const [showAttendancePolicyForm, setShowAttendancePolicyForm] = useState(false);
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const { auth } = usePage().props;
    const { user } = auth;

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const [employeeForm, setEmployeeForm] = useState({
        name: "", email: "", password: "", role: "employee", department_id: "",
        hire_date: "", job_title: "", employee_code: "", phone: "", salary: "", employment_type: "full_time"
    });

    const [departmentForm, setDepartmentForm] = useState({ name: "", description: "", manager_id: "" });
    const [leavePolicyForm, setLeavePolicyForm] = useState({
        policy_name: "", leave_type: "", days_allowed_per_year: "", is_paid: true, description: "", max_consecutive_days: ""
    });
    const [attendancePolicyForm, setAttendancePolicyForm] = useState({
        policy_name: "", work_start_time: "09:00", work_end_time: "17:00", grace_period_minutes: 15, minimum_work_hours: 8
    });
    const [roleForm, setRoleForm] = useState({ name: "", display_name: "", description: "", permissions: [] });

    const handleEmployeeChange = (e) => setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
    const handleDepartmentChange = (e) => setDepartmentForm({ ...departmentForm, [e.target.name]: e.target.value });
    const handleLeavePolicyChange = (e) => setLeavePolicyForm({ ...leavePolicyForm, [e.target.name]: e.target.value });
    const handleAttendancePolicyChange = (e) => setAttendancePolicyForm({ ...attendancePolicyForm, [e.target.name]: e.target.value });
    const handleRoleChange = (e) => setRoleForm({ ...roleForm, [e.target.name]: e.target.value });

    const handleEmployeeSubmit = (e) => { e.preventDefault(); Inertia.post(route('company-admin.employees.store'), employeeForm); setShowEmployeeForm(false); };
    const handleDepartmentSubmit = (e) => { e.preventDefault(); Inertia.post(route('company-admin.departments.store'), departmentForm); setShowDepartmentForm(false); };
    const handleLeavePolicySubmit = (e) => { e.preventDefault(); Inertia.post(route('company-admin.leave-policies.store'), leavePolicyForm); setShowLeavePolicyForm(false); };
    const handleAttendancePolicySubmit = (e) => { e.preventDefault(); Inertia.post(route('company-admin.attendance-policies.store'), attendancePolicyForm); setShowAttendancePolicyForm(false); };
    const handleRoleSubmit = (e) => { e.preventDefault(); Inertia.post(route('company-admin.roles.store'), roleForm); setShowRoleForm(false); };

    const tabs = [
        { key: "employees", label: "Staff Management", icon: <FiUsers className="mr-2" /> },
        { key: "departments", label: "Departments", icon: <FiBriefcase className="mr-2" /> },
        { key: "leave", label: "Leave Policies", icon: <FiCalendar className="mr-2" /> },
        { key: "attendance", label: "Attendance Policies", icon: <FiClock className="mr-2" /> },
        { key: "roles", label: "Roles & Permissions", icon: <FiShield className="mr-2" /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Company Admin Dashboard
                        </h1>
                        <div className="relative">
                            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                    {getInitials(user?.name)}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium">{user?.name}</div>
                                    <div className="text-xs text-gray-500">{user?.email}</div>
                                </div>
                                <FiChevronDown className="h-4 w-4" />
                            </button>
                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <a href={route('profile.edit')} className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <FiUser className="mr-3 h-5 w-5" /> Profile
                                        </a>
                                        <button onClick={() => Inertia.post(route('logout'))}
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <FiLogOut className="mr-3 h-5 w-5" /> Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                                <p className="text-2xl font-bold">{stats.total_employees}</p>
                            </div>
                            <FiUsers className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Staff</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active_employees}</p>
                            </div>
                            <FiUsers className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
                                <p className="text-2xl font-bold">{stats.total_departments}</p>
                            </div>
                            <FiBriefcase className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Roles</p>
                                <p className="text-2xl font-bold">{stats.total_roles}</p>
                            </div>
                            <FiShield className="h-10 w-10 text-orange-500" />
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <aside className="w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mr-6 h-fit">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === tab.key ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <main className="flex-1">
                        {/* Employees Tab */}
                        {activeTab === "employees" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Staff Management</h2>
                                    <button onClick={() => setShowEmployeeForm(true)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                                        <FiPlus className="mr-2" /> Add Employee
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Job Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {employees?.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 text-sm font-medium">{emp.user?.name}</td>
                                                    <td className="px-6 py-4 text-sm">{emp.user?.email}</td>
                                                    <td className="px-6 py-4 text-sm">{emp.department?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">{emp.job_title}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>{emp.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Other tabs coming soon message */}
                        {activeTab !== "employees" && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <h3 className="text-lg font-semibold mb-2">{tabs.find(t => t.key === activeTab)?.label}</h3>
                                <p className="text-gray-600 dark:text-gray-400">This section is under construction. Use the forms above to add items.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
