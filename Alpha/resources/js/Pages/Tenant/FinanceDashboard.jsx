import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function FinanceDashboard({ user, tenant_db }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Finance Team Dashboard
                </h2>
            }
        >
            <Head title="Finance Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <p className="text-sm text-gray-500 mb-2">Logged in as: {user?.name} ({user?.role})</p>
                        <p className="text-sm text-gray-500">Tenant DB: {tenant_db}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Run Monthly Payroll</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Prepare and execute monthly payroll for employees.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Review salary and allowance data</li>
                                <li>Generate payroll runs</li>
                                <li>Export bank/payment files</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Generate Audit Reports</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Access financial reports for audits and reviews.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Payroll history and summaries</li>
                                <li>Tax and deduction reports</li>
                                <li>Export data for auditors</li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Tax & Deduction Adjustments</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Manage tax rules and special deductions.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Configure tax brackets</li>
                                <li>Apply one-time adjustments</li>
                                <li>Review compliance status</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
