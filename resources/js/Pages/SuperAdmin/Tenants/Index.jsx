import React, { useMemo, useState } from "react";
import { Inertia } from "@inertiajs/inertia";

import { FiUsers, FiFileText, FiCreditCard, FiPlus, FiChevronRight, FiLogOut, FiUser, FiSettings, FiChevronDown, FiX, FiLayout, FiDollarSign } from 'react-icons/fi';
import PaginationControls from '../../../Components/PaginationControls';

export default function Dashboard({ auth, tenants, paidApplications, subscriptionPlans, users = [] }) {
    // Persist selected tab so redirects/reloads keep the same section open
    const [activeTab, setActiveTabState] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.localStorage.getItem('sa_tenants_active_tab') || 'dashboard';
        }
        return 'dashboard';
    });

    const setActiveTab = (tabKey) => {
        setActiveTabState(tabKey);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('sa_tenants_active_tab', tabKey);
        }
    };

    const [showCreateTenant, setShowCreateTenant] = useState(false);
    const [showTenantForm, setShowTenantForm] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const [tenantsQuery, setTenantsQuery] = useState('');
    const [tenantsPage, setTenantsPage] = useState(1);
    const [tenantsPageSize, setTenantsPageSize] = useState(10);

    const [paidAppsQuery, setPaidAppsQuery] = useState('');
    const [paidAppsPage, setPaidAppsPage] = useState(1);
    const [paidAppsPageSize, setPaidAppsPageSize] = useState(10);

    const [plansQuery, setPlansQuery] = useState('');
    const [plansPage, setPlansPage] = useState(1);
    const [plansPageSize, setPlansPageSize] = useState(6);

    const [usersQuery, setUsersQuery] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize, setUsersPageSize] = useState(10);

    const [provisioningAppIds, setProvisioningAppIds] = useState(new Set());

    // Get authenticated user data from props
    const user = auth?.user || {};

    const flashSuccess = auth?.flash?.success;
    const flashError = auth?.flash?.error;

    const formatDateTime = (v) => {
        if (!v) return '';
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleString();
    };

    // Function to get user initials
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const [tenantForm, setTenantForm] = useState({
        subscriptionId: "",
        database: "",
        createdby: user.id || "",
        tenant_application_id: "",
    });

    const [planForm, setPlanForm] = useState({
        planId: "",
        name: "",
        price: "",
        features: "",
        durationDays: "",
    });
    const [userForm, setUserForm] = useState({
        tenantid: "",
        name: "",
        email: "",
    });

    const [userSubmitting, setUserSubmitting] = useState(false);

    const [editingTenant, setEditingTenant] = useState(null);
    const [editTenantForm, setEditTenantForm] = useState({
        subscription_id: "",
    });

    const handleTenantChange = (e) =>
        setTenantForm({ ...tenantForm, [e.target.name]: e.target.value });

    const handlePlanChange = (e) =>
        setPlanForm({ ...planForm, [e.target.name]: e.target.value });

    const handleTenantSubmit = (e) => {
        e.preventDefault();
        Inertia.post("/superadmin/tenants", tenantForm, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setActiveTab("tenants");
                setTenantsPage(1);
            },
        });
    };

    const startTenantFromApplication = (app) => {
        const nextSet = new Set(provisioningAppIds);
        nextSet.add(app.id);
        setProvisioningAppIds(nextSet);

        // Derive a simple, unique database name from company name (slug-like)
        const slug = app.company_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        // Use the paid transaction id as subscriptionId directly
        const payload = {
            subscriptionId: app.transaction_id,
            // Append application id so DB name is always unique, even for same company name
            database: slug ? `tenant_${slug}_${app.id}` : `tenant_${app.id}`,
            createdby: user.id || "",
            tenant_application_id: app.id,
        };

        Inertia.post("/superadmin/tenants", payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                const cleared = new Set(provisioningAppIds);
                cleared.delete(app.id);
                setProvisioningAppIds(cleared);
                setActiveTab("paidApps");
            },
            onError: () => {
                const cleared = new Set(provisioningAppIds);
                cleared.delete(app.id);
                setProvisioningAppIds(cleared);
            },
        });
    };

    const handlePlanSubmit = (e) => {
        e.preventDefault();
        Inertia.post("/subscription-plans", planForm, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setActiveTab("plans");
                setPlansPage(1);
            },
        });
    };
    const handleUserChange = (e) =>
        setUserForm({ ...userForm, [e.target.name]: e.target.value });

    const handleUserSubmit = (e) => {
        e.preventDefault();
        setUserSubmitting(true);
        Inertia.post("/users", userForm, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                setActiveTab("users");
                setUsersPage(1);
            },
            onFinish: () => setUserSubmitting(false),
        });
    };

    const openEditTenant = (tenant) => {
        setEditingTenant(tenant);
        setEditTenantForm({
            subscription_id: tenant.subscription_id || "",
        });
    };

    const closeEditTenant = () => {
        setEditingTenant(null);
    };

    const handleEditTenantChange = (e) => {
        setEditTenantForm({ ...editTenantForm, [e.target.name]: e.target.value });
    };

    const handleEditTenantSubmit = (e) => {
        e.preventDefault();
        if (!editingTenant) return;

        Inertia.put(`/superadmin/tenants/${editingTenant.id}`, editTenantForm, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setEditingTenant(null);
                setActiveTab("tenants");
            },
        });
    };

    const handleDeleteTenant = (tenant) => {
        if (!confirm(`Are you sure you want to delete tenant #${tenant.id}?`)) {
            return;
        }

        Inertia.delete(`/superadmin/tenants/${tenant.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setActiveTab("tenants"),
        });
    };

    // Sidebar tab labels
    const tabs = [

        { key: "dashboard", label: "Dashboard", icon: <FiLayout className="mr-2" /> },
        { key: "tenants", label: "Tenants", icon: <FiUsers className="mr-2" /> },
        { key: "paidApps", label: "Paid Applications", icon: <FiFileText className="mr-2" /> },
        { key: "plans", label: "Subscription Plans", icon: <FiCreditCard className="mr-2" /> },
        { key: "users", label: "Super Admin Users", icon: <FiUsers className="mr-2" /> },
    ];

    // Helper to hide paid applications that already have a tenant
    const visiblePaidApplications = paidApplications
        .filter((app) => {
            // If backend says tenant_created, hide it
            if (app.tenant_created) return false;

            // If a tenant exists with matching subscription_id (we store transaction_id there), hide it
            const hasMatchingSubscription = tenants.some(
                (t) => t.subscription_id === app.transaction_id
            );

            if (hasMatchingSubscription) return false;

            // Also match by database name pattern tenant_{slug(company_name)}
            const slug = app.company_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");

            const expectedDb = slug ? `tenant_${slug}` : null;

            if (expectedDb) {
                const hasMatchingDb = tenants.some(
                    (t) => t.database === expectedDb
                );
                if (hasMatchingDb) return false;
            }

            // Otherwise keep it visible
            return true;
        });

    const filteredTenants = useMemo(() => {
        const q = (tenantsQuery || '').trim().toLowerCase();
        if (!q) return tenants || [];
        return (tenants || []).filter((t) => {
            const id = String(t?.id ?? '');
            const db = String(t?.database ?? '');
            const sub = String(t?.subscription_id ?? '');
            const by = String(t?.created_by ?? '');
            return `${id} ${db} ${sub} ${by}`.toLowerCase().includes(q);
        });
    }, [tenants, tenantsQuery]);

    const pagedTenants = useMemo(() => {
        const size = Number(tenantsPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredTenants.length || 0) / size));
        const page = Math.min(Math.max(1, Number(tenantsPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredTenants.slice(start, start + size);
    }, [filteredTenants, tenantsPage, tenantsPageSize]);

    const filteredPaidApps = useMemo(() => {
        const q = (paidAppsQuery || '').trim().toLowerCase();
        if (!q) return visiblePaidApplications || [];
        return (visiblePaidApplications || []).filter((a) => {
            const company = String(a?.company_name ?? '');
            const email = String(a?.email ?? '');
            const plan = String(a?.plan ?? '');
            const txn = String(a?.transaction_id ?? '');
            const status = String(a?.payment_status ?? '');
            return `${company} ${email} ${plan} ${txn} ${status}`.toLowerCase().includes(q);
        });
    }, [visiblePaidApplications, paidAppsQuery]);

    const pagedPaidApps = useMemo(() => {
        const size = Number(paidAppsPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredPaidApps.length || 0) / size));
        const page = Math.min(Math.max(1, Number(paidAppsPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredPaidApps.slice(start, start + size);
    }, [filteredPaidApps, paidAppsPage, paidAppsPageSize]);

    const filteredPlans = useMemo(() => {
        const q = (plansQuery || '').trim().toLowerCase();
        if (!q) return subscriptionPlans || [];
        return (subscriptionPlans || []).filter((p) => {
            const name = String(p?.name ?? '');
            const id = String(p?.planId ?? '');
            const price = String(p?.price ?? '');
            const feats = String(p?.features ?? '');
            return `${name} ${id} ${price} ${feats}`.toLowerCase().includes(q);
        });
    }, [subscriptionPlans, plansQuery]);

    const pagedPlans = useMemo(() => {
        const size = Number(plansPageSize) || 6;
        const totalPages = Math.max(1, Math.ceil((filteredPlans.length || 0) / size));
        const page = Math.min(Math.max(1, Number(plansPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredPlans.slice(start, start + size);
    }, [filteredPlans, plansPage, plansPageSize]);

    const filteredUsers = useMemo(() => {
        const q = (usersQuery || '').trim().toLowerCase();
        if (!q) return users || [];
        return (users || []).filter((u) => {
            const name = String(u?.name ?? '');
            const email = String(u?.email ?? '');
            const role = String(u?.role ?? '');
            return `${name} ${email} ${role}`.toLowerCase().includes(q);
        });
    }, [users, usersQuery]);

    const pagedUsers = useMemo(() => {
        const size = Number(usersPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredUsers.length || 0) / size));
        const page = Math.min(Math.max(1, Number(usersPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredUsers.slice(start, start + size);
    }, [filteredUsers, usersPage, usersPageSize]);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            {(flashSuccess || flashError) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    {flashSuccess && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
                            {flashSuccess}
                        </div>
                    )}
                    {flashError && (
                        <div className={`${flashSuccess ? 'mt-3 ' : ''}p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm`}>
                            {flashError}
                        </div>
                    )}
                </div>
            )}
            {editingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Edit Tenant #{editingTenant.id}</h3>
                        <form onSubmit={handleEditTenantSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subscription ID
                                </label>
                                <input
                                    type="text"
                                    name="subscription_id"
                                    value={editTenantForm.subscription_id}
                                    onChange={handleEditTenantChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditTenant}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Header */}
            <header className={`sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-baseline space-x-3">
                                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                    Super Admin
                                </h1>
                                <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Admin Console
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage organization tenants, subscriptions, and system settings
                            </p>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                        {getInitials(user.name)}
                                    </div>
                                    <div className="ml-2 text-left">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                    </div>
                                    <FiChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                                </div>
                            </button>

                            {/* Dropdown menu */}
                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="py-1" role="none">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-sm text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>

                                        <a
                                            href={route('profile.edit')}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"

                                        >
                                            <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                                            Your Profile
                                        </a>


                                        <button
                                            onClick={() => Inertia.post(route('logout'))}
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                        >
                                            <FiLogOut className="mr-3 h-5 w-5" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-73px)] sticky top-[73px] p-4 hidden md:block">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.key
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {activeTab !== tab.key && <FiChevronRight className="ml-auto opacity-50" />}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Mobile menu button */}
                <div className="md:hidden fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => setShowCreateTenant(!showCreateTenant)}
                        className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        <FiPlus className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile menu */}
                {showCreateTenant && (
                    <div className="md:hidden fixed inset-0 z-40">
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowCreateTenant(false)}
                        />
                        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Create New</h3>
                                <button
                                    onClick={() => setShowCreateTenant(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setActiveTab('tenants');
                                        setShowCreateTenant(false);
                                    }}
                                    className="w-full flex items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                >
                                    <FiUsers className="mr-2" />
                                    New Tenant
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('plans');
                                        setShowCreateTenant(false);
                                    }}
                                    className="w-full flex items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                >
                                    <FiCreditCard className="mr-2" />
                                    New Plan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8">
                    {/* Dashboard Tab */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm mb-1">Total Tenants</p>
                                            <p className="text-3xl font-bold">{tenants?.length || 0}</p>
                                        </div>
                                        <FiUsers className="h-10 w-10 text-white/80" />
                                    </div>
                                    <div className="mt-4 text-xs text-white/80">Provisioned tenant databases</div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm mb-1">Active Subscriptions</p>
                                            <p className="text-3xl font-bold">
                                                {subscriptionPlans?.reduce((acc, plan) => acc + (plan.subscriptions_count || 0), 0) || 0}
                                            </p>
                                        </div>
                                        <FiCreditCard className="h-10 w-10 text-white/80" />
                                    </div>
                                    <div className="mt-4 text-xs text-white/80">Across all plans</div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm mb-1">Pending Applications</p>
                                            <p className="text-3xl font-bold">{visiblePaidApplications?.length || 0}</p>
                                        </div>
                                        <FiFileText className="h-10 w-10 text-white/80" />
                                    </div>
                                    <div className="mt-4 text-xs text-white/80">Paid, not provisioned yet</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm mb-1">Estimated Revenue</p>
                                            <p className="text-3xl font-bold">
                                                ${(
                                                    subscriptionPlans?.reduce(
                                                        (acc, plan) => acc + ((Number(plan.price) || 0) * (plan.subscriptions_count || 0)),
                                                        0
                                                    ) || 0
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <FiDollarSign className="h-10 w-10 text-white/80" />
                                    </div>
                                    <div className="mt-4 text-xs text-white/80">Based on plan price × subscriptions</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Common admin operations</p>

                                    <div className="mt-5 grid sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowTenantForm(true)}
                                            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tenants</div>
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white">Create Tenant</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Provision a new tenant database</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    <FiUsers className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowPlanForm(true)}
                                            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Plans</div>
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white">Create Plan</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add a subscription plan</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                    <FiCreditCard className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('paidApps')}
                                            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Applications</div>
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white">Review Paid Apps</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Create tenants from payments</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                    <FiFileText className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('users')}
                                            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Admin</div>
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white">Manage Users</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Super admin accounts</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                    <FiUser className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                                            <h2 className="text-lg font-semibold">Recent Tenants</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest provisioned tenants</p>
                                        </div>
                                        <div className="p-6 space-y-3">
                                            {(tenants || []).slice(0, 4).map((t) => (
                                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Tenant #{t.id}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{t.database}</div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                                                    </div>
                                                </div>
                                            ))}
                                            {(tenants || []).length === 0 && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">No tenants yet.</div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('tenants')}
                                                className="w-full mt-2 inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200"
                                            >
                                                View Tenants
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                                            <h2 className="text-lg font-semibold">Pending Provisioning</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Paid applications ready to create</p>
                                        </div>
                                        <div className="p-6 space-y-3">
                                            {(visiblePaidApplications || []).slice(0, 3).map((app) => (
                                                <div key={app.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-transparent dark:border-gray-700">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{app.company_name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{app.email}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Plan: <span className="capitalize">{app.plan}</span></div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTenantFromApplication(app)}
                                                            className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            Create
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(visiblePaidApplications || []).length === 0 && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">No pending applications.</div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('paidApps')}
                                                className="w-full mt-2 inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                                            >
                                                Review Applications
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tenants Tab */}
                    {activeTab === "tenants" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Tenants</h2>
                                    <p className="text-gray-600 dark:text-gray-400">List of all provisioned tenant databases</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="w-full lg:max-w-sm">
                                        <input
                                            value={tenantsQuery}
                                            onChange={(e) => {
                                                setTenantsQuery(e.target.value);
                                                setTenantsPage(1);
                                            }}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                            placeholder="Search tenants (id, database, subscription)..."
                                        />
                                    </div>
                                    <PaginationControls
                                        page={tenantsPage}
                                        pageSize={tenantsPageSize}
                                        total={filteredTenants.length}
                                        onPageChange={(p) => setTenantsPage(p)}
                                        onPageSizeChange={(n) => {
                                            setTenantsPageSize(n);
                                            setTenantsPage(1);
                                        }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Database</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscription ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedTenants.length > 0 ? (
                                                pagedTenants.map((tenant) => (
                                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-mono">{tenant.database}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">{tenant.subscription_id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tenant.created_by || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditTenant(tenant)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTenant(tenant)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiUsers className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No tenants found</p>
                                                            <p className="text-sm">Try adjusting your search.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paid Applications Tab */}
                    {activeTab === "paidApps" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold">Paid Applications</h2>
                                <p className="text-gray-600 dark:text-gray-400">View and manage paid applications</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="w-full lg:max-w-sm">
                                        <input
                                            value={paidAppsQuery}
                                            onChange={(e) => {
                                                setPaidAppsQuery(e.target.value);
                                                setPaidAppsPage(1);
                                            }}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                            placeholder="Search applications (company, email, plan, txn)..."
                                        />
                                    </div>
                                    <PaginationControls
                                        page={paidAppsPage}
                                        pageSize={paidAppsPageSize}
                                        total={filteredPaidApps.length}
                                        onPageChange={(p) => setPaidAppsPage(p)}
                                        onPageSizeChange={(n) => {
                                            setPaidAppsPageSize(n);
                                            setPaidAppsPage(1);
                                        }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedPaidApps.length > 0 ? (
                                                pagedPaidApps.map((app) => (
                                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{app.company_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{app.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{app.plan}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{app.transaction_id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.payment_status === 'Paid'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                }`}>
                                                                {app.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(app.created_at)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                            {app.tenant_created ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                    Tenant created
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startTenantFromApplication(app)}
                                                                    disabled={provisioningAppIds.has(app.id)}
                                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${provisioningAppIds.has(app.id)
                                                                        ? 'bg-blue-400 cursor-not-allowed'
                                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                                        }`}
                                                                >
                                                                    {provisioningAppIds.has(app.id) ? 'Creating…' : 'Create Tenant'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiFileText className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No paid applications</p>
                                                            <p className="text-sm">Try adjusting your search.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subscription Plans Tab */}
                    {activeTab === "plans" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Subscription Plans</h2>
                                    <p className="text-gray-600 dark:text-gray-400">Manage your subscription plans</p>
                                </div>
                                <button
                                    onClick={() => setShowPlanForm(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FiPlus className="mr-2" />
                                    Add Plan
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="w-full lg:max-w-sm">
                                        <input
                                            value={plansQuery}
                                            onChange={(e) => {
                                                setPlansQuery(e.target.value);
                                                setPlansPage(1);
                                            }}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                            placeholder="Search plans (name, id, features)..."
                                        />
                                    </div>
                                    <PaginationControls
                                        page={plansPage}
                                        pageSize={plansPageSize}
                                        total={filteredPlans.length}
                                        onPageChange={(p) => setPlansPage(p)}
                                        onPageSizeChange={(n) => {
                                            setPlansPageSize(n);
                                            setPlansPage(1);
                                        }}
                                        pageSizeOptions={[3, 6, 9, 12]}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pagedPlans.length > 0 ? (
                                    pagedPlans.map((plan) => (
                                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {plan.planId}
                                                    </span>
                                                </div>
                                                <div className="mb-6">
                                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                                                    {plan.period && <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>}
                                                </div>
                                                <ul className="space-y-3 mb-6">
                                                    {plan.features.split(',').map((feature, idx) => (
                                                        <li key={idx} className="flex items-center">
                                                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-gray-700 dark:text-gray-300">{feature.trim()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                                    Select Plan
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                            <FiCreditCard className="h-12 w-12 opacity-30" />
                                            <p className="text-lg font-medium">No subscription plans</p>
                                            <p className="text-sm">Try adjusting your search.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Plan Creation Modal */}
                            {showPlanForm && (
                                <div className="fixed inset-0 z-50 overflow-y-auto">
                                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                        {/* Background overlay */}
                                        <div
                                            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                            onClick={() => setShowPlanForm(false)}
                                        />

                                        {/* Modal panel */}
                                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Plan</h3>
                                            </div>
                                            <div className="p-6">
                                                <form onSubmit={handlePlanSubmit} className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan ID</label>
                                                            <input
                                                                type="text"
                                                                name="planId"
                                                                value={planForm.planId}
                                                                onChange={handlePlanChange}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                                placeholder="e.g., premium-monthly"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={planForm.name}
                                                                onChange={handlePlanChange}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                                placeholder="e.g., Premium Monthly"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                                                            <div className="relative rounded-md shadow-sm">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    name="price"
                                                                    value={planForm.price}
                                                                    onChange={handlePlanChange}
                                                                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min="0"
                                                                    required
                                                                />
                                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                    <span className="text-gray-500 sm:text-sm">USD</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                                                            <input
                                                                type="number"
                                                                name="durationDays"
                                                                value={planForm.durationDays}
                                                                onChange={handlePlanChange}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                                placeholder="e.g., 30"
                                                                min="1"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features (comma separated)</label>
                                                            <textarea
                                                                name="features"
                                                                value={planForm.features}
                                                                onChange={handlePlanChange}
                                                                rows="3"
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                                placeholder="e.g., 10 users, 50GB storage, Priority support"
                                                                required
                                                            ></textarea>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end">

                                                    </div>
                                                    <div className="flex justify-end space-x-3 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPlanForm(false)}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            Create Plan
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Super Admin Users Tab */}
                    {activeTab === "users" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Super Admin Users</h2>
                                    <p className="text-gray-600 dark:text-gray-400">Manage platform users</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4">Create Company Admin</h3>
                                <form onSubmit={handleUserSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant ID</label>
                                            <input
                                                type="number"
                                                name="tenantid"
                                                placeholder="Tenant ID"
                                                value={userForm.tenantid}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Full name"
                                                value={userForm.name}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="email@example.com"
                                                value={userForm.email}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={userSubmitting}
                                            className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors ${userSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <FiPlus className="mr-2" />
                                            {userSubmitting ? 'Creating…' : 'Create Company Admin'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="w-full lg:max-w-sm">
                                        <input
                                            value={usersQuery}
                                            onChange={(e) => {
                                                setUsersQuery(e.target.value);
                                                setUsersPage(1);
                                            }}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                            placeholder="Search users (name, email, role)..."
                                        />
                                    </div>
                                    <PaginationControls
                                        page={usersPage}
                                        pageSize={usersPageSize}
                                        total={filteredUsers.length}
                                        onPageChange={(p) => setUsersPage(p)}
                                        onPageSizeChange={(n) => {
                                            setUsersPageSize(n);
                                            setUsersPage(1);
                                        }}
                                        className="w-full lg:w-auto"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {pagedUsers.length > 0 ? (
                                                pagedUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(user.created_at)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiUsers className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No users found</p>
                                                            <p className="text-sm">Try adjusting your search.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Tenant Creation Modal */}
            {showTenantForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowTenantForm(false)}
                        />

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Tenant</h3>
                            </div>
                            <div className="px-6 py-4">
                                <form onSubmit={handleTenantSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription ID</label>
                                        <input
                                            type="text"
                                            name="subscriptionId"
                                            placeholder="Enter subscription ID"
                                            value={tenantForm.subscriptionId}
                                            onChange={handleTenantChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Database Name</label>
                                        <input
                                            type="text"
                                            name="database"
                                            placeholder="Enter database name"
                                            value={tenantForm.database}
                                            onChange={handleTenantChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created By (optional)</label>
                                        <input
                                            type="number"
                                            name="createdby"
                                            placeholder="Enter user ID"
                                            value={tenantForm.createdby}
                                            onChange={handleTenantChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowTenantForm(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Create Tenant
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}