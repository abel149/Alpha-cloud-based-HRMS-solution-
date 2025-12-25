<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TenantHrController extends Controller
{
    public function dashboard()
    {
        $employees = Employee::with(['user', 'department'])->orderByDesc('id')->get();
        $departments = Department::orderBy('name')->get();
        $leaveRequests = LeaveRequest::with(['employee.user', 'approver'])->orderByDesc('id')->get();
        $attendanceLogs = AttendanceLog::with(['employee.user'])->orderByDesc('logged_at')->limit(200)->get();

        return Inertia::render('Tenant/HrDashboard', [
            'employees' => $employees,
            'departments' => $departments,
            'leaveRequests' => $leaveRequests,
            'attendanceLogs' => $attendanceLogs,
        ]);
    }

    public function storeEmployee(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|unique:Tenant.users,email',
            'password' => 'required|min:8',
            'role' => 'required|in:hr_manager,finance_manager,department_manager,employee',
            'department_id' => 'nullable|exists:Tenant.departments,id',
            'hire_date' => 'required|date',
            'job_title' => 'required|string',
            'employee_code' => 'required|string|unique:Tenant.employees,employee_code',
            'phone' => 'nullable|string',
            'salary' => 'nullable|numeric',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
        ]);

        \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'tenant_id' => auth()->user()->tenant_id,
        ]);

        DB::connection('Tenant')->transaction(function () use ($request) {
            $user = new TenantUser();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->role = $request->role;
            $user->save();

            Employee::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'hire_date' => $request->hire_date,
                'job_title' => $request->job_title,
                'employee_code' => $request->employee_code,
                'phone' => $request->phone,
                'salary' => $request->salary,
                'employment_type' => $request->employment_type,
                'status' => 'active',
            ]);
        });

        return back()->with('success', 'Employee hired successfully');
    }

    public function offboardEmployee(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);

        DB::connection('Tenant')->transaction(function () use ($employee) {
            $employee->status = 'terminated';
            $employee->save();
        });

        return back()->with('success', 'Employee offboarded successfully');
    }

    public function approveLeaveRequest(Request $request, $id)
    {
        $leave = LeaveRequest::findOrFail($id);

        $tenantApprover = TenantUser::where('email', auth()->user()->email)->first();

        $leave->status = 'approved';
        $leave->approved_by = $tenantApprover?->id;
        $leave->approved_at = now();
        $leave->rejection_reason = null;
        $leave->save();

        return back()->with('success', 'Leave request approved');
    }

    public function rejectLeaveRequest(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        $tenantApprover = TenantUser::where('email', auth()->user()->email)->first();

        $leave->status = 'rejected';
        $leave->approved_by = $tenantApprover?->id;
        $leave->approved_at = now();
        $leave->rejection_reason = $request->rejection_reason;
        $leave->save();

        return back()->with('success', 'Leave request rejected');
    }
}
