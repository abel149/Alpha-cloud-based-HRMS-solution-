<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PerformanceReview;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class TenantDepartmentManagerController extends Controller
{
    private function tenantHasAttendanceSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('attendance_logs');
    }

    private function tenantHasReviewsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('performance_reviews');
    }

    private function currentTenantManager(): ?TenantUser
    {
        return TenantUser::where('email', auth()->user()->email)->first();
    }

    private function managerDepartment(?TenantUser $manager): ?Department
    {
        if (!$manager) {
            return null;
        }

        return Department::where('manager_id', $manager->id)->orderByDesc('id')->first();
    }

    public function teamOverview()
    {
        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        $employees = $department
            ? Employee::with(['user', 'department'])->where('department_id', $department->id)->orderByDesc('id')->get()
            : collect();

        return response()->json([
            'ok' => true,
            'department' => $department,
            'employees' => $employees,
        ]);
    }

    public function listTeamLeaveRequests(Request $request)
    {
        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        if (!$department) {
            return response()->json(['ok' => true, 'leaveRequests' => []]);
        }

        $employeeIds = Employee::where('department_id', $department->id)->pluck('id');

        $q = LeaveRequest::with(['employee.user', 'approver'])
            ->whereIn('employee_id', $employeeIds)
            ->orderByDesc('id');

        if ($request->query('status')) {
            $q->where('status', (string) $request->query('status'));
        }

        $leaveRequests = $q->limit(200)->get();

        return response()->json(['ok' => true, 'leaveRequests' => $leaveRequests]);
    }

    public function approveLeaveRequest(Request $request, $id)
    {
        $leave = LeaveRequest::with(['employee'])->findOrFail($id);

        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        if (!$department || (int) optional($leave->employee)->department_id !== (int) $department->id) {
            abort(403, 'Unauthorized. This leave request is not in your department.');
        }

        $leave->status = 'approved';
        $leave->approved_by = $manager?->id;
        $leave->approved_at = now();
        $leave->rejection_reason = null;
        $leave->save();

        return response()->json(['ok' => true, 'leave' => $leave]);
    }

    public function rejectLeaveRequest(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $leave = LeaveRequest::with(['employee'])->findOrFail($id);

        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        if (!$department || (int) optional($leave->employee)->department_id !== (int) $department->id) {
            abort(403, 'Unauthorized. This leave request is not in your department.');
        }

        $leave->status = 'rejected';
        $leave->approved_by = $manager?->id;
        $leave->approved_at = now();
        $leave->rejection_reason = $request->rejection_reason;
        $leave->save();

        return response()->json(['ok' => true, 'leave' => $leave]);
    }

    public function attendanceSummary(Request $request)
    {
        if (!$this->tenantHasAttendanceSchema()) {
            return response()->json([
                'ok' => true,
                'summary' => [],
                'logs' => [],
                'warning' => 'Tenant attendance schema not migrated yet.',
            ]);
        }

        $days = (int) ($request->query('days') ?? 7);
        if ($days < 1) {
            $days = 7;
        }
        if ($days > 31) {
            $days = 31;
        }

        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        if (!$department) {
            return response()->json(['ok' => true, 'summary' => [], 'logs' => []]);
        }

        $employees = Employee::with(['user'])->where('department_id', $department->id)->get();
        $employeeIds = $employees->pluck('id');

        $since = now()->subDays($days);

        $logs = AttendanceLog::with(['employee.user'])
            ->whereIn('employee_id', $employeeIds)
            ->where('logged_at', '>=', $since)
            ->orderByDesc('logged_at')
            ->limit(500)
            ->get();

        $byEmployee = $logs->groupBy('employee_id');

        $summary = $employees->map(function ($emp) use ($byEmployee) {
            $empLogs = $byEmployee->get($emp->id, collect());
            return [
                'employee_id' => $emp->id,
                'name' => optional($emp->user)->name,
                'email' => optional($emp->user)->email,
                'check_ins' => $empLogs->where('type', 'check_in')->count(),
                'check_outs' => $empLogs->where('type', 'check_out')->count(),
                'last_seen' => optional($empLogs->first())->logged_at,
            ];
        })->values();

        return response()->json([
            'ok' => true,
            'summary' => $summary,
            'logs' => $logs,
        ]);
    }

    public function listReviews()
    {
        if (!$this->tenantHasReviewsSchema()) {
            return response()->json([
                'ok' => true,
                'reviews' => [],
                'warning' => 'Tenant reviews schema not migrated yet.',
            ]);
        }

        $manager = $this->currentTenantManager();

        $reviews = PerformanceReview::with(['employee.user', 'reviewer'])
            ->where('reviewer_id', $manager?->id)
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json(['ok' => true, 'reviews' => $reviews]);
    }

    public function storeReview(Request $request)
    {
        if (!$this->tenantHasReviewsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for performance reviews yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $request->validate([
            'employee_id' => 'required|integer',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'rating' => 'nullable|integer|min:1|max:5',
            'strengths' => 'nullable|string|max:2000',
            'improvements' => 'nullable|string|max:2000',
            'goals' => 'nullable|string|max:2000',
        ]);

        $manager = $this->currentTenantManager();
        $department = $this->managerDepartment($manager);

        if (!$department) {
            abort(403, 'Unauthorized. Department not found for manager.');
        }

        $employee = Employee::findOrFail((int) $request->employee_id);

        if ((int) $employee->department_id !== (int) $department->id) {
            abort(403, 'Unauthorized. Employee is not in your department.');
        }

        $review = PerformanceReview::create([
            'employee_id' => $employee->id,
            'reviewer_id' => $manager?->id,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'rating' => $request->rating,
            'strengths' => $request->strengths,
            'improvements' => $request->improvements,
            'goals' => $request->goals,
            'submitted_at' => now(),
        ]);

        return response()->json(['ok' => true, 'review' => $review]);
    }
}
