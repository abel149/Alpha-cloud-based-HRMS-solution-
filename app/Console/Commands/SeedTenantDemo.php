<?php

namespace App\Console\Commands;

use App\Models\AttendanceLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\FinanceSetting;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SeedTenantDemo extends Command
{
    protected $signature = 'tenant:seed-demo
        {tenantId=1 : Central tenant_id to seed}
        {--employees=10 : Number of employee accounts to create}
        {--month= : Month (1-12) to generate attendance/payroll for (defaults to current month)}
        {--year= : Year to generate attendance/payroll for (defaults to current year)}
        {--no-payroll : Do not create a payroll run}
        {--reset-attendance : Delete existing attendance logs for seeded employees in the selected month before re-seeding}
    ';

    protected $description = 'Seed demo users/employees, full weekday attendance logs, and a payroll run for a given tenant.';

    public function handle(): int
    {
        $tenantId = (int) $this->argument('tenantId');
        $employeeCount = max(1, (int) $this->option('employees'));

        $month = (int) ($this->option('month') ?: now()->month);
        $year = (int) ($this->option('year') ?: now()->year);

        if ($month < 1 || $month > 12) {
            $this->error('Invalid --month. Expected 1-12.');
            return self::FAILURE;
        }

        if ($year < 2000 || $year > 2100) {
            $this->error('Invalid --year. Expected 2000-2100.');
            return self::FAILURE;
        }

        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            $this->error("Tenant not found (tenant_id={$tenantId}).");
            return self::FAILURE;
        }

        if (empty($tenant->database)) {
            $this->error("Tenant database name is missing for tenant_id={$tenantId}.");
            return self::FAILURE;
        }

        $this->switchTenantConnection((string) $tenant->database);

        if (!Schema::connection('Tenant')->hasTable('users') || !Schema::connection('Tenant')->hasTable('employees')) {
            $this->error('Tenant tables are not migrated (users/employees missing). Run: php artisan migrate:tenants');
            return self::FAILURE;
        }

        $this->info("Seeding demo data for tenant_id={$tenantId} (db={$tenant->database})...");

        $accounts = $this->seedCoreAccounts($tenantId);
        $dept = $this->seedDepartment($accounts['department_manager']['tenant_user']);
        $employees = $this->seedEmployees($tenantId, $dept, $employeeCount);

        if (Schema::connection('Tenant')->hasTable('attendance_logs')) {
            $this->seedAttendance($employees, $month, $year, (bool) $this->option('reset-attendance'));
        } else {
            $this->warn('attendance_logs table not found in tenant DB. Skipping attendance seeding.');
        }

        if (!$this->option('no-payroll')) {
            $this->seedFinanceSettings($accounts['finance_manager']['tenant_user']);
            $this->seedPayrollRun($accounts['finance_manager']['tenant_user'], $employees, $month, $year);
        }

        $this->info('✅ Tenant demo seeding complete.');
        $this->line('Demo logins:');
        $this->line('- HR: hr@demo.test / password');
        $this->line('- Finance: finance@demo.test / password');
        $this->line('- Manager: manager@demo.test / password');
        $this->line('- Employees: emp1@demo.test .. empN@demo.test / password');

        return self::SUCCESS;
    }

    private function switchTenantConnection(string $databaseName): void
    {
        Config::set('database.connections.Tenant.database', $databaseName);
        DB::purge('Tenant');
        DB::reconnect('Tenant');
    }

    private function seedCoreAccounts(int $tenantId): array
    {
        $hr = $this->ensureAccount($tenantId, 'hr@demo.test', 'HR Demo', 'hr_manager');
        $finance = $this->ensureAccount($tenantId, 'finance@demo.test', 'Finance Demo', 'finance_manager');
        $manager = $this->ensureAccount($tenantId, 'manager@demo.test', 'Manager Demo', 'department_manager');

        return [
            'hr_manager' => $hr,
            'finance_manager' => $finance,
            'department_manager' => $manager,
        ];
    }

    private function ensureAccount(int $tenantId, string $email, string $name, string $role): array
    {
        $central = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'tenant_id' => $tenantId,
                'name' => $name,
                'password' => Hash::make('password'),
                'role' => $role,
                'email_verified_at' => now(),
            ]
        );

        if ((int) $central->tenant_id !== $tenantId || (string) $central->role !== $role) {
            $central->tenant_id = $tenantId;
            $central->role = $role;
            if (empty($central->name)) {
                $central->name = $name;
            }
            $central->save();
        }

        $tenantUser = TenantUser::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'role' => $role,
                'email_verified_at' => now(),
            ]
        );

        if ((string) $tenantUser->role !== $role) {
            $tenantUser->role = $role;
            $tenantUser->save();
        }

        return ['central_user' => $central, 'tenant_user' => $tenantUser];
    }

    private function seedDepartment(TenantUser $managerUser): Department
    {
        if (!Schema::connection('Tenant')->hasTable('departments')) {
            $this->warn('departments table not found in tenant DB. Employees will be created without departments.');
            return new Department();
        }

        $dept = Department::query()->where('name', 'Demo Department')->orderByDesc('id')->first();
        if (!$dept) {
            $dept = Department::create([
                'name' => 'Demo Department',
                'description' => 'Demo department for seeded data',
                'manager_id' => $managerUser->id,
                'is_active' => true,
            ]);
        } else {
            if ((int) $dept->manager_id !== (int) $managerUser->id) {
                $dept->manager_id = $managerUser->id;
                $dept->save();
            }
        }

        return $dept;
    }

    private function seedEmployees(int $tenantId, Department $dept, int $employeeCount): array
    {
        $out = [];

        for ($i = 1; $i <= $employeeCount; $i++) {
            $email = "emp{$i}@demo.test";
            $name = "Employee {$i}";

            $central = User::query()->firstOrCreate(
                ['email' => $email],
                [
                    'tenant_id' => $tenantId,
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'role' => 'employee',
                    'email_verified_at' => now(),
                ]
            );

            if ((int) $central->tenant_id !== $tenantId || (string) $central->role !== 'employee') {
                $central->tenant_id = $tenantId;
                $central->role = 'employee';
                if (empty($central->name)) {
                    $central->name = $name;
                }
                $central->save();
            }

            $tenantUser = TenantUser::query()->firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'role' => 'employee',
                    'email_verified_at' => now(),
                ]
            );

            if ((string) $tenantUser->role !== 'employee') {
                $tenantUser->role = 'employee';
                $tenantUser->save();
            }

            $salary = 2500 + ($i * 150);
            $employeeCode = sprintf('EMP%03d', $i);

            $existingEmp = Employee::query()->where('user_id', $tenantUser->id)->orderByDesc('id')->first();

            if ($existingEmp) {
                if (!empty($dept->id) && (int) $existingEmp->department_id !== (int) $dept->id) {
                    $existingEmp->department_id = $dept->id;
                }
                if ((string) $existingEmp->status !== 'active') {
                    $existingEmp->status = 'active';
                }
                if ((float) ($existingEmp->salary ?? 0) <= 0) {
                    $existingEmp->salary = $salary;
                }
                if (empty($existingEmp->employee_code)) {
                    $existingEmp->employee_code = $employeeCode;
                }
                if (empty($existingEmp->job_title)) {
                    $existingEmp->job_title = 'Staff';
                }
                if (empty($existingEmp->hire_date)) {
                    $existingEmp->hire_date = now()->subMonths(6)->toDateString();
                }
                $existingEmp->save();
                $out[] = $existingEmp;
                continue;
            }

            $emp = Employee::create([
                'user_id' => $tenantUser->id,
                'department_id' => !empty($dept->id) ? $dept->id : null,
                'hire_date' => now()->subMonths(6)->toDateString(),
                'job_title' => 'Staff',
                'employee_code' => $employeeCode,
                'phone' => null,
                'salary' => $salary,
                'employment_type' => 'full_time',
                'status' => 'active',
            ]);

            $out[] = $emp;
        }

        return $out;
    }

    private function seedAttendance(array $employees, int $month, int $year, bool $reset): void
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth()->startOfDay();

        $this->info(sprintf('Seeding attendance logs for %04d-%02d (weekdays only)...', $year, $month));

        if ($reset) {
            $ids = collect($employees)->pluck('id')->values()->all();
            if (!empty($ids)) {
                AttendanceLog::query()
                    ->whereIn('employee_id', $ids)
                    ->whereBetween('logged_at', [$start->copy()->startOfMonth(), $start->copy()->endOfMonth()->endOfDay()])
                    ->delete();
                $this->warn('Existing attendance logs for seeded employees were deleted for the selected month.');
            }
        }

        $days = [];
        $d = $start->copy();
        while ($d->lte($end)) {
            if (!$d->isWeekend()) {
                $days[] = $d->copy();
            }
            $d->addDay();
        }

        $created = 0;
        foreach ($employees as $emp) {
            foreach ($days as $day) {
                $date = $day->toDateString();

                $checkInAt = $day->copy()->setTime(9, 0, 0);
                $checkOutAt = $day->copy()->setTime(17, 0, 0);

                $hasIn = AttendanceLog::query()
                    ->where('employee_id', $emp->id)
                    ->where('type', 'check_in')
                    ->whereDate('logged_at', $date)
                    ->exists();

                if (!$hasIn) {
                    AttendanceLog::create([
                        'employee_id' => $emp->id,
                        'type' => 'check_in',
                        'logged_at' => $checkInAt,
                        'ip_address' => null,
                        'wifi_verified' => true,
                        'fingerprint_verified' => false,
                    ]);
                    $created++;
                }

                $hasOut = AttendanceLog::query()
                    ->where('employee_id', $emp->id)
                    ->where('type', 'check_out')
                    ->whereDate('logged_at', $date)
                    ->exists();

                if (!$hasOut) {
                    AttendanceLog::create([
                        'employee_id' => $emp->id,
                        'type' => 'check_out',
                        'logged_at' => $checkOutAt,
                        'ip_address' => null,
                        'wifi_verified' => true,
                        'fingerprint_verified' => false,
                    ]);
                    $created++;
                }
            }
        }

        $this->info("Attendance logs created: {$created}");
    }

    private function seedFinanceSettings(TenantUser $financeUser): void
    {
        if (!Schema::connection('Tenant')->hasTable('finance_settings')) {
            $this->warn('finance_settings table not found in tenant DB. Skipping finance settings seeding.');
            return;
        }

        $existing = FinanceSetting::query()->orderByDesc('id')->first();
        if ($existing) {
            return;
        }

        FinanceSetting::create([
            'tax_rate_percent' => 5,
            'deduction_rate_percent' => 2,
            'created_by' => $financeUser->id,
            'updated_by' => $financeUser->id,
        ]);
    }

    private function seedPayrollRun(TenantUser $financeUser, array $employees, int $month, int $year): void
    {
        if (!Schema::connection('Tenant')->hasTable('payrolls') || !Schema::connection('Tenant')->hasTable('payroll_items')) {
            $this->warn('payrolls/payroll_items tables not found in tenant DB. Skipping payroll seeding.');
            return;
        }

        $existing = Payroll::query()->where('month', $month)->where('year', $year)->orderByDesc('id')->first();
        if ($existing) {
            $this->info(sprintf('Payroll already exists for %04d-%02d (payroll_id=%d). Skipping.', $year, $month, $existing->id));
            return;
        }

        $settings = Schema::connection('Tenant')->hasTable('finance_settings')
            ? FinanceSetting::query()->orderByDesc('id')->first()
            : null;

        $taxRate = (float) ($settings?->tax_rate_percent ?? 0);
        $deductionRate = (float) ($settings?->deduction_rate_percent ?? 0);

        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth()->startOfDay();

        $workingDays = 0;
        $d = $start->copy();
        while ($d->lte($end)) {
            if (!$d->isWeekend()) {
                $workingDays++;
            }
            $d->addDay();
        }

        $totals = [
            'gross' => 0.0,
            'bonus' => 0.0,
            'deductions' => 0.0,
            'tax' => 0.0,
            'attendance_deductions' => 0.0,
            'adjustments' => 0.0,
            'net' => 0.0,
        ];

        DB::connection('Tenant')->transaction(function () use ($financeUser, $employees, $month, $year, $taxRate, $deductionRate, $workingDays, &$totals) {
            $run = Payroll::create([
                'month' => $month,
                'year' => $year,
                'status' => 'draft',
                'generated_by' => $financeUser->id,
                'generated_at' => now(),
                'tax_rate_percent' => $taxRate,
                'deduction_rate_percent' => $deductionRate,
                'employees_count' => count($employees),
            ]);

            foreach ($employees as $emp) {
                $gross = (float) ($emp->salary ?? 0);
                if ($gross <= 0) {
                    $gross = 2500;
                }

                $companyDeduction = $gross * ($deductionRate / 100.0);
                $companyTax = $gross * ($taxRate / 100.0);

                $bonusTotal = 0.0;
                $attendanceDeduction = 0.0;
                $deductionTotal = $companyDeduction + $attendanceDeduction;
                $taxTotal = $companyTax;

                $adjustmentsTotal = $bonusTotal - $deductionTotal - $taxTotal;
                $net = $gross + $adjustmentsTotal;

                $payload = [
                    'payroll_id' => $run->id,
                    'employee_id' => (int) $emp->id,
                    'gross' => $gross,
                    'bonus_total' => $bonusTotal,
                    'deduction_total' => $deductionTotal,
                    'tax_total' => $taxTotal,
                    'adjustments_total' => $adjustmentsTotal,
                    'net' => $net,
                    'company_deduction' => $companyDeduction,
                    'company_tax' => $companyTax,
                    'attendance_working_days' => $workingDays,
                    'attendance_present_days' => $workingDays,
                    'attendance_paid_leave_days' => 0,
                    'attendance_unpaid_leave_days' => 0,
                    'attendance_absent_days' => 0,
                    'attendance_deduction' => $attendanceDeduction,
                ];

                $safe = [];
                foreach ($payload as $k => $v) {
                    if ($k === 'payroll_id' || $k === 'employee_id') {
                        $safe[$k] = $v;
                        continue;
                    }
                    if (Schema::connection('Tenant')->hasColumn('payroll_items', $k)) {
                        $safe[$k] = $v;
                    }
                }

                PayrollItem::create($safe);

                $totals['gross'] += $gross;
                $totals['bonus'] += $bonusTotal;
                $totals['deductions'] += $deductionTotal;
                $totals['tax'] += $taxTotal;
                $totals['attendance_deductions'] += $attendanceDeduction;
                $totals['adjustments'] += $adjustmentsTotal;
                $totals['net'] += $net;
            }

            $update = [
                'total_gross' => $totals['gross'],
                'total_bonus' => $totals['bonus'],
                'total_deductions' => $totals['deductions'],
                'total_tax' => $totals['tax'],
                'total_attendance_deductions' => $totals['attendance_deductions'],
                'total_adjustments' => $totals['adjustments'],
                'total_net' => $totals['net'],
            ];

            $safeUpdate = [];
            foreach ($update as $k => $v) {
                if (Schema::connection('Tenant')->hasColumn('payrolls', $k)) {
                    $safeUpdate[$k] = $v;
                }
            }

            if (!empty($safeUpdate)) {
                $run->fill($safeUpdate);
                $run->save();
            }
        });

        $this->info(sprintf('Payroll created for %04d-%02d (draft).', $year, $month));
    }
}
