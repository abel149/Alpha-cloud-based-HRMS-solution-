<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Middleware\SwitchTenantDatabase;
use App\Http\Controllers\TenantController;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureCompanyAdmin;
use App\Http\Middleware\EnsureHrManager;
use App\Http\Middleware\EnsureFinanceManager;
use App\Http\Middleware\EnsureDepartmentManager;
use App\Http\Controllers\CompanyAdminController;
use App\Http\Controllers\TenantHrController;
use App\Http\Controllers\TenantEmployeeController;
use App\Http\Controllers\TenantFinanceController;
use App\Http\Controllers\TenantDepartmentManagerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TenantApplicationController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\SuperAdmin\SuperAdminUserController;
use App\Http\Controllers\BiometricController;
use App\Http\Controllers\FaceVerificationController;
use App\Http\Controllers\VisualConfirmationController;
use App\Models\AttendancePolicy;

// -------------------
// Public Routes
// -------------------
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

// -------------------
// Authenticated User Routes (Central DB)
// -------------------
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// -------------------
// Tenant Routes (role-based dashboards)
// -------------------
Route::middleware(['auth', SwitchTenantDatabase::class])->group(function () {
	Route::get('/tenant-dashboard', function () {
		$user = Auth::user();

		if ($user->role === 'hr_manager') {
			return redirect()->route('tenant.hr.dashboard');
		}

		$users = DB::connection('Tenant')->table('users')->get();
		$tenantDb = DB::connection('Tenant')->getDatabaseName();

		// Choose dashboard component based on tenant user role
		$component = match ($user->role) {
			'finance_manager'    => 'Tenant/FinanceDashboard',
			'department_manager' => 'Tenant/DepartmentManagerDashboard',
			'employee'           => 'Tenant/EmployeeDashboard',
			default              => 'Tenant/TenantDashboard',
		};

		return Inertia::render($component, [
			'user'       => $user,
			'users'      => $users,
			'tenant_db'  => $tenantDb,
		]);
	})->name('tenant.dashboard');

	Route::middleware([EnsureHrManager::class])->prefix('tenant/hr')->name('tenant.hr.')->group(function () {
		Route::get('/', [TenantHrController::class, 'dashboard'])->name('dashboard');
		Route::post('/employees', [TenantHrController::class, 'storeEmployee'])->name('employees.store');
		Route::post('/employees/{id}/offboard', [TenantHrController::class, 'offboardEmployee'])->name('employees.offboard');
		Route::post('/leave-requests/{id}/approve', [TenantHrController::class, 'approveLeaveRequest'])->name('leave.approve');
		Route::post('/leave-requests/{id}/reject', [TenantHrController::class, 'rejectLeaveRequest'])->name('leave.reject');
	});

	Route::prefix('tenant/employee')->name('tenant.employee.')->group(function () {
		Route::get('/leave-requests', [TenantEmployeeController::class, 'listLeaveRequests'])->name('leave.index');
		Route::post('/leave-requests', [TenantEmployeeController::class, 'storeLeaveRequest'])->name('leave.store');
		Route::get('/payslips', [TenantEmployeeController::class, 'listPayslips'])->name('payslips.index');
		Route::get('/payslips/{payrollId}', [TenantEmployeeController::class, 'showPayslip'])->name('payslips.show');
		Route::get('/payslips/{payrollId}/export', [TenantEmployeeController::class, 'exportPayslipCsv'])->name('payslips.export');
		Route::post('/attendance/check-in', [TenantEmployeeController::class, 'checkIn'])->name('attendance.check_in');
		Route::post('/attendance/check-out', [TenantEmployeeController::class, 'checkOut'])->name('attendance.check_out');
		
		// Face enrollment (visual registration)
		Route::get('/face/status', [FaceVerificationController::class, 'status'])->name('face.status');
		Route::post('/face/enroll', [FaceVerificationController::class, 'enroll'])->name('face.enroll');
		
		// Biometric authentication routes
		Route::get('/biometric/registration-options', [BiometricController::class, 'getRegistrationOptions'])->name('biometric.registration_options');
		Route::post('/biometric/register', [BiometricController::class, 'registerFingerprint'])->name('biometric.register');
		Route::get('/biometric/authentication-options', [BiometricController::class, 'getAuthenticationOptions'])->name('biometric.authentication_options');
		Route::post('/biometric/verify', [BiometricController::class, 'verifyFingerprint'])->name('biometric.verify');
		Route::get('/biometric/status', [BiometricController::class, 'checkVerificationStatus'])->name('biometric.status');
		Route::get('/biometric/registration-status', [BiometricController::class, 'getRegistrationStatus'])->name('biometric.registration_status');
		Route::post('/biometric/remove', [BiometricController::class, 'removeFingerprint'])->name('biometric.remove');
		
		// Visual confirmation routes
		Route::post('/visual-confirmation', [VisualConfirmationController::class, 'store'])->name('visual_confirmation.store');
		Route::get('/visual-confirmation/status', [VisualConfirmationController::class, 'status'])->name('visual_confirmation.status');
		Route::delete('/visual-confirmation', [VisualConfirmationController::class, 'clear'])->name('visual_confirmation.clear');
	});

	Route::middleware([EnsureFinanceManager::class])->prefix('tenant/finance')->name('tenant.finance.')->group(function () {
		Route::get('/settings', [TenantFinanceController::class, 'getFinanceSettings'])->name('settings.get');
		Route::post('/settings', [TenantFinanceController::class, 'updateFinanceSettings'])->name('settings.update');
		Route::get('/employees', [TenantFinanceController::class, 'listEmployees'])->name('employees.index');
		Route::post('/payroll/preview', [TenantFinanceController::class, 'previewMonthlyPayroll'])->name('payroll.preview');
		Route::get('/payroll/runs', [TenantFinanceController::class, 'listPayrollRuns'])->name('payroll.runs.index');
		Route::get('/payroll/runs/{id}', [TenantFinanceController::class, 'showPayrollRun'])->name('payroll.runs.show');
		Route::post('/payroll/run', [TenantFinanceController::class, 'runMonthlyPayroll'])->name('payroll.run');
		Route::post('/payroll/runs/{id}/recalculate', [TenantFinanceController::class, 'recalculatePayrollRun'])->name('payroll.runs.recalculate');
		Route::post('/payroll/runs/{id}/finalize', [TenantFinanceController::class, 'finalizePayrollRun'])->name('payroll.runs.finalize');
		Route::get('/payroll/runs/{id}/print', [TenantFinanceController::class, 'printPayrollRun'])->name('payroll.runs.print');
		Route::get('/payroll/runs/{id}/export', [TenantFinanceController::class, 'exportPayrollRunCsv'])->name('payroll.runs.export');
		Route::get('/adjustments', [TenantFinanceController::class, 'listAdjustments'])->name('adjustments.index');
		Route::post('/adjustments', [TenantFinanceController::class, 'storeAdjustment'])->name('adjustments.store');
		Route::get('/audit/report', [TenantFinanceController::class, 'auditReport'])->name('audit.report');
		Route::get('/audit/export', [TenantFinanceController::class, 'exportAuditCsv'])->name('audit.export');
	});

	Route::middleware([EnsureDepartmentManager::class])->prefix('tenant/manager')->name('tenant.manager.')->group(function () {
		Route::get('/attendance/visual-confirmation/{attendanceLogId}', [VisualConfirmationController::class, 'getImage'])->name('attendance.visual_confirmation_image');
		
		Route::get('/team', [TenantDepartmentManagerController::class, 'teamOverview'])->name('team.overview');
		Route::get('/leave-requests', [TenantDepartmentManagerController::class, 'listTeamLeaveRequests'])->name('leave.index');
		Route::post('/leave-requests/{id}/approve', [TenantDepartmentManagerController::class, 'approveLeaveRequest'])->name('leave.approve');
		Route::post('/leave-requests/{id}/reject', [TenantDepartmentManagerController::class, 'rejectLeaveRequest'])->name('leave.reject');
		Route::get('/attendance/summary', [TenantDepartmentManagerController::class, 'attendanceSummary'])->name('attendance.summary');
		Route::get('/reviews', [TenantDepartmentManagerController::class, 'listReviews'])->name('reviews.index');
		Route::post('/reviews', [TenantDepartmentManagerController::class, 'storeReview'])->name('reviews.store');
	});

	Route::get('/tenant/wifi-check', function (Request $request) {
		$policy = AttendancePolicy::where('is_active', true)->orderByDesc('id')->first();
		$requiresCompanyWifi = (bool) optional($policy)->requires_company_wifi;

		// If policy doesn't require company Wi-Fi, then Wi-Fi check passes.
		if (!$requiresCompanyWifi) {
			return response()->json(['ok' => true, 'ip' => $request->ip(), 'policy_required' => false]);
		}

		$allowed = (string) optional($policy)->company_wifi_allowed_ips;
		$allowedCidrs = (string) optional($policy)->company_wifi_allowed_cidrs;
		$allowedIps = array_values(array_filter(array_map('trim', explode(',', $allowed))));
		$cidrs = array_values(array_filter(array_map('trim', explode(',', $allowedCidrs))));
		$ip = $request->ip();

		$ipInCidr = function (string $ip, string $cidr): bool {
			if (strpos($cidr, '/') === false) {
				return false;
			}
			[$subnet, $maskBits] = explode('/', $cidr, 2);
			$maskBits = (int) $maskBits;
			$ipBin = @inet_pton($ip);
			$subnetBin = @inet_pton($subnet);
			if ($ipBin === false || $subnetBin === false) {
				return false;
			}
			if (strlen($ipBin) !== strlen($subnetBin)) {
				return false;
			}

			$bytes = intdiv($maskBits, 8);
			$remainder = $maskBits % 8;

			for ($i = 0; $i < $bytes; $i++) {
				if ($ipBin[$i] !== $subnetBin[$i]) {
					return false;
				}
			}
			if ($remainder === 0) {
				return true;
			}
			$mask = chr((0xFF << (8 - $remainder)) & 0xFF);
			return (($ipBin[$bytes] & $mask) === ($subnetBin[$bytes] & $mask));
		};

		// If policy requires company Wi-Fi but no allowlist configured, deny by default.
		if (count($allowedIps) === 0 && count($cidrs) === 0) {
			return response()->json(['ok' => false, 'ip' => $ip, 'policy_required' => true, 'reason' => 'Company Wi-Fi allowlist not configured']);
		}

		$ok = in_array($ip, $allowedIps, true);
		if (!$ok) {
			foreach ($cidrs as $cidr) {
				if ($ipInCidr($ip, $cidr)) {
					$ok = true;
					break;
				}
			}
		}

		return response()->json(['ok' => $ok, 'ip' => $ip, 'policy_required' => true]);
	})->name('tenant.wifi.check');

	Route::get('/tenant/attendance-policy', function () {
		$policy = AttendancePolicy::where('is_active', true)->orderByDesc('id')->first();
		return response()->json([
			'ok' => true,
			'policy' => [
				'id' => optional($policy)->id,
				'policy_name' => optional($policy)->policy_name,
				'requires_company_wifi' => (bool) optional($policy)->requires_company_wifi,
				'requires_fingerprint' => (bool) optional($policy)->requires_fingerprint,
				'requires_visual_confirmation' => (bool) optional($policy)->requires_visual_confirmation,
				'visual_confirmation_message' => optional($policy)->visual_confirmation_message,
			],
		]);
	})->name('tenant.attendance.policy');
});

// -------------------
// Super Admin Routes
// -------------------
Route::middleware(['auth', EnsureSuperAdmin::class])->group(function () {
    Route::get('/superadmin/tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::get('/superadmin/tenants/create', [TenantController::class, 'create'])->name('tenants.create');
    Route::post('/superadmin/tenants', [TenantController::class, 'store'])->name('tenants.store');
    Route::put('/superadmin/tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
    Route::delete('/superadmin/tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
});

// -------------------
// Company Admin Routes (Tenant-specific)
// -------------------
Route::middleware(['auth', SwitchTenantDatabase::class, EnsureCompanyAdmin::class])->prefix('company-admin')->name('company-admin.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [CompanyAdminController::class, 'index'])->name('dashboard');

    // Employee Management
    Route::post('/employees', [CompanyAdminController::class, 'storeEmployee'])->name('employees.store');
    Route::put('/employees/{id}', [CompanyAdminController::class, 'updateEmployee'])->name('employees.update');
    Route::delete('/employees/{id}', [CompanyAdminController::class, 'destroyEmployee'])->name('employees.destroy');

    // Department Management
    Route::post('/departments', [CompanyAdminController::class, 'storeDepartment'])->name('departments.store');
    Route::put('/departments/{id}', [CompanyAdminController::class, 'updateDepartment'])->name('departments.update');
    Route::delete('/departments/{id}', [CompanyAdminController::class, 'destroyDepartment'])->name('departments.destroy');

    // Leave Policy Management
    Route::post('/leave-policies', [CompanyAdminController::class, 'storeLeavePolicy'])->name('leave-policies.store');
    Route::put('/leave-policies/{id}', [CompanyAdminController::class, 'updateLeavePolicy'])->name('leave-policies.update');
    Route::delete('/leave-policies/{id}', [CompanyAdminController::class, 'destroyLeavePolicy'])->name('leave-policies.destroy');

    // Attendance Policy Management
    Route::post('/attendance-policies', [CompanyAdminController::class, 'storeAttendancePolicy'])->name('attendance-policies.store');
    Route::put('/attendance-policies/{id}', [CompanyAdminController::class, 'updateAttendancePolicy'])->name('attendance-policies.update');
    Route::delete('/attendance-policies/{id}', [CompanyAdminController::class, 'destroyAttendancePolicy'])->name('attendance-policies.destroy');

    Route::get('/attendance-policies/detect-wifi', [CompanyAdminController::class, 'detectCompanyWifi'])->name('attendance-policies.detect-wifi');

    // Role Management (RBAC)
    Route::post('/roles', [CompanyAdminController::class, 'storeRole'])->name('roles.store');
    Route::put('/roles/{id}', [CompanyAdminController::class, 'updateRole'])->name('roles.update');
    Route::delete('/roles/{id}', [CompanyAdminController::class, 'destroyRole'])->name('roles.destroy');
});

// Show the form page (Inertia React)
Route::get('/tenant/apply', function () {
    return inertia('Apply');
})->name('tenant.apply');

// Handle form submission (POST)
Route::post('/tenant/apply', [TenantApplicationController::class, 'apply'])
    ->name('tenant.apply.store');

// Chapa callback
// Safer: allow any HTTP method for callback
Route::any('/chapa/callback', [TenantApplicationController::class, 'chapaCallback'])
    ->name('chapa.callback');


// Inertia success/fail pages
Route::get('/applications/success', fn() => inertia('SuperAdmin/Tenants/PaymentSuccess'))
    ->name('applications.success');

Route::get('/applications/failed', fn() => inertia('SuperAdmin/Tenants/PaymentFailed'))
    ->name('applications.failed');
// -------------------
Route::middleware(['auth'])->prefix('superadmin')->name('subscription-plans.')->group(function () {
    Route::get('/plans', [SubscriptionPlanController::class, 'index'])->name('index');
    Route::get('/plans/create', [SubscriptionPlanController::class, 'create'])->name('create');
    Route::post('/plans', [SubscriptionPlanController::class, 'store'])->name('store');
});
//subscription
Route::post('/subscription-plans', [TenantController::class, 'storeSubscriptionPlan'])
    ->name('subscription-plans.direct.store')
    ->middleware(['auth']); // only accessible to logged-in Super Admin
//create user 
Route::post('/users', [TenantController::class, 'storeuser'])
    ->name('users.store')
    ->middleware(['auth', EnsureSuperAdmin::class]); // only accessible to logged-in Super Admin

// Default Dashboard - Role-based redirect (NO OLD DASHBOARD PAGE)
// -------------------
Route::get('/dashboard', function () {
    $user = Auth::user();

    // Redirect based on user role
    if ($user->role === 'Super_admin') {
        return redirect()->route('tenants.index');
    }

    if ($user->role === 'company_admin' && $user->tenant_id) {
        return redirect()->route('company-admin.dashboard');
    }

    if ($user->tenant_id) {
        return redirect()->route('tenant.dashboard');
    }

    // No dashboard access - redirect to home
    return redirect('/');
})->middleware(['auth', 'verified', SwitchTenantDatabase::class])->name('dashboard');

require __DIR__ . '/auth.php';
