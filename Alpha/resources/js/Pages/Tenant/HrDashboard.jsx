import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function HrDashboard({ user, tenant_db }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    HR Team Dashboard
                </h2>
            }
        >
            <Head title="HR Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <p className="text-sm text-gray-500 mb-2">Logged in as: {user?.name} ({user?.role})</p>
                        <p className="text-sm text-gray-500">Tenant DB: {tenant_db}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Hire / Offboard Employees</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Manage employee lifecycle for your company.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Onboard new employees</li>
                                <li>Update employee records</li>
                                <li>Offboard departing staff</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Process Leave Requests</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Review and manage leave applications from employees.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>View pending leave requests</li>
                                <li>Approve or reject requests</li>
                                <li>Apply company leave policies</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Monitor Attendance</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Track attendance and working hours across departments.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>View daily attendance summaries</li>
                                <li>Identify late arrivals / absences</li>
                                <li>Export attendance reports</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
