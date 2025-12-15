import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";

import { FiUsers, FiFileText, FiCreditCard, FiPlus, FiChevronRight, FiLogOut, FiUser, FiSettings, FiChevronDown, FiX, FiLayout, FiDollarSign } from 'react-icons/fi';

export default function Dashboard({ auth, tenants, paidApplications, subscriptionPlans }) {
    const [activeTab, setActiveTab] = useState("dashboard");

    const [showCreateTenant, setShowCreateTenant] = useState(false);
    const [showTenantForm, setShowTenantForm] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
    // Get authenticated user data from Inertia props
    const { auth } = usePage().props;
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

    const [tenantForm, setTenantForm] = useState({
        subscriptionId: "",
        database: "",
        createdby: "",
    });

    const [planForm, setPlanForm] = useState({
        planId: "",
        name: "",
        price: "",
        features: "",
        durationDays: "",
    });
    const [userForm, setUserForm] = useState({
    tenantid:"",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "",
});

    const handleTenantChange = (e) =>
        setTenantForm({ ...tenantForm, [e.target.name]: e.target.value });

    const handlePlanChange = (e) =>
        setPlanForm({ ...planForm, [e.target.name]: e.target.value });

    const handleTenantSubmit = (e) => {
        e.preventDefault();
        Inertia.post("/superadmin/tenants", tenantForm);
    };

    const handlePlanSubmit = (e) => {
        e.preventDefault();
        Inertia.post("/subscription-plans", planForm);
    };
    const handleUserChange = (e) =>
    setUserForm({ ...userForm, [e.target.name]: e.target.value });

const handleUserSubmit = (e) => {
    e.preventDefault();
    Inertia.post("/users", userForm);
};

    // Sidebar tab labels
    const tabs = [

        { key: "dashboard", label: "Dashboard", icon: <FiLayout className="mr-2" /> },
        { key: "tenants", label: "Tenants", icon: <FiUsers className="mr-2" /> },
        { key: "paidApps", label: "Paid Applications", icon: <FiFileText className="mr-2" />  },
        { key: "plans", label: "Subscription Plans",icon: <FiCreditCard className="mr-2" />  },
        { key: "users", label: "Super Admin Users", icon: <FiUsers className="mr-2" /> }, 
    ];

    return (
                <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
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
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === tab.key
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
                                {/* Total Tenants Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tenants</p>
                                            <p className="text-3xl font-bold mt-1">{tenants?.length || 0}</p>
                                        </div>
                                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200">
                                            <FiUsers className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Active now</p>
                                    </div>
                                </div>
                                
                                {/* Active Subscriptions Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Subscriptions</p>
                                            <p className="text-3xl font-bold mt-1">
                                                {subscriptionPlans?.reduce((acc, plan) => acc + (plan.subscriptions_count || 0), 0) || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200">
                                            <FiCreditCard className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-sm text-green-600 dark:text-green-400">+2.5% from last month</p>
                                    </div>
                                </div>
                                
                                {/* Pending Applications Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Applications</p>
                                            <p className="text-3xl font-bold mt-1">{paidApplications?.length || 0}</p>
                                        </div>
                                        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200">
                                            <FiFileText className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Needs review</p>
                                    </div>
                                </div>
                                
                                {/* Revenue Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                                            <p className="text-3xl font-bold mt-1">
                                                ${subscriptionPlans?.reduce((acc, plan) => acc + ((plan.price || 0) * (plan.subscriptions_count || 0)), 0).toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200">
                                            <FiDollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-sm text-green-600 dark:text-green-400">+12.3% from last month</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Recent Activity Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {tenants?.slice(0, 5).map((tenant, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                    <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">New tenant registered</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.name}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(tenant.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
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
                                    <p className="text-gray-600 dark:text-gray-400">Manage your organization's tenants</p>
                                </div>
                                <button
                                    onClick={() => setShowTenantForm(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FiPlus className="mr-2" />
                                    Add Tenant
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Database</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscription ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {tenants.length > 0 ? (
                                                tenants.map((tenant) => (
                                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tenant.database}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">{tenant.subscription_id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tenant.created_by || '-'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiUsers className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No tenants found</p>
                                                            <p className="text-sm">Get started by creating your first tenant</p>
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
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {paidApplications.length > 0 ? (
                                                paidApplications.map((app) => (
                                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{app.company_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{app.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{app.plan}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{app.transaction_id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                app.payment_status === 'completed' 
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            }`}>
                                                                {app.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{app.created_at}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiFileText className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No paid applications</p>
                                                            <p className="text-sm">Paid applications will appear here</p>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subscriptionPlans.length > 0 ? (
                                    subscriptionPlans.map((plan) => (
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
                                            <p className="text-sm">Create your first subscription plan to get started</p>
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
                                <h3 className="text-lg font-semibold mb-4">Create New User</h3>
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                            <input
                                                type="text"
                                                name="role"
                                                placeholder="e.g., Super_admin, company_admin"
                                                value={userForm.role}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="••••••••"
                                                value={userForm.password}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="password_confirmation"
                                                placeholder="••••••••"
                                                value={userForm.password_confirmation}
                                                onChange={handleUserChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <FiPlus className="mr-2" />
                                            Create User
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.created_at}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                                                            <FiUsers className="h-12 w-12 opacity-30" />
                                                            <p className="text-lg font-medium">No users found</p>
                                                            <p className="text-sm">Create your first user to get started</p>
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