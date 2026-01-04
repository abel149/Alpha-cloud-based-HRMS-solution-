<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\FinanceSetting;
use App\Models\Payroll;
use App\Models\PayrollAdjustment;
use App\Models\PayrollItem;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TenantFinanceController extends Controller
{
    private function tenantHasFinanceSettingsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('finance_settings');
    }

    private function tenantHasPayrollSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('payrolls')
            && Schema::connection('Tenant')->hasColumn('payrolls', 'month')
            && Schema::connection('Tenant')->hasColumn('payrolls', 'year');
    }

    private function tenantHasPayrollItemsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('payroll_items');
    }

    private function tenantHasAdjustmentsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('payroll_adjustments');
    }

    public function getFinanceSettings()
    {
        if (!$this->tenantHasFinanceSettingsSchema()) {
            return response()->json([
                'ok' => true,
                'settings' => [
                    'tax_rate_percent' => 0,
                    'deduction_rate_percent' => 0,
                ],
                'warning' => 'Tenant finance settings schema not migrated yet.',
            ]);
        }

        $settings = FinanceSetting::orderByDesc('id')->first();

        return response()->json([
            'ok' => true,
            'settings' => [
                'tax_rate_percent' => (float) ($settings?->tax_rate_percent ?? 0),
                'deduction_rate_percent' => (float) ($settings?->deduction_rate_percent ?? 0),
            ],
        ]);
    }

    public function updateFinanceSettings(Request $request)
    {
        if (!$this->tenantHasFinanceSettingsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for finance settings yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $request->validate([
            'tax_rate_percent' => 'required|numeric|min:0|max:100',
            'deduction_rate_percent' => 'required|numeric|min:0|max:100',
        ]);

        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $existing = FinanceSetting::orderByDesc('id')->first();

        if ($existing) {
            $existing->tax_rate_percent = (float) $request->tax_rate_percent;
            $existing->deduction_rate_percent = (float) $request->deduction_rate_percent;
            $existing->updated_by = $tenantUser?->id;
            $existing->save();
            $settings = $existing;
        } else {
            $settings = FinanceSetting::create([
                'tax_rate_percent' => (float) $request->tax_rate_percent,
                'deduction_rate_percent' => (float) $request->deduction_rate_percent,
                'created_by' => $tenantUser?->id,
                'updated_by' => $tenantUser?->id,
            ]);
        }

        return response()->json([
            'ok' => true,
            'settings' => [
                'tax_rate_percent' => (float) $settings->tax_rate_percent,
                'deduction_rate_percent' => (float) $settings->deduction_rate_percent,
            ],
        ]);
    }

    public function listEmployees()
    {
        $employees = Employee::with(['user', 'department'])
            ->orderByDesc('id')
            ->get();

        return response()->json(['ok' => true, 'employees' => $employees]);
    }

    public function listPayrollRuns()
    {
        if (!$this->tenantHasPayrollSchema()) {
            $runs = Payroll::with(['generator'])->orderByDesc('id')->limit(24)->get();
            return response()->json([
                'ok' => true,
                'runs' => $runs,
                'warning' => 'Tenant payroll schema not migrated yet.',
            ]);
        }

        $runs = Payroll::with(['generator'])
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderByDesc('id')
            ->limit(24)
            ->get();

        return response()->json(['ok' => true, 'runs' => $runs]);
    }

    public function showPayrollRun($id)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for payroll yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $run = Payroll::with(['generator'])->findOrFail((int) $id);

        $items = PayrollItem::with(['employee.user'])
            ->where('payroll_id', $run->id)
            ->orderBy('employee_id')
            ->get();

        return response()->json([
            'ok' => true,
            'run' => $run,
            'items' => $items,
        ]);
    }

    public function runMonthlyPayroll(Request $request)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema() || !$this->tenantHasAdjustmentsSchema() || !$this->tenantHasFinanceSettingsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for payroll/finance yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $month = (int) $request->month;
        $year = (int) $request->year;

        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();

        $existing = Payroll::where('month', $month)->where('year', $year)->orderByDesc('id')->first();
        if ($existing) {
            return response()->json(['ok' => false, 'message' => 'Payroll already exists for this period', 'payroll_id' => $existing->id], 409);
        }

        $employees = Employee::with(['user'])->where('status', 'active')->get();

        $missingSalary = $employees->filter(function ($e) {
            $salary = (float) ($e->salary ?? 0);
            return $salary <= 0;
        })->values();

        if ($missingSalary->count() > 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Payroll cannot be processed because some active employees have missing/zero salary (gross). Please set their salary first.',
                'employees' => $missingSalary->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'name' => optional($e->user)->name,
                        'email' => optional($e->user)->email,
                    ];
                })->values(),
            ], 422);
        }

        $settings = FinanceSetting::orderByDesc('id')->first();
        $taxRate = (float) ($settings?->tax_rate_percent ?? 0);
        $deductionRate = (float) ($settings?->deduction_rate_percent ?? 0);

        $employeeIds = $employees->pluck('id')->values();
        $adjustments = PayrollAdjustment::whereIn('employee_id', $employeeIds)
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->groupBy('employee_id');

        $payroll = DB::connection('Tenant')->transaction(function () use ($employees, $adjustments, $month, $year, $tenantUser, $taxRate, $deductionRate) {
            $run = Payroll::create([
                'month' => $month,
                'year' => $year,
                'status' => 'completed',
                'generated_by' => $tenantUser?->id,
                'generated_at' => now(),
                'total_gross' => 0,
                'total_bonus' => 0,
                'total_deductions' => 0,
                'total_tax' => 0,
                'total_adjustments' => 0,
                'total_net' => 0,
                'employees_count' => $employees->count(),
            ]);

            $totalGross = 0;
            $totalBonus = 0;
            $totalDeductions = 0;
            $totalTax = 0;
            $totalAdj = 0;
            $totalNet = 0;

            foreach ($employees as $emp) {
                $gross = (float) ($emp->salary ?? 0);

                $empAdjustments = $adjustments->get($emp->id, collect());
                $bonusAdj = (float) $empAdjustments->where('type', 'bonus')->sum('amount');
                $deductionAdj = (float) $empAdjustments->where('type', 'deduction')->sum('amount');
                $taxAdj = (float) $empAdjustments->where('type', 'tax')->sum('amount');

                $companyDeduction = $gross * ($deductionRate / 100.0);
                $companyTax = $gross * ($taxRate / 100.0);

                $deductionTotal = $companyDeduction + $deductionAdj;
                $taxTotal = $companyTax + $taxAdj;

                $adjustmentTotal = $bonusAdj - $deductionTotal - $taxTotal;

                $net = $gross + $adjustmentTotal;

                PayrollItem::create([
                    'payroll_id' => $run->id,
                    'employee_id' => $emp->id,
                    'gross' => $gross,
                    'bonus_total' => $bonusAdj,
                    'deduction_total' => $deductionTotal,
                    'tax_total' => $taxTotal,
                    'adjustments_total' => $adjustmentTotal,
                    'net' => $net,
                ]);

                $totalGross += $gross;
                $totalBonus += $bonusAdj;
                $totalDeductions += $deductionTotal;
                $totalTax += $taxTotal;
                $totalAdj += $adjustmentTotal;
                $totalNet += $net;
            }

            $run->total_gross = $totalGross;
            $run->total_bonus = $totalBonus;
            $run->total_deductions = $totalDeductions;
            $run->total_tax = $totalTax;
            $run->total_adjustments = $totalAdj;
            $run->total_net = $totalNet;
            $run->save();

            return $run;
        });

        return response()->json(['ok' => true, 'payroll' => $payroll]);
    }

    public function exportPayrollRunCsv($id)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            abort(409, 'Tenant database is not migrated for payroll export yet.');
        }

        $payroll = Payroll::findOrFail($id);
        $items = PayrollItem::with(['employee.user'])
            ->where('payroll_id', $payroll->id)
            ->orderBy('employee_id')
            ->get();

        $filename = sprintf('payroll_%04d_%02d_%d.csv', (int) $payroll->year, (int) $payroll->month, (int) $payroll->id);

        return response()->streamDownload(function () use ($payroll, $items) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Payroll Period', sprintf('%04d-%02d', (int) $payroll->year, (int) $payroll->month)]);
            fputcsv($out, []);
            fputcsv($out, ['Employee ID', 'Employee Name', 'Employee Email', 'Gross', 'Bonus', 'Deductions', 'Tax', 'Adjustments', 'Net']);

            foreach ($items as $item) {
                fputcsv($out, [
                    $item->employee_id,
                    optional(optional($item->employee)->user)->name,
                    optional(optional($item->employee)->user)->email,
                    (string) $item->gross,
                    (string) ($item->bonus_total ?? 0),
                    (string) ($item->deduction_total ?? 0),
                    (string) ($item->tax_total ?? 0),
                    (string) $item->adjustments_total,
                    (string) $item->net,
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function listAdjustments(Request $request)
    {
        if (!$this->tenantHasAdjustmentsSchema()) {
            return response()->json([
                'ok' => true,
                'adjustments' => [],
                'warning' => 'Tenant adjustments schema not migrated yet.',
            ]);
        }

        $month = $request->query('month');
        $year = $request->query('year');

        $q = PayrollAdjustment::with(['employee.user', 'creator'])->orderByDesc('id');

        if ($month !== null) {
            $q->where('month', (int) $month);
        }
        if ($year !== null) {
            $q->where('year', (int) $year);
        }

        $adjustments = $q->limit(200)->get();

        return response()->json(['ok' => true, 'adjustments' => $adjustments]);
    }

    public function storeAdjustment(Request $request)
    {
        if (!$this->tenantHasAdjustmentsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for adjustments yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $request->validate([
            'employee_id' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'type' => 'required|in:deduction,tax,bonus',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
        ]);

        $employee = Employee::findOrFail((int) $request->employee_id);
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();

        $adj = PayrollAdjustment::create([
            'employee_id' => $employee->id,
            'month' => (int) $request->month,
            'year' => (int) $request->year,
            'type' => (string) $request->type,
            'amount' => (float) $request->amount,
            'description' => $request->description,
            'created_by' => $tenantUser?->id,
        ]);

        return response()->json(['ok' => true, 'adjustment' => $adj]);
    }

    public function auditReport(Request $request)
    {
        $runsCount = Payroll::count();
        $lastRun = $this->tenantHasPayrollSchema()
            ? Payroll::orderByDesc('year')->orderByDesc('month')->orderByDesc('id')->first()
            : Payroll::orderByDesc('id')->first();

        $adjustmentsCount = $this->tenantHasAdjustmentsSchema() ? PayrollAdjustment::count() : 0;
        $employeesCount = Employee::where('status', 'active')->count();

        $settings = $this->tenantHasFinanceSettingsSchema() ? FinanceSetting::orderByDesc('id')->first() : null;

        return response()->json([
            'ok' => true,
            'report' => [
                'employees_active' => $employeesCount,
                'payroll_runs' => $runsCount,
                'last_payroll' => $lastRun,
                'adjustments' => $adjustmentsCount,
                'tax_rate_percent' => (float) ($settings?->tax_rate_percent ?? 0),
                'deduction_rate_percent' => (float) ($settings?->deduction_rate_percent ?? 0),
            ],
        ]);
    }

    public function exportAuditCsv(Request $request)
    {
        $runs = $this->tenantHasPayrollSchema()
            ? Payroll::orderByDesc('year')->orderByDesc('month')->orderByDesc('id')->limit(120)->get()
            : Payroll::orderByDesc('id')->limit(120)->get();

        $filename = 'audit_report.csv';

        return response()->streamDownload(function () use ($runs) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Payroll ID', 'Period', 'Status', 'Employees', 'Total Gross', 'Total Bonus', 'Total Deductions', 'Total Tax', 'Total Adjustments', 'Total Net', 'Generated At']);

            foreach ($runs as $run) {
                fputcsv($out, [
                    $run->id,
                    sprintf('%04d-%02d', (int) $run->year, (int) $run->month),
                    $run->status,
                    (string) $run->employees_count,
                    (string) $run->total_gross,
                    (string) ($run->total_bonus ?? 0),
                    (string) ($run->total_deductions ?? 0),
                    (string) ($run->total_tax ?? 0),
                    (string) $run->total_adjustments,
                    (string) $run->total_net,
                    optional($run->generated_at)->toDateTimeString(),
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
