import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function TenantDashboard({ users, tenant_id, connected_db }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
                        </div>

                        {/* Tenant info */}
                        <div className="p-6">
                            <p><strong>Tenant ID:</strong> {tenant_id}</p>
                            <p><strong>Connected DB:</strong> {connected_db}</p>
                        </div>

                        {/* Users table */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Users in this Tenant</h3>
                            <table className="w-full border">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Name</th>
                                        <th className="p-2">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="p-2">{user.id}</td>
                                            <td className="p-2">{user.name}</td>
                                            <td className="p-2">{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
