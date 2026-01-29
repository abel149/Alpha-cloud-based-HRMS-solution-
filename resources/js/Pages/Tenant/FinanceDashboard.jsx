import { Head } from '@inertiajs/inertia-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { FiChevronDown, FiDownload, FiFileText, FiLogOut, FiPlus, FiShield, FiUser, FiBriefcase, FiX } from 'react-icons/fi';

export default function FinanceDashboard({ user, tenant_db }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('payroll');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [employees, setEmployees] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [auditReport, setAuditReport] = useState(null);
    const [adjustments, setAdjustments] = useState([]);
    const [financeSettings, setFinanceSettings] = useState({ tax_rate_percent: 0, deduction_rate_percent: 0 });
    const [runDetailsOpen, setRunDetailsOpen] = useState(false);
    const [runDetailsLoading, setRunDetailsLoading] = useState(false);
    const [runDetails, setRunDetails] = useState(null);
    const [runDetailsItems, setRunDetailsItems] = useState([]);
    const [warning, setWarning] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [payrollPreview, setPayrollPreview] = useState(null);
    const [payrollPreviewLoading, setPayrollPreviewLoading] = useState(false);

    const now = new Date();
    const [payrollForm, setPayrollForm] = useState({
        month: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
    });

    const [settingsForm, setSettingsForm] = useState({
        tax_rate_percent: '0',
        deduction_rate_percent: '0',
    });

    const [adjustmentForm, setAdjustmentForm] = useState({
        employee_id: '',
        month: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
        type: 'deduction',
        amount: '',
        description: '',
    });

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const appBaseUrl = () => {
        const meta = document.querySelector('meta[name="app-base-url"]');
        const v = meta?.getAttribute('content');
        return (v || '').replace(/\/+$/, '');
    };

    const appBasePath = () => {
        try {
            const u = new URL(appBaseUrl() || window.location.href, window.location.href);
            return (u.pathname || '').replace(/\/+$/, '');
        } catch {
            return '';
        }
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const saveFinanceSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.settings.update'), {
                method: 'POST',
                body: JSON.stringify({
                    tax_rate_percent: Number(settingsForm.tax_rate_percent),
                    deduction_rate_percent: Number(settingsForm.deduction_rate_percent),
                }),
            });
            setSuccess('Company tax/deduction settings saved');
            if (data?.settings) {
                setFinanceSettings(data.settings);
            }
            await loadAuditReport();
        } catch (e2) {
            setError(e2?.message || 'Failed to save finance settings');
        } finally {
            setLoading(false);
        }
    };

    const xsrfTokenFromCookie = () => {
        const raw = getCookie('XSRF-TOKEN');
        if (!raw) return null;
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    };

    const normalizeSameOriginUrl = (url) => {
        const basePath = appBasePath();
        try {
            const u = new URL(url, window.location.href);
            const path = `${u.pathname}${u.search}${u.hash}`;
            if (basePath && path.startsWith('/') && !path.startsWith(`${basePath}/`) && path !== basePath) {
                return `${basePath}${path}`;
            }
            return path;
        } catch {
            if (basePath && typeof url === 'string' && url.startsWith('/') && !url.startsWith(`${basePath}/`) && url !== basePath) {
                return `${basePath}${url}`;
            }
            return url;
        }
    };

    const fetchJson = async (url, options = {}) => {
        const method = (options.method || 'GET').toUpperCase();
        const isJsonBody = options.body && typeof options.body === 'string';

        const csrf = csrfToken();
        const xsrf = xsrfTokenFromCookie();

        const res = await fetch(normalizeSameOriginUrl(url), {
            ...options,
            method,
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
                ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                ...(!xsrf && csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                ...(options.headers || {}),
            },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const message = res.status === 419
                ? 'Session/CSRF expired. Refresh the page and try again.'
                : (data?.message || `Request failed (${res.status})`);
            throw new Error(message);
        }
        return data;
    };

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const tabs = [
        { key: 'payroll', label: 'Payroll', icon: <FiBriefcase className="mr-2" /> },
        { key: 'reports', label: 'Reports', icon: <FiFileText className="mr-2" /> },
        { key: 'tax', label: 'Tax & Deductions', icon: <FiShield className="mr-2" /> },
    ];

    const selectedEmployee = useMemo(() => {
        if (!adjustmentForm.employee_id) return null;
        return (employees || []).find((e) => String(e.id) === String(adjustmentForm.employee_id)) || null;
    }, [employees, adjustmentForm.employee_id]);

    const filteredPayrollRuns = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return payrollRuns || [];
        return (payrollRuns || []).filter((r) => {
            const period = `${r?.year ?? ''}-${r?.month ?? ''}`;
            return `${period} ${r?.status ?? ''} ${r?.id ?? ''}`.toLowerCase().includes(q);
        });
    }, [payrollRuns, searchTerm]);

    const filteredAdjustments = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return adjustments || [];
        return (adjustments || []).filter((a) => {
            const emp = a?.employee?.user?.name || '';
            const period = `${a?.year ?? ''}-${a?.month ?? ''}`;
            return `${emp} ${period} ${a?.type ?? ''} ${a?.description ?? ''}`.toLowerCase().includes(q);
        });
    }, [adjustments, searchTerm]);

    const loadEmployees = async () => {
        const data = await fetchJson(route('tenant.finance.employees.index'));
        setEmployees(Array.isArray(data?.employees) ? data.employees : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadPayrollRuns = async () => {
        const data = await fetchJson(route('tenant.finance.payroll.runs.index'));
        setPayrollRuns(Array.isArray(data?.runs) ? data.runs : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    const openRunDetails = async (run) => {
        const id = run?.id;
        if (!id) return;
        setRunDetailsOpen(true);
        setRunDetailsLoading(true);
        setRunDetails(null);
        setRunDetailsItems([]);
        try {
            const data = await fetchJson(route('tenant.finance.payroll.runs.show', id));
            if (data?.ok) {
                setRunDetails(data?.run || null);
                setRunDetailsItems(Array.isArray(data?.items) ? data.items : []);
            }
        } catch (e) {
            setError(e?.message || 'Failed to load payroll run details');
            setRunDetailsOpen(false);
        } finally {
            setRunDetailsLoading(false);
        }
    };

    const loadAuditReport = async () => {
        const data = await fetchJson(route('tenant.finance.audit.report'));
        setAuditReport(data?.report || null);
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadFinanceSettings = async () => {
        const data = await fetchJson(route('tenant.finance.settings.get'));
        const s = data?.settings || { tax_rate_percent: 0, deduction_rate_percent: 0 };
        setFinanceSettings(s);
        setSettingsForm({
            tax_rate_percent: String(s?.tax_rate_percent ?? 0),
            deduction_rate_percent: String(s?.deduction_rate_percent ?? 0),
        });
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadAdjustments = async () => {
        const data = await fetchJson(route('tenant.finance.adjustments.index'), {
            method: 'GET',
        });
        setAdjustments(Array.isArray(data?.adjustments) ? data.adjustments : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError('');
            setWarning('');
            try {
                await loadEmployees();
                await loadPayrollRuns();
                await loadAuditReport();
                await loadAdjustments();
                await loadFinanceSettings();
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Failed to load finance data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, []);

    const previewPayroll = async (e) => {
        e.preventDefault();
        setPayrollPreviewLoading(true);
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.payroll.preview'), {
                method: 'POST',
                body: JSON.stringify({
                    month: Number(payrollForm.month),
                    year: Number(payrollForm.year),
                }),
            });
            setPayrollPreview(data || null);
            setSuccess('Preview ready');
        } catch (e2) {
            setError(e2?.message || 'Failed to run payroll');
        } finally {
            setLoading(false);
            setPayrollPreviewLoading(false);
        }
    };

    const createDraftPayroll = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.payroll.run'), {
                method: 'POST',
                body: JSON.stringify({
                    month: Number(payrollForm.month),
                    year: Number(payrollForm.year),
                }),
            });
            setSuccess('Draft payroll run created');
            setPayrollPreview(null);
            if (data?.payroll) {
                setPayrollRuns((prev) => [data.payroll, ...(prev || [])]);
            } else {
                await loadPayrollRuns();
            }
            await loadAuditReport();
        } catch (e2) {
            setError(e2?.message || 'Failed to create payroll run');
        } finally {
            setLoading(false);
        }
    };

    const recalculateRun = async (runId) => {
        if (!runId) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.payroll.runs.recalculate', runId), {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setSuccess('Draft payroll recalculated');
            if (data?.payroll) {
                setPayrollRuns((prev) => (prev || []).map((r) => (String(r.id) === String(runId) ? data.payroll : r)));
                if (runDetails?.id && String(runDetails.id) === String(runId)) {
                    setRunDetails(data.payroll);
                    await openRunDetails(data.payroll);
                }
            } else {
                await loadPayrollRuns();
            }
            await loadAuditReport();
        } catch (e2) {
            setError(e2?.message || 'Failed to recalculate');
        } finally {
            setLoading(false);
        }
    };

    const finalizeRun = async (runId) => {
        if (!runId) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.payroll.runs.finalize', runId), {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setSuccess('Payroll finalized');
            if (data?.payroll) {
                setPayrollRuns((prev) => (prev || []).map((r) => (String(r.id) === String(runId) ? data.payroll : r)));
                if (runDetails?.id && String(runDetails.id) === String(runId)) {
                    setRunDetails(data.payroll);
                }
            } else {
                await loadPayrollRuns();
            }
            await loadAuditReport();
        } catch (e2) {
            setError(e2?.message || 'Failed to finalize');
        } finally {
            setLoading(false);
        }
    };

    const submitAdjustment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await fetchJson(route('tenant.finance.adjustments.store'), {
                method: 'POST',
                body: JSON.stringify({
                    employee_id: Number(adjustmentForm.employee_id),
                    month: Number(adjustmentForm.month),
                    year: Number(adjustmentForm.year),
                    type: adjustmentForm.type,
                    amount: Number(adjustmentForm.amount),
                    description: adjustmentForm.description || null,
                }),
            });
            setSuccess('Adjustment saved');
            if (data?.adjustment) {
                setAdjustments((prev) => [data.adjustment, ...(prev || [])]);
            } else {
                await loadAdjustments();
            }
        } catch (e2) {
            setError(e2?.message || 'Failed to save adjustment');
        } finally {
            setLoading(false);
        }
    };

    const downloadUrl = (url) => {
        window.location.href = url;
    };

    const refreshAll = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setWarning('');
        try {
            await loadEmployees();
            await loadPayrollRuns();
            await loadAuditReport();
            await loadAdjustments();
            await loadFinanceSettings();
            setSuccess('Refreshed');
        } catch (e) {
            setError(e?.message || 'Failed to refresh');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head title="Finance Dashboard" />

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                                Finance Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payroll, reports, and tax management</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-medium shadow-lg">
                                    {getInitials(user?.name || 'User')}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="font-medium">{user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                                </div>
                                <FiChevronDown className="h-4 w-4" />
                            </button>

                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <a
                                                href={route('profile.edit')}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <FiUser className="mr-3 h-5 w-5 text-gray-400" /> Your Profile
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => Inertia.post(route('logout'))}
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <FiLogOut className="mr-3 h-5 w-5" /> Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Workspace</p>
                                <p className="text-2xl font-bold">Finance</p>
                            </div>
                            <FiBriefcase className="h-10 w-10 text-white/80" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-3">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Welcome back</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800">
                                Finance Manager
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Run payroll, manage adjustments, and review reports.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="Search payrolls, adjustments..."
                        />
                    </div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={refreshAll}
                        className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                    >
                        Refresh
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-fit">
                        <nav className="space-y-1">
                            {tabs.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setActiveTab(t.key)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === t.key
                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="flex-1">
                        {(warning || error || success) && (
                            <div className="mb-6">
                                {warning && (
                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">{warning}</div>
                                )}
                                {error && (
                                    <div className={`${warning ? 'mt-3 ' : ''}p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm`}>{error}</div>
                                )}
                                {success && (
                                    <div className="mt-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">{success}</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-lg font-semibold">Monthly Payroll Workflow</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Preview payroll, create a draft run, apply corrections/adjustments, then finalize and export. Weekends are excluded. Approved leave is handled using leave policy paid/unpaid rules.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={previewPayroll} className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Month</label>
                                            <input
                                                value={payrollForm.month}
                                                onChange={(e) => setPayrollForm((p) => ({ ...p, month: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="1"
                                                max="12"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Year</label>
                                            <input
                                                value={payrollForm.year}
                                                onChange={(e) => setPayrollForm((p) => ({ ...p, year: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-4 flex flex-wrap gap-2">
                                            <button
                                                disabled={loading || payrollPreviewLoading}
                                                className="w-full md:w-auto inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg shadow-sm hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
                                            >
                                                <FiFileText className="mr-2" /> {payrollPreviewLoading ? 'Previewing...' : 'Preview Payroll'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={createDraftPayroll}
                                                className="w-full md:w-auto inline-flex items-center px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-60"
                                            >
                                                <FiPlus className="mr-2" /> Create Draft Run
                                            </button>
                                        </div>
                                    </form>

                                    {payrollPreview?.ok && (
                                        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                                    <div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">Preview for</div>
                                                        <div className="text-lg font-semibold">{payrollPreview?.period}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Rates used: tax {payrollPreview?.settings?.tax_rate_percent ?? 0}% • deductions {payrollPreview?.settings?.deduction_rate_percent ?? 0}%
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 flex-wrap">
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Employees</div>
                                                            <div className="font-semibold">{payrollPreview?.employees_count ?? '-'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Gross</div>
                                                            <div className="font-semibold">{payrollPreview?.totals?.total_gross ?? '0.00'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Attendance Deductions</div>
                                                            <div className="font-semibold">{payrollPreview?.totals?.total_attendance_deductions ?? '0.00'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Net</div>
                                                            <div className="font-semibold">{payrollPreview?.totals?.total_net ?? '0.00'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead className="bg-white dark:bg-gray-800">
                                                        <tr>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gross</th>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attendance Deduction</th>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tax</th>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deductions</th>
                                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                        {(Array.isArray(payrollPreview?.items) ? payrollPreview.items.slice(0, 50) : []).map((it) => (
                                                            <tr key={it.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                <td className="px-4 py-3 text-sm font-medium">{it.employee_name || `Employee #${it.employee_id}`}</td>
                                                                <td className="px-4 py-3 text-sm">{it.gross ?? '0.00'}</td>
                                                                <td className="px-4 py-3 text-sm">{it.attendance_deduction ?? '0.00'}</td>
                                                                <td className="px-4 py-3 text-sm">{it.tax_total ?? '0.00'}</td>
                                                                <td className="px-4 py-3 text-sm">{it.deduction_total ?? '0.00'}</td>
                                                                <td className="px-4 py-3 text-sm">{it.net ?? '0.00'}</td>
                                                            </tr>
                                                        ))}
                                                        {(Array.isArray(payrollPreview?.items) ? payrollPreview.items.length : 0) > 50 && (
                                                            <tr>
                                                                <td colSpan="6" className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">Showing first 50 employees in preview.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">Payroll Runs</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest runs (up to 24)</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Period</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employees</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Gross</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tax</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Deductions</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Net</th>
                                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                {filteredPayrollRuns.map((r) => (
                                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{String(r.year).padStart(4, '0')}-{String(r.month).padStart(2, '0')}</td>
                                                        <td className="px-6 py-4 text-sm">{r.employees_count}</td>
                                                        <td className="px-6 py-4 text-sm">{r.total_gross}</td>
                                                        <td className="px-6 py-4 text-sm">{r.total_tax ?? '0.00'}</td>
                                                        <td className="px-6 py-4 text-sm">{r.total_deductions ?? '0.00'}</td>
                                                        <td className="px-6 py-4 text-sm">{r.total_net}</td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRunDetails(r)}
                                                                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadUrl(route('tenant.finance.payroll.runs.print', r.id))}
                                                                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
                                                            >
                                                                Print
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadUrl(route('tenant.finance.payroll.runs.export', r.id))}
                                                                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <FiDownload className="mr-2" /> CSV
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredPayrollRuns.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No payroll runs yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>

                                    {runDetailsOpen && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                            <div className="absolute inset-0 bg-black/50" onClick={() => setRunDetailsOpen(false)} />
                                            <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-lg font-bold">Payroll Run Details</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {runDetails ? `${String(runDetails.year).padStart(4, '0')}-${String(runDetails.month).padStart(2, '0')} • Run #${runDetails.id}` : 'Loading…'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRunDetailsOpen(false)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>

                                                <div className="p-6">
                                                    {runDetailsLoading && (
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">Loading payroll items…</div>
                                                    )}

                                                    {!runDetailsLoading && (
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full">
                                                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                                    <tr>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gross</th>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attendance</th>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deductions</th>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tax</th>
                                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                                                    {runDetailsItems.map((it) => (
                                                                        <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                            <td className="px-4 py-3 text-sm">
                                                                                {it?.employee?.user?.name || `Employee #${it.employee_id}`}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm">{it.gross ?? it.gross_total ?? it.total_gross ?? '-'}</td>
                                                                            <td className="px-4 py-3 text-sm">{it.attendance_deduction ?? '0.00'}</td>
                                                                            <td className="px-4 py-3 text-sm">{it.deduction_total ?? '-'}</td>
                                                                            <td className="px-4 py-3 text-sm">{it.tax_total ?? it.total_tax ?? '0.00'}</td>
                                                                            <td className="px-4 py-3 text-sm">{it.net ?? it.total_net ?? '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                    {!runDetailsLoading && runDetailsItems.length === 0 && (
                                                                        <tr>
                                                                            <td colSpan="6" className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">No payroll items found for this run.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                )}
                                            </div>

                                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                                                {runDetails?.id && String(runDetails?.status) === 'draft' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={loading}
                                                            onClick={() => recalculateRun(runDetails.id)}
                                                            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                                                        >
                                                            Recalculate
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={loading}
                                                            onClick={() => {
                                                                if (window.confirm('Finalize this payroll run? This will lock the run.')) {
                                                                    finalizeRun(runDetails.id);
                                                                }
                                                            }}
                                                            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
                                                        >
                                                            Finalize
                                                        </button>
                                                    </>
                                                )}
                                                {runDetails?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadUrl(route('tenant.finance.payroll.runs.export', runDetails.id))}
                                                        className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <FiDownload className="mr-2" /> Export CSV
                                                    </button>
                                                )}
                                                {runDetails?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadUrl(route('tenant.finance.payroll.runs.print', runDetails.id))}
                                                        className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        Print / PDF
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setRunDetailsOpen(false)}
                                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">Audit Report</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quick summary for compliance and audits.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => downloadUrl(route('tenant.finance.audit.export'))}
                                            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:from-emerald-700 hover:to-emerald-600"
                                        >
                                            <FiDownload className="mr-2" /> Export CSV
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Active employees</div>
                                            <div className="text-2xl font-bold mt-1">{auditReport?.employees_active ?? '-'}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Payroll runs</div>
                                            <div className="text-2xl font-bold mt-1">{auditReport?.payroll_runs ?? '-'}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Adjustments</div>
                                            <div className="text-2xl font-bold mt-1">{auditReport?.adjustments ?? '-'}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Last payroll</div>
                                            <div className="text-2xl font-bold mt-1">{auditReport?.last_payroll ? `${String(auditReport.last_payroll.year).padStart(4, '0')}-${String(auditReport.last_payroll.month).padStart(2, '0')}` : '-'}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Company rates</div>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Tax rate</div>
                                                <div className="text-lg font-semibold">{auditReport?.tax_rate_percent ?? 0}%</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Deduction rate</div>
                                                <div className="text-lg font-semibold">{auditReport?.deduction_rate_percent ?? 0}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tax' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold">Company Tax & Deduction Settings</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">These rates are applied to gross salary for every payroll run (you can still add per-employee adjustments below).</p>

                                    <form onSubmit={saveFinanceSettings} className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Tax rate (%)</label>
                                            <input
                                                value={settingsForm.tax_rate_percent}
                                                onChange={(e) => setSettingsForm((p) => ({ ...p, tax_rate_percent: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Deduction rate (%)</label>
                                            <input
                                                value={settingsForm.deduction_rate_percent}
                                                onChange={(e) => setSettingsForm((p) => ({ ...p, deduction_rate_percent: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button
                                                disabled={loading}
                                                className="w-full md:w-auto inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg shadow-sm hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
                                            >
                                                <FiPlus className="mr-2" /> {loading ? 'Saving...' : 'Save Rates'}
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                        Current: tax {financeSettings?.tax_rate_percent ?? 0}%, deductions {financeSettings?.deduction_rate_percent ?? 0}%
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold">Tax & Deduction Adjustments</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add one-time deductions, taxes, or bonuses for a specific month.</p>

                                    <form onSubmit={submitAdjustment} className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Employee</label>
                                            <select
                                                value={adjustmentForm.employee_id}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, employee_id: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                required
                                            >
                                                <option value="">Select employee...</option>
                                                {(employees || []).map((e) => (
                                                    <option key={e.id} value={e.id}>{e?.user?.name} ({e?.employee_code || `#${e.id}`})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Month</label>
                                            <input
                                                value={adjustmentForm.month}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, month: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="1"
                                                max="12"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Year</label>
                                            <input
                                                value={adjustmentForm.year}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, year: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Type</label>
                                            <select
                                                value={adjustmentForm.type}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, type: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                required
                                            >
                                                <option value="deduction">Deduction</option>
                                                <option value="tax">Tax</option>
                                                <option value="bonus">Bonus</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Amount</label>
                                            <input
                                                value={adjustmentForm.amount}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, amount: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                            <input
                                                value={adjustmentForm.description}
                                                onChange={(e) => setAdjustmentForm((p) => ({ ...p, description: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder={selectedEmployee ? `Adjustment for ${selectedEmployee?.user?.name}` : 'Reason / note'}
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <button
                                                disabled={loading}
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg shadow-sm hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
                                            >
                                                <FiPlus className="mr-2" /> {loading ? 'Saving...' : 'Save Adjustment'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">Recent Adjustments</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest 200 entries</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Period</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                {filteredAdjustments.map((a) => (
                                                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{a?.employee?.user?.name || `Employee #${a.employee_id}`}</td>
                                                        <td className="px-6 py-4 text-sm">{String(a.year).padStart(4, '0')}-{String(a.month).padStart(2, '0')}</td>
                                                        <td className="px-6 py-4 text-sm">{a.type}</td>
                                                        <td className="px-6 py-4 text-sm">{a.amount}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{a.description || '-'}</td>
                                                    </tr>
                                                ))}
                                                {filteredAdjustments.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No adjustments yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
