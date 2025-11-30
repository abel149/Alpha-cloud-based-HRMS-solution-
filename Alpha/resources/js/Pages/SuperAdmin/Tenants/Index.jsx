import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { FiUsers, FiFileText, FiCreditCard, FiPlus, FiChevronRight, FiLogOut, FiUser, FiSettings, FiChevronDown, FiX } from 'react-icons/fi';

export default function Dashboard({ tenants, paidApplications, subscriptionPlans ,users }) {

    const [activeTab, setActiveTab] = useState("tenants");
    const [showCreateTenant, setShowCreateTenant] = useState(false);
    const [showTenantForm, setShowTenantForm] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
    // Get authenticated user data from Inertia props
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

        { key: "tenants", label: "Tenants", icon: <FiUsers className="mr-2" /> },
        { key: "paidApps", label: "Paid Applications", icon: <FiFileText className="mr-2" />  },
        { key: "plans", label: "Subscription Plans",icon: <FiCreditCard className="mr-2" />  },
        { key: "users", label: "Super Admin Users", icon: <FiUsers className="mr-2" /> }, 
    ];

    return (
                <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
    {/* Header */}
            <header className={`sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Tenant Management
                        </h1>
                        
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

                );
                {/* Super Admin Users */}
{activeTab === "users" && (
    <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-2">Super Admin Users</h3>

        {/* User Creation Form */}
        <form
            onSubmit={handleUserSubmit}
            className="space-y-3 bg-white p-4 shadow rounded-lg"
        >
            <h4 className="font-semibold">Create New User</h4>
            <input
                type="Number"
                name="tenantid"
                placeholder="Tenant ID"
                value={userForm.tenantid}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <input
                type="text"
                name="name"
                placeholder="Name"
                value={userForm.name}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={userForm.email}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={userForm.password}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <input
                type="password"
                name="password_confirmation"
                placeholder="Confirm Password"
                value={userForm.password_confirmation}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <input
                type="text"
                name="role"
                placeholder="Role (e.g., Super Admin, Support)"
                value={userForm.role}
                onChange={handleUserChange}
                className="border p-2 w-full"
                required
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
                Create User
            </button>
        </form>

        {/* Users Table */}
        
            <table className="w-full border bg-white shadow-sm rounded-lg">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td className="p-2">{user.name}</td>
                                <td className="p-2">{user.email}</td>
                                <td className="p-2">{user.role}</td>
                                <td className="p-2">{user.created_at}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-4 text-center text-gray-500">
                                No users found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        
    </div>
)}
                </div> )} </div>)};