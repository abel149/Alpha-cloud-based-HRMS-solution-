import { Head } from '@inertiajs/inertia-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { FiChevronDown, FiLogOut, FiUser, FiUsers, FiClock, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { FaRegStar, FaStar } from 'react-icons/fa';
import Modal from '@/Components/Modal';
import PaginationControls from '../../Components/PaginationControls';

export default function DepartmentManagerDashboard({ user, tenant_db }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('team');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [warning, setWarning] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [teamPage, setTeamPage] = useState(1);
    const [teamPageSize, setTeamPageSize] = useState(10);
    const [leavePage, setLeavePage] = useState(1);
    const [leavePageSize, setLeavePageSize] = useState(10);
    const [attendancePage, setAttendancePage] = useState(1);
    const [attendancePageSize, setAttendancePageSize] = useState(10);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsPageSize, setReviewsPageSize] = useState(10);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedLeaveId, setSelectedLeaveId] = useState(null);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    const [department, setDepartment] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [attendance, setAttendance] = useState({ summary: [], logs: [] });
    const [reviews, setReviews] = useState([]);

    const [leaveStatusFilter, setLeaveStatusFilter] = useState('pending');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [reviewForm, setReviewForm] = useState({
        employee_id: '',
        period_start: startOfMonth.toISOString().slice(0, 10),
        period_end: now.toISOString().slice(0, 10),
        rating: 3,
        strengths: '',
        improvements: '',
        goals: '',
    });

    const StarRating = ({ value, onChange, disabled = false }) => {
        const [hover, setHover] = useState(null);
        const shown = hover ?? value;

        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                        const active = Number(shown) >= n;
                        const Icon = active ? FaStar : FaRegStar;
                        return (
                            <button
                                key={n}
                                type="button"
                                disabled={disabled}
                                onMouseEnter={() => !disabled && setHover(n)}
                                onMouseLeave={() => !disabled && setHover(null)}
                                onClick={() => !disabled && onChange?.(n)}
                                className={`p-1 rounded ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} ${active ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`}
                                aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Number(value) ? `(${value}/5)` : '(No rating)'}
                </div>
            </div>
        );
    };

    const reviewStats = useMemo(() => {
        const list = Array.isArray(reviews) ? reviews : [];
        const ratings = list.map((r) => Number(r?.rating)).filter((n) => Number.isFinite(n) && n > 0);
        const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

        const nowLocal = new Date();
        const since30 = new Date(nowLocal);
        since30.setDate(since30.getDate() - 30);
        const monthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);

        const count30 = list.filter((r) => {
            const v = r?.submitted_at;
            if (!v) return false;
            const d = new Date(v);
            return !Number.isNaN(d.getTime()) && d >= since30;
        }).length;

        const countMonth = list.filter((r) => {
            const v = r?.submitted_at;
            if (!v) return false;
            const d = new Date(v);
            return !Number.isNaN(d.getTime()) && d >= monthStart;
        }).length;

        return {
            total: list.length,
            avg,
            count30,
            countMonth,
        };
    }, [reviews]);

    const openReviewModal = (review) => {
        setSelectedReview(review);
        setReviewModalOpen(true);
    };

    const renderStars = (value) => {
        const v = Number(value) || 0;
        return (
            <div className="inline-flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                    const Icon = v >= n ? FaStar : FaRegStar;
                    return <Icon key={n} className={`${v >= n ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'} h-4 w-4`} />;
                })}
            </div>
        );
    };

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
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

    const appBasePath = () => {
        const raw = document.querySelector('meta[name="app-base-url"]')?.getAttribute('content');
        if (!raw) return '';
        try {
            const u = new URL(raw, window.location.origin);
            const p = (u.pathname || '/').replace(/\/+$/, '');
            return p === '/' ? '' : p;
        } catch {
            return '';
        }
    };

    const applyBasePath = (path) => {
        const base = appBasePath();
        if (!base) return path;
        if (path === base || path.startsWith(`${base}/`)) return path;
        return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const normalizeSameOriginUrl = (url) => {
        try {
            const u = new URL(url, window.location.href);
            if (u.origin !== window.location.origin) {
                return applyBasePath(`${u.pathname}${u.search}${u.hash}`);
            }
            return applyBasePath(`${u.pathname}${u.search}${u.hash}`);
        } catch {
            return applyBasePath(url);
        }
    };

    const fetchJson = async (url, options = {}) => {
        const method = (options.method || 'GET').toUpperCase();
        const isJsonBody = options.body && typeof options.body === 'string';

        const res = await fetch(normalizeSameOriginUrl(url), {
            ...options,
            method,
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
                ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {}),
                ...(xsrfTokenFromCookie() ? { 'X-XSRF-TOKEN': xsrfTokenFromCookie() } : {}),
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

    const openRejectModal = (id) => {
        setSelectedLeaveId(id);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const submitReject = async (e) => {
        e.preventDefault();
        if (!selectedLeaveId) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await fetchJson(route('tenant.manager.leave.reject', selectedLeaveId), {
                method: 'POST',
                body: JSON.stringify({ rejection_reason: rejectionReason || null }),
            });
            setSuccess('Leave rejected');
            setRejectModalOpen(false);
            setSelectedLeaveId(null);
            setRejectionReason('');
            await loadLeave(leaveStatusFilter || null);
        } catch (e2) {
            setError(e2?.message || 'Failed to reject');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const tabs = [
        { key: 'team', label: 'Team', icon: <FiUsers className="mr-2" /> },
        { key: 'attendance', label: 'Attendance', icon: <FiClock className="mr-2" /> },
        { key: 'reviews', label: 'Reviews', icon: <FiCheck className="mr-2" /> },
    ];

    const pendingCount = useMemo(() => (leaveRequests || []).filter((r) => r?.status === 'pending').length, [leaveRequests]);

    const filteredEmployees = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return employees || [];
        return (employees || []).filter((e) => {
            const name = e?.user?.name || '';
            const email = e?.user?.email || '';
            const title = e?.job_title || '';
            return `${name} ${email} ${title}`.toLowerCase().includes(q);
        });
    }, [employees, searchTerm]);

    const pagedEmployees = useMemo(() => {
        const size = Number(teamPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredEmployees.length || 0) / size));
        const page = Math.min(Math.max(1, Number(teamPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredEmployees.slice(start, start + size);
    }, [filteredEmployees, teamPage, teamPageSize]);

    const filteredLeaveRequests = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return leaveRequests || [];
        return (leaveRequests || []).filter((r) => {
            const name = r?.employee?.user?.name || '';
            const type = r?.leave_type || '';
            const status = r?.status || '';
            return `${name} ${type} ${status} ${r?.start_date || ''} ${r?.end_date || ''}`.toLowerCase().includes(q);
        });
    }, [leaveRequests, searchTerm]);

    const pagedLeaveRequests = useMemo(() => {
        const size = Number(leavePageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredLeaveRequests.length || 0) / size));
        const page = Math.min(Math.max(1, Number(leavePage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredLeaveRequests.slice(start, start + size);
    }, [filteredLeaveRequests, leavePage, leavePageSize]);

    const filteredReviews = useMemo(() => {
        const q = (searchTerm || '').toLowerCase();
        if (!q) return reviews || [];
        return (reviews || []).filter((r) => {
            const name = r?.employee?.user?.name || '';
            const period = `${r?.period_start || ''} ${r?.period_end || ''}`;
            return `${name} ${period} ${r?.rating ?? ''}`.toLowerCase().includes(q);
        });
    }, [reviews, searchTerm]);

    const pagedReviews = useMemo(() => {
        const size = Number(reviewsPageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((filteredReviews.length || 0) / size));
        const page = Math.min(Math.max(1, Number(reviewsPage) || 1), totalPages);
        const start = (page - 1) * size;
        return filteredReviews.slice(start, start + size);
    }, [filteredReviews, reviewsPage, reviewsPageSize]);

    const pagedAttendanceSummary = useMemo(() => {
        const list = Array.isArray(attendance?.summary) ? attendance.summary : [];
        const size = Number(attendancePageSize) || 10;
        const totalPages = Math.max(1, Math.ceil((list.length || 0) / size));
        const page = Math.min(Math.max(1, Number(attendancePage) || 1), totalPages);
        const start = (page - 1) * size;
        return list.slice(start, start + size);
    }, [attendance?.summary, attendancePage, attendancePageSize]);

    const loadTeam = async () => {
        const data = await fetchJson(route('tenant.manager.team.overview'));
        setDepartment(data?.department || null);
        setEmployees(Array.isArray(data?.employees) ? data.employees : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadLeave = async (status = null) => {
        const url = status ? `${route('tenant.manager.leave.index')}?status=${encodeURIComponent(status)}` : route('tenant.manager.leave.index');
        const data = await fetchJson(url);
        setLeaveRequests(Array.isArray(data?.leaveRequests) ? data.leaveRequests : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadAttendance = async () => {
        const data = await fetchJson(`${route('tenant.manager.attendance.summary')}?days=7`);
        setAttendance({
            summary: Array.isArray(data?.summary) ? data.summary : [],
            logs: Array.isArray(data?.logs) ? data.logs : [],
        });
        if (data?.warning) setWarning(String(data.warning));
    };

    const loadReviews = async () => {
        const data = await fetchJson(route('tenant.manager.reviews.index'));
        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
        if (data?.warning) setWarning(String(data.warning));
    };

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError('');
            setWarning('');
            try {
                await loadTeam();
                await loadLeave('pending');
                await loadAttendance();
                await loadReviews();
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Failed to load manager data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, []);

    const approveLeave = async (id) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await fetchJson(route('tenant.manager.leave.approve', id), { method: 'POST', body: JSON.stringify({}) });
            setSuccess('Leave approved');
            await loadLeave(leaveStatusFilter || null);
        } catch (e) {
            setError(e?.message || 'Failed to approve');
        } finally {
            setLoading(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                employee_id: Number(reviewForm.employee_id),
                period_start: reviewForm.period_start,
                period_end: reviewForm.period_end,
                rating: reviewForm.rating ? Number(reviewForm.rating) : null,
                strengths: reviewForm.strengths || null,
                improvements: reviewForm.improvements || null,
                goals: reviewForm.goals || null,
            };
            await fetchJson(route('tenant.manager.reviews.store'), { method: 'POST', body: JSON.stringify(payload) });
            setSuccess('Review submitted');
            setReviewForm((p) => ({ ...p, strengths: '', improvements: '', goals: '' }));
            await loadReviews();
        } catch (e2) {
            setError(e2?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head title="Department Manager" />

            <Modal show={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
                <form onSubmit={submitReject} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Reject Leave Request</h2>
                    <p className="text-sm text-gray-600 mt-1">Add an optional reason for rejection.</p>
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full rounded-lg border-gray-300"
                            rows="4"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setRejectModalOpen(false)}
                            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm disabled:opacity-60"
                        >
                            Reject
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={reviewModalOpen}
                onClose={() => {
                    setReviewModalOpen(false);
                    setSelectedReview(null);
                }}
            >
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Details</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {selectedReview?.employee?.user?.name || `Employee #${selectedReview?.employee_id || '-'}`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setReviewModalOpen(false);
                                setSelectedReview(null);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <FiX />
                        </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Period</div>
                            <div className="font-medium mt-1">
                                {selectedReview?.period_start || '-'} → {selectedReview?.period_end || '-'}
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                            <div className="mt-1 flex items-center gap-2">
                                {renderStars(selectedReview?.rating)}
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedReview?.rating ? `${selectedReview.rating}/5` : '-'}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
                            <div className="font-medium mt-1">
                                {selectedReview?.submitted_at ? new Date(selectedReview.submitted_at).toLocaleString() : '-'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Strengths</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                                {selectedReview?.strengths || '—'}
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Areas to Improve</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                                {selectedReview?.improvements || '—'}
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Goals</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                                {selectedReview?.goals || '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                                Department Manager Portal
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Team oversight and approvals</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-medium shadow-lg">
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
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Workspace</p>
                                <p className="text-2xl font-bold">Manager</p>
                            </div>
                            <FiUsers className="h-10 w-10 text-white/80" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Logged in as</p>
                        <p className="text-lg font-semibold">{user?.name} <span className="text-sm text-gray-500 dark:text-gray-400">({user?.role})</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Tenant DB: {tenant_db}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                        <input
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setTeamPage(1);
                                setLeavePage(1);
                                setAttendancePage(1);
                                setReviewsPage(1);
                            }}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                            placeholder="Search team, leave, reviews..."
                        />
                    </div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            setError('');
                            setSuccess('');
                            setWarning('');
                            try {
                                await loadTeam();
                                await loadLeave(leaveStatusFilter || null);
                                await loadAttendance();
                                await loadReviews();
                                setSuccess('Refreshed');
                            } catch (e) {
                                setError(e?.message || 'Failed to refresh');
                            } finally {
                                setLoading(false);
                            }
                        }}
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
                                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md transform scale-105'
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
                                    <div className="mt-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm">{success}</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold">Team Overview</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Department: <span className="font-medium">{department?.name || 'Not assigned'}</span>
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Team size</div>
                                            <div className="text-2xl font-bold mt-1">{(employees || []).length}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Pending leave</div>
                                            <div className="text-2xl font-bold mt-1">{pendingCount}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Last 7 days logs</div>
                                            <div className="text-2xl font-bold mt-1">{(attendance?.logs || []).length}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">Team Members</h3>
                                    </div>
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <PaginationControls
                                            page={teamPage}
                                            pageSize={teamPageSize}
                                            total={filteredEmployees.length}
                                            onPageChange={(p) => setTeamPage(p)}
                                            onPageSizeChange={(n) => { setTeamPageSize(n); setTeamPage(1); }}
                                        />
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Job Title</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {pagedEmployees.map((e) => (
                                                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{e?.user?.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{e?.user?.email}</td>
                                                        <td className="px-6 py-4 text-sm">{e?.job_title || '-'}</td>
                                                        <td className="px-6 py-4 text-sm">{e?.status || '-'}</td>
                                                    </tr>
                                                ))}
                                                {pagedEmployees.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No team members found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-lg font-semibold">Team Leave Requests</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Approve or reject leave requests for your department.</p>
                                        </div>
                                        <select
                                            value={leaveStatusFilter}
                                            onChange={async (e) => {
                                                const v = e.target.value;
                                                setLeaveStatusFilter(v);
                                                setLeavePage(1);
                                                setLoading(true);
                                                setError('');
                                                try {
                                                    await loadLeave(v || null);
                                                } catch (err) {
                                                    setError(err?.message || 'Failed to load leave requests');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="">All</option>
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Dates</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {pagedLeaveRequests.map((r) => (
                                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{r?.employee?.user?.name}</td>
                                                        <td className="px-6 py-4 text-sm">{r?.leave_type}</td>
                                                        <td className="px-6 py-4 text-sm">{r?.start_date} → {r?.end_date}</td>
                                                        <td className="px-6 py-4 text-sm">{r?.status}</td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            {r?.status === 'pending' ? (
                                                                <div className="inline-flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={loading}
                                                                        onClick={() => approveLeave(r.id)}
                                                                        className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm disabled:opacity-60"
                                                                    >
                                                                        <FiCheck className="mr-2" /> Approve
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={loading}
                                                                        onClick={() => openRejectModal(r.id)}
                                                                        className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                                                                    >
                                                                        <FiX className="mr-2" /> Reject
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 dark:text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {pagedLeaveRequests.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No leave requests found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">Team Attendance Summary</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Activity counts over the last 7 days.</p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={async () => {
                                                setLoading(true);
                                                setError('');
                                                try {
                                                    await loadAttendance();
                                                    setSuccess('Attendance refreshed');
                                                } catch (e) {
                                                    setError(e?.message || 'Failed to refresh');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">By Employee</h3>
                                    </div>
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <PaginationControls
                                            page={attendancePage}
                                            pageSize={attendancePageSize}
                                            total={(attendance?.summary || []).length}
                                            onPageChange={(p) => setAttendancePage(p)}
                                            onPageSizeChange={(n) => { setAttendancePageSize(n); setAttendancePage(1); }}
                                        />
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Check-ins</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Check-outs</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last seen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {pagedAttendanceSummary.map((s) => (
                                                    <tr key={s.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{s.name || `Employee #${s.employee_id}`}</td>
                                                        <td className="px-6 py-4 text-sm">{s.check_ins}</td>
                                                        <td className="px-6 py-4 text-sm">{s.check_outs}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{s.last_seen ? new Date(s.last_seen).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                                {pagedAttendanceSummary.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No attendance logs found for this period.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="text-white/80 text-sm">Total Reviews</div>
                                        <div className="text-3xl font-bold mt-1">{reviewStats.total}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="text-white/80 text-sm">Average Rating</div>
                                        <div className="text-3xl font-bold mt-1">{reviewStats.avg ? reviewStats.avg.toFixed(1) : '0.0'}</div>
                                        <div className="mt-2">{renderStars(Math.round(reviewStats.avg || 0))}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Last 30 Days</div>
                                        <div className="text-3xl font-bold mt-1">{reviewStats.count30}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
                                        <div className="text-3xl font-bold mt-1">{reviewStats.countMonth}</div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold">Submit Performance Review</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a review for an employee in your department.</p>

                                    <form onSubmit={submitReview} className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Employee</label>
                                            <select
                                                value={reviewForm.employee_id}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, employee_id: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                required
                                            >
                                                <option value="">Select employee...</option>
                                                {(employees || []).map((e) => (
                                                    <option key={e.id} value={e.id}>{e?.user?.name} ({e?.employee_code || `#${e.id}`})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Start</label>
                                            <input
                                                type="date"
                                                value={reviewForm.period_start}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, period_start: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">End</label>
                                            <input
                                                type="date"
                                                value={reviewForm.period_end}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, period_end: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Rating</label>
                                            <StarRating
                                                value={Number(reviewForm.rating) || 0}
                                                onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-medium mb-1">Strengths</label>
                                            <textarea
                                                value={reviewForm.strengths}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, strengths: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-medium mb-1">Areas to Improve</label>
                                            <textarea
                                                value={reviewForm.improvements}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, improvements: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-medium mb-1">Goals</label>
                                            <textarea
                                                value={reviewForm.goals}
                                                onChange={(e) => setReviewForm((p) => ({ ...p, goals: e.target.value }))}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <button
                                                disabled={loading}
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg shadow-sm hover:from-purple-700 hover:to-purple-600 disabled:opacity-60"
                                            >
                                                <FiPlus className="mr-2" /> {loading ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">Submitted Reviews</h3>
                                    </div>
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <PaginationControls
                                            page={reviewsPage}
                                            pageSize={reviewsPageSize}
                                            total={filteredReviews.length}
                                            onPageChange={(p) => setReviewsPage(p)}
                                            onPageSizeChange={(n) => { setReviewsPageSize(n); setReviewsPage(1); }}
                                        />
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Period</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rating</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Submitted</th>
                                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {pagedReviews.map((r) => (
                                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-4 text-sm font-medium">{r?.employee?.user?.name || `Employee #${r.employee_id}`}</td>
                                                        <td className="px-6 py-4 text-sm">{r?.period_start} → {r?.period_end}</td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {renderStars(r?.rating)}
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{r?.rating ? `${r.rating}/5` : '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{r?.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => openReviewModal(r)}
                                                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {pagedReviews.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No reviews submitted yet.</td>
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
