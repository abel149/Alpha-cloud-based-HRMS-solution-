<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use App\Models\LeavePolicy;
use App\Models\AttendancePolicy;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CompanyAdminController extends Controller
{
    public function index()
    {
        try {
            $employees = Employee::with(['user', 'department'])->get();
        } catch (\Exception $e) {
            $employees = collect([]);
        }

        try {
            $departments = Department::with('manager')->get();
        } catch (\Exception $e) {
            $departments = collect([]);
        }

        try {
            $leavePolicies = LeavePolicy::all();
        } catch (\Exception $e) {
            $leavePolicies = collect([]);
        }

        try {
            $attendancePolicies = AttendancePolicy::all();
        } catch (\Exception $e) {
            $attendancePolicies = collect([]);
        }

        try {
            $roles = Role::with('permissions')->get();
        } catch (\Exception $e) {
            $roles = collect([]);
        }

        try {
            $permissions = Permission::all();
        } catch (\Exception $e) {
            $permissions = collect([]);
        }

        $stats = [
            'total_employees' => $employees->count(),
            'active_employees' => $employees->where('status', 'active')->count(),
            'total_departments' => $departments->count(),
            'total_roles' => $roles->count(),
        ];

        return Inertia::render('CompanyAdmin/Dashboard', [
            'employees' => $employees,
            'departments' => $departments,
            'leavePolicies' => $leavePolicies,
            'attendancePolicies' => $attendancePolicies,
            'roles' => $roles,
            'permissions' => $permissions,
            'stats' => $stats,
        ]);
    }

    public function storeEmployee(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => 'required|in:hr_manager,finance_manager,department_manager,employee',
            'department_id' => 'nullable|exists:departments,id',
            'hire_date' => 'required|date',
            'job_title' => 'required|string',
            'employee_code' => 'required|string|unique:employees,employee_code',
            'phone' => 'nullable|string',
            'salary' => 'nullable|numeric',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
        ]);

        DB::connection('Tenant')->transaction(function () use ($request) {
            $user = new User();
            $user->setConnection('Tenant');
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

        return back()->with('success', 'Employee created successfully');
    }

    public function storeDepartment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        Department::create($request->all());
        return back()->with('success', 'Department created successfully');
    }

    public function storeLeavePolicy(Request $request)
    {
        $request->validate([
            'policy_name' => 'required|string|max:255',
            'leave_type' => 'required|string',
            'days_allowed_per_year' => 'required|integer|min:1',
            'is_paid' => 'boolean',
            'description' => 'nullable|string',
            'max_consecutive_days' => 'nullable|integer',
        ]);

        LeavePolicy::create($request->all());
        return back()->with('success', 'Leave policy created successfully');
    }

    public function storeAttendancePolicy(Request $request)
    {
        $request->validate([
            'policy_name' => 'required|string|max:255',
            'work_start_time' => 'required',
            'work_end_time' => 'required',
            'grace_period_minutes' => 'integer|min:0',
            'minimum_work_hours' => 'integer|min:1',
        ]);

        AttendancePolicy::create($request->all());
        return back()->with('success', 'Attendance policy created successfully');
    }

    public function storeRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name',
            'display_name' => 'required|string',
            'description' => 'nullable|string',
            'permissions' => 'array',
        ]);

        $role = Role::create($request->except('permissions'));
        
        if ($request->has('permissions')) {
            $role->permissions()->attach($request->permissions);
        }

        return back()->with('success', 'Role created successfully');
    }
}
