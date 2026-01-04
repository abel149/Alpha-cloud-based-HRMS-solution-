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
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CompanyAdminController extends Controller
{
    private function ensureAttendancePolicyVisualSchema(): void
    {
        if (!Schema::connection('Tenant')->hasTable('attendance_policies')) {
            return;
        }

        $needsRequires = !Schema::connection('Tenant')->hasColumn('attendance_policies', 'requires_visual_confirmation');
        $needsMessage = !Schema::connection('Tenant')->hasColumn('attendance_policies', 'visual_confirmation_message');

        if (!$needsRequires && !$needsMessage) {
            return;
        }

        try {
            Schema::connection('Tenant')->table('attendance_policies', function (Blueprint $table) use ($needsRequires, $needsMessage) {
                if ($needsRequires) {
                    $table->boolean('requires_visual_confirmation')->default(false);
                }
                if ($needsMessage) {
                    $table->text('visual_confirmation_message')->nullable();
                }
            });
        } catch (\Throwable $e) {
            // Fallback for tenants with unusual schema state
            try {
                if ($needsRequires) {
                    DB::connection('Tenant')->statement('ALTER TABLE attendance_policies ADD COLUMN requires_visual_confirmation TINYINT(1) NOT NULL DEFAULT 0');
                }
            } catch (\Throwable $ignored) {
                // ignore
            }

            try {
                if ($needsMessage) {
                    DB::connection('Tenant')->statement('ALTER TABLE attendance_policies ADD COLUMN visual_confirmation_message TEXT NULL');
                }
            } catch (\Throwable $ignored) {
                // ignore
            }
        }
    }

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
            // email must be unique in both central and tenant users tables
            'email' => 'required|email|unique:users,email|unique:Tenant.users,email',
            'password' => 'required|min:8',
            'role' => 'required|in:hr_manager,finance_manager,department_manager,employee',
            // department belongs to Tenant DB
            'department_id' => 'nullable|exists:Tenant.departments,id',
            'hire_date' => 'required|date',
            'job_title' => 'required|string',
            // employees table is also on Tenant connection
            'employee_code' => 'required|string|unique:Tenant.employees,employee_code',
            'phone' => 'nullable|string',
            'salary' => 'nullable|numeric',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
        ]);

        // Create central user for authentication (uses default connection)
        $centralUser = \App\Models\User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role,
            'tenant_id' => auth()->user()->tenant_id, // same tenant as company admin
        ]);

        // Create tenant-specific user + employee record
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

    public function updateEmployee(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        $user = $employee->user;

        $request->validate([
            'name' => 'required|string|max:255',
            // unique email in both Tenant and central users tables, excluding current user
            'email' => 'required|email|unique:users,email,' . ($user?->email ?? 'NULL') . ',email|unique:Tenant.users,email,' . ($user?->id ?? 'NULL') . ',id',
            'password' => 'nullable|min:8',
            'role' => 'required|in:hr_manager,finance_manager,department_manager,employee',
            'department_id' => 'nullable|exists:Tenant.departments,id',
            'hire_date' => 'required|date',
            'job_title' => 'required|string',
            'employee_code' => 'required|string|unique:Tenant.employees,employee_code,' . $employee->id,
            'phone' => 'nullable|string',
            'salary' => 'nullable|numeric',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
        ]);

        DB::connection('Tenant')->transaction(function () use ($request, $employee, $user) {
            if ($user) {
                $user->setConnection('Tenant');
                $user->name = $request->name;
                $user->email = $request->email;
                if ($request->filled('password')) {
                    $user->password = Hash::make($request->password);
                }
                $user->role = $request->role;
                $user->save();
            }

            $employee->update([
                'department_id' => $request->department_id,
                'hire_date' => $request->hire_date,
                'job_title' => $request->job_title,
                'employee_code' => $request->employee_code,
                'phone' => $request->phone,
                'salary' => $request->salary,
                'employment_type' => $request->employment_type,
            ]);
        });

        return back()->with('success', 'Employee updated successfully');
    }

    public function destroyEmployee($id)
    {
        // First fetch employee & tenant user
        $employee = Employee::with('user')->findOrFail($id);
        $tenantUser = $employee->user;

        // Delete matching central user (if any) based on email
        if ($tenantUser && $tenantUser->email) {
            $centralUser = \App\Models\User::where('email', $tenantUser->email)->first();
            if ($centralUser) {
                $centralUser->delete();
            }
        }

        // Then delete tenant-side records
        DB::connection('Tenant')->transaction(function () use ($employee, $tenantUser) {
            if ($tenantUser) {
                $tenantUser->setConnection('Tenant');
                $tenantUser->delete();
            }

            $employee->delete();
        });

        return back()->with('success', 'Employee deleted successfully');
    }

    public function storeDepartment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            // managers are users in the Tenant DB
            'manager_id' => 'nullable|exists:Tenant.users,id',
        ]);

        Department::create($request->all());
        return back()->with('success', 'Department created successfully');
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department->update($request->only('name', 'description', 'manager_id'));

        return back()->with('success', 'Department updated successfully');
    }

    public function destroyDepartment($id)
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return back()->with('success', 'Department deleted successfully');
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

    public function updateLeavePolicy(Request $request, $id)
    {
        $policy = LeavePolicy::findOrFail($id);

        $request->validate([
            'policy_name' => 'required|string|max:255',
            'leave_type' => 'required|string',
            'days_allowed_per_year' => 'required|integer|min:1',
            'is_paid' => 'boolean',
            'description' => 'nullable|string',
            'max_consecutive_days' => 'nullable|integer',
        ]);

        $policy->update($request->only('policy_name', 'leave_type', 'days_allowed_per_year', 'is_paid', 'description', 'max_consecutive_days'));

        return back()->with('success', 'Leave policy updated successfully');
    }

    public function destroyLeavePolicy($id)
    {
        $policy = LeavePolicy::findOrFail($id);
        $policy->delete();

        return back()->with('success', 'Leave policy deleted successfully');
    }

    public function storeAttendancePolicy(Request $request)
    {
        $this->ensureAttendancePolicyVisualSchema();

        $hasVisualColumns = Schema::connection('Tenant')->hasColumn('attendance_policies', 'requires_visual_confirmation')
            && Schema::connection('Tenant')->hasColumn('attendance_policies', 'visual_confirmation_message');

        $request->validate([
            'policy_name' => 'required|string|max:255',
            'work_start_time' => 'required',
            'work_end_time' => 'required',
            'grace_period_minutes' => 'integer|min:0',
            'minimum_work_hours' => 'integer|min:1',
            'requires_company_wifi' => 'nullable|boolean',
            'company_wifi_allowed_ips' => 'nullable|string',
            'company_wifi_allowed_cidrs' => 'nullable|string',
            'requires_fingerprint' => 'nullable|boolean',
            'requires_visual_confirmation' => 'nullable|boolean',
            'visual_confirmation_message' => 'nullable|string',
        ]);

        // Keep a single active policy to avoid confusion.
        AttendancePolicy::query()->update(['is_active' => false]);

        $payload = $request->only(
            'policy_name',
            'work_start_time',
            'work_end_time',
            'grace_period_minutes',
            'minimum_work_hours',
            'requires_company_wifi',
            'company_wifi_allowed_ips',
            'company_wifi_allowed_cidrs',
            'requires_fingerprint',
            'requires_visual_confirmation',
            'visual_confirmation_message'

        );

        if (!$hasVisualColumns) {
            unset($payload['requires_visual_confirmation'], $payload['visual_confirmation_message']);
        }

        // If visual confirmation is enabled, do not require biometric/passkey.
        if (!empty($payload['requires_visual_confirmation'])) {
            $payload['requires_fingerprint'] = false;
        }

        if (!$hasVisualColumns && $request->boolean('requires_visual_confirmation')) {
            return back()->with('error', 'Tenant database is missing visual confirmation columns. Run: php artisan migrate:tenants');
        }

        // Fingerprint/passkey attendance is not supported in the desired workflow.
        $payload['requires_fingerprint'] = false;

        $payload['is_active'] = true;

        AttendancePolicy::create($payload);
        return back()->with('success', 'Attendance policy created successfully');
    }

    public function updateAttendancePolicy(Request $request, $id)
    {
        $policy = AttendancePolicy::findOrFail($id);

        $this->ensureAttendancePolicyVisualSchema();

        $hasVisualColumns = Schema::connection('Tenant')->hasColumn('attendance_policies', 'requires_visual_confirmation')
            && Schema::connection('Tenant')->hasColumn('attendance_policies', 'visual_confirmation_message');

        $request->validate([
            'policy_name' => 'required|string|max:255',
            'work_start_time' => 'required',
            'work_end_time' => 'required',
            'grace_period_minutes' => 'integer|min:0',
            'minimum_work_hours' => 'integer|min:1',
            'requires_company_wifi' => 'nullable|boolean',
            'company_wifi_allowed_ips' => 'nullable|string',
            'company_wifi_allowed_cidrs' => 'nullable|string',
            'requires_fingerprint' => 'nullable|boolean',
            'requires_visual_confirmation' => 'nullable|boolean',
            'visual_confirmation_message' => 'nullable|string',
        ]);

        // Keep a single active policy to avoid confusion.
        AttendancePolicy::where('id', '!=', $policy->id)->update(['is_active' => false]);

        $payload = $request->only(
            'policy_name',
            'work_start_time',
            'work_end_time',
            'grace_period_minutes',
            'minimum_work_hours',
            'requires_company_wifi',
            'company_wifi_allowed_ips',
            'company_wifi_allowed_cidrs',
            'requires_fingerprint',
            'requires_visual_confirmation',
            'visual_confirmation_message'

        );

        if (!$hasVisualColumns) {
            unset($payload['requires_visual_confirmation'], $payload['visual_confirmation_message']);
        }

        // If visual confirmation is enabled, do not require biometric/passkey.
        if (!empty($payload['requires_visual_confirmation'])) {
            $payload['requires_fingerprint'] = false;
        }

        if (!$hasVisualColumns && $request->boolean('requires_visual_confirmation')) {
            return back()->with('error', 'Tenant database is missing visual confirmation columns. Run: php artisan migrate:tenants');
        }

        // Fingerprint/passkey attendance is not supported in the desired workflow.
        $payload['requires_fingerprint'] = false;

        $payload['is_active'] = true;

        $policy->update($payload);

        return back()->with('success', 'Attendance policy updated successfully');
    }

    public function destroyAttendancePolicy($id)
    {
        $policy = AttendancePolicy::findOrFail($id);
        $policy->delete();

        return back()->with('success', 'Attendance policy deleted successfully');
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

    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'display_name' => 'required|string',
            'description' => 'nullable|string',
            'permissions' => 'array',
        ]);

        $role->update($request->except('permissions'));

        if ($request->has('permissions')) {
            $role->permissions()->sync($request->permissions);
        } else {
            $role->permissions()->sync([]);
        }

        return back()->with('success', 'Role updated successfully');
    }

    public function destroyRole($id)
    {
        $role = Role::findOrFail($id);
        $role->permissions()->detach();
        $role->delete();

        return back()->with('success', 'Role deleted successfully');
    }

    public function detectCompanyWifi(Request $request)
    {
        $ip = (string) $request->ip();

        $suggestedCidr = null;
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            if (count($parts) === 4) {
                $a = (int) $parts[0];
                $b = (int) $parts[1];
                $isPrivate = ($a === 10)
                    || ($a === 192 && $b === 168)
                    || ($a === 172 && $b >= 16 && $b <= 31);

                if ($isPrivate) {
                    $suggestedCidr = sprintf('%d.%d.%d.0/24', $a, $b, (int) $parts[2]);
                }
            }
        }

        return response()->json([
            'ok' => true,
            'ip' => $ip,
            'suggested_cidr' => $suggestedCidr,
        ]);
    }
}
