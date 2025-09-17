import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";

export default function TenantsIndex({ tenants }) {
    const [form, setForm] = useState({
        subscriptionId: "",
        database: "",
        createdby: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Inertia.post("/superadmin/tenants", form);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Tenant Management</h1>

            {/* Table */}
            <table className="w-full mb-6 border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2">ID</th>
                        <th className="p-2">Database</th>
                        <th className="p-2">Subscription ID</th>
                        <th className="p-2">Created By</th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                            <td className="p-2">{tenant.id}</td>
                            <td className="p-2">{tenant.database}</td>
                            <td className="p-2">{tenant.subscription_id}</td>
                            <td className="p-2">{tenant.created_by || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Create Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="subscriptionId"
                    placeholder="Subscription ID"
                    value={form.subscriptionId}
                    onChange={handleChange}
                    className="border p-2 w-full"
                    required
                />
                <input
                    type="text"
                    name="database"
                    placeholder="Database Name"
                    value={form.database}
                    onChange={handleChange}
                    className="border p-2 w-full"
                    required
                />
                <input
                    type="number"
                    name="createdby"
                    placeholder="Created By (optional)"
                    value={form.createdby}
                    onChange={handleChange}
                    className="border p-2 w-full"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >
                    Create Tenant
                </button>
            </form>
        </div>
    );
}
