import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function DepartmentManagerDashboard({ user, tenant_db }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Department Manager Dashboard
                </h2>
            }
        >
            <Head title="Department Manager" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <p className="text-sm text-gray-500 mb-2">Logged in as: {user?.name} ({user?.role})</p>
                        <p className="text-sm text-gray-500">Tenant DB: {tenant_db}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Approve Team Leave Requests</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Manage leave for your direct reports.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>View pending leave requests</li>
                                <li>Approve or reject requests</li>
                                <li>See remaining leave balances</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">View Team Attendance</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Monitor attendance and punctuality for your team.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>View daily/weekly attendance dashboards</li>
                                <li>Identify late or absent patterns</li>
                                <li>Export team attendance summaries</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Performance Reviews</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Prepare and submit performance reviews.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Track upcoming review cycles</li>
                                <li>Submit evaluations for team members</li>
                                <li>Record goals and feedback</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
