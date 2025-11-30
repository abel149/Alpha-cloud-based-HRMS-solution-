import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";

export default function Dashboard({ tenants, paidApplications, subscriptionPlans ,users }) {
    const [activeTab, setActiveTab] = useState("tenants");

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

    // Handlers
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
        { key: "tenants", label: "Tenants" },
        { key: "paidApps", label: "Paid Applications" },
        { key: "plans", label: "Subscription Plans" },
        { key: "users", label: "Super Admin Users" }, 
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-6">
                <h1 className="text-2xl font-bold mb-8">Super Admin</h1>
                <nav className="space-y-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`w-full text-left p-2 rounded ${
                                activeTab === tab.key
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-200"
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

                {/* Tenants */}
                {activeTab === "tenants" && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold mb-2">Active Tenants</h3>
                        <table className="w-full border bg-white shadow-sm rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">ID</th>
                                    <th className="p-2">Database</th>
                                    <th className="p-2">Subscription ID</th>
                                    <th className="p-2">Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.length > 0 ? (
                                    tenants.map((tenant) => (
                                        <tr key={tenant.id}>
                                            <td className="p-2">{tenant.id}</td>
                                            <td className="p-2">{tenant.database}</td>
                                            <td className="p-2">{tenant.subscription_id}</td>
                                            <td className="p-2">{tenant.created_by || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500">
                                            No tenants found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Tenant Creation Form */}
                        <form onSubmit={handleTenantSubmit} className="space-y-3 bg-white p-4 shadow rounded-lg">
                            <h3 className="text-lg font-semibold">Create New Tenant</h3>
                            <input
                                type="text"
                                name="subscriptionId"
                                placeholder="Subscription ID"
                                value={tenantForm.subscriptionId}
                                onChange={handleTenantChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="text"
                                name="database"
                                placeholder="Database Name"
                                value={tenantForm.database}
                                onChange={handleTenantChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="number"
                                name="createdby"
                                placeholder="Created By (optional)"
                                value={tenantForm.createdby}
                                onChange={handleTenantChange}
                                className="border p-2 w-full"
                            />
                            <button className="px-4 py-2 bg-green-600 text-white rounded">
                                Create Tenant
                            </button>
                        </form>
                    </div>
                )}

                {/* Paid Applications */}
                {activeTab === "paidApps" && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold mb-2">Paid Applications</h3>
                        <table className="w-full border bg-white shadow-sm rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">Company</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Plan</th>
                                    <th className="p-2">Tx ID</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paidApplications.length > 0 ? (
                                    paidApplications.map((app) => (
                                        <tr key={app.id}>
                                            <td className="p-2">{app.company_name}</td>
                                            <td className="p-2">{app.email}</td>
                                            <td className="p-2 capitalize">{app.plan}</td>
                                            <td className="p-2">{app.transaction_id}</td>
                                            <td className="p-2 text-green-600 font-semibold">{app.payment_status}</td>
                                            <td className="p-2">{app.created_at}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">
                                            No paid applications found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Subscription Plans */}
                {activeTab === "plans" && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold mb-2">Subscription Plans</h3>

                        <form onSubmit={handlePlanSubmit} className="space-y-3 bg-white p-4 shadow rounded-lg">
                            <h4 className="font-semibold">Create New Plan</h4>
                            <input
                                type="text"
                                name="planId"
                                placeholder="Plan ID"
                                value={planForm.planId}
                                onChange={handlePlanChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={planForm.name}
                                onChange={handlePlanChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="number"
                                name="price"
                                placeholder="Price"
                                value={planForm.price}
                                onChange={handlePlanChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="text"
                                name="features"
                                placeholder="Features"
                                value={planForm.features}
                                onChange={handlePlanChange}
                                className="border p-2 w-full"
                                required
                            />
                            <input
                                type="number"
                                name="durationDays"
                                placeholder="Duration (Days)"
                                value={planForm.durationDays}
                                onChange={handlePlanChange}
                                className="border p-2 w-full"
                                required
                            />
                            <button className="px-4 py-2 bg-blue-600 text-white rounded">
                                Create Plan
                            </button>
                        </form>

                        <table className="w-full border bg-white shadow-sm rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">Plan ID</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Price</th>
                                    <th className="p-2">Features</th>
                                    <th className="p-2">Duration (Days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptionPlans.length > 0 ? (
                                    subscriptionPlans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td className="p-2">{plan.planId}</td>
                                            <td className="p-2">{plan.name}</td>
                                            <td className="p-2">{plan.price}</td>
                                            <td className="p-2">{plan.features}</td>
                                            <td className="p-2">{plan.durationDays}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-gray-500">
                                            No subscription plans found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
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

            </main>
        </div>
    );
}
