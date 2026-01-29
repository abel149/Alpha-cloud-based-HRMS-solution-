<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\FinanceSetting;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\PayrollAdjustment;
use App\Models\PayrollItem;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TenantFinanceController extends Controller
{
    private function tenantHasAttendanceLogsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('attendance_logs')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'employee_id')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'type')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'logged_at');
    }

    private function tenantHasLeaveRequestsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('leave_requests')
            && Schema::connection('Tenant')->hasColumn('leave_requests', 'employee_id')
            && Schema::connection('Tenant')->hasColumn('leave_requests', 'leave_type')
            && Schema::connection('Tenant')->hasColumn('leave_requests', 'start_date')
            && Schema::connection('Tenant')->hasColumn('leave_requests', 'end_date')
            && Schema::connection('Tenant')->hasColumn('leave_requests', 'status');
    }

    private function tenantHasLeavePoliciesSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('leave_policies')
            && Schema::connection('Tenant')->hasColumn('leave_policies', 'leave_type')
            && Schema::connection('Tenant')->hasColumn('leave_policies', 'is_paid');
    }

    private function payrollPeriodBounds(int $month, int $year): array
    {
        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth()->endOfDay();
        return [$start, $end];
    }

    private function workingDaysInMonth(Carbon $start, Carbon $end): array
    {
        $days = [];
        $d = $start->copy()->startOfDay();
        while ($d->lte($end)) {
            if (!$d->isWeekend()) {
                $days[] = $d->copy();
            }
            $d->addDay();
        }
        return $days;
    }

    private function getPresentDaysMap(array $employeeIds, Carbon $start, Carbon $end): array
    {
        if (!$this->tenantHasAttendanceLogsSchema() || empty($employeeIds)) {
            return [];
        }

        $rows = DB::connection('Tenant')->table('attendance_logs')
            ->select('employee_id', DB::raw('DATE(logged_at) as d'))
            ->whereIn('employee_id', $employeeIds)
            ->where('type', 'check_in')
            ->whereBetween('logged_at', [$start, $end])
            ->groupBy('employee_id', DB::raw('DATE(logged_at)'))
            ->get();

        $out = [];
        foreach ($rows as $r) {
            $eid = (int) $r->employee_id;
            $day = (string) $r->d;
            $out[$eid][$day] = true;
        }
        return $out;
    }

    private function getLeavePolicyPaidMap(): array
    {
        if (!$this->tenantHasLeavePoliciesSchema()) {
            return [];
        }

        $policies = LeavePolicy::query()->where('is_active', true)->get(['leave_type', 'is_paid']);
        $map = [];
        foreach ($policies as $p) {
            $map[(string) $p->leave_type] = (bool) $p->is_paid;
        }
        return $map;
    }

    private function getApprovedLeaveDaysMap(array $employeeIds, Carbon $start, Carbon $end): array
    {
        if (!$this->tenantHasLeaveRequestsSchema() || empty($employeeIds)) {
            return ['paid' => [], 'unpaid' => []];
        }

        $paidMapByType = $this->getLeavePolicyPaidMap();

        $requests = LeaveRequest::query()
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString())
            ->get(['employee_id', 'leave_type', 'start_date', 'end_date']);

        $paid = [];
        $unpaid = [];

        foreach ($requests as $lr) {
            $eid = (int) $lr->employee_id;
            $type = (string) $lr->leave_type;
            $isPaid = (bool) ($paidMapByType[$type] ?? false);

            $s = Carbon::parse($lr->start_date)->startOfDay();
            $e = Carbon::parse($lr->end_date)->startOfDay();

            if ($s->lt($start)) {
                $s = $start->copy()->startOfDay();
            }
            if ($e->gt($end)) {
                $e = $end->copy()->startOfDay();
            }

            $d = $s->copy();
            while ($d->lte($e)) {
                if (!$d->isWeekend()) {
                    $key = $d->toDateString();
                    if ($isPaid) {
                        $paid[$eid][$key] = true;
                    } else {
                        $unpaid[$eid][$key] = true;
                    }
                }
                $d->addDay();
            }
        }

        return ['paid' => $paid, 'unpaid' => $unpaid];
    }

    private function buildPayrollCalculation(int $month, int $year): array
    {
        $employees = Employee::with(['user'])->where('status', 'active')->get();

        $missingSalary = $employees->filter(function ($e) {
            $salary = (float) ($e->salary ?? 0);
            return $salary <= 0;
        })->values();

        if ($missingSalary->count() > 0) {
            return [
                'ok' => false,
                'status' => 422,
                'payload' => [
                    'ok' => false,
                    'message' => 'Payroll cannot be processed because some active employees have missing/zero salary (gross). Please set their salary first.',
                    'employees' => $missingSalary->map(function ($e) {
                        return [
                            'id' => $e->id,
                            'name' => optional($e->user)->name,
                            'email' => optional($e->user)->email,
                        ];
                    })->values(),
                ],
            ];
        }

        $settings = FinanceSetting::orderByDesc('id')->first();
        $taxRate = (float) ($settings?->tax_rate_percent ?? 0);
        $deductionRate = (float) ($settings?->deduction_rate_percent ?? 0);

        [$start, $end] = $this->payrollPeriodBounds($month, $year);
        $workingDays = $this->workingDaysInMonth($start, $end);
        $workingDaysCount = count($workingDays);
        $workingDayKeys = array_map(fn (Carbon $d) => $d->toDateString(), $workingDays);
        $workingSet = array_fill_keys($workingDayKeys, true);

        $employeeIds = $employees->pluck('id')->values()->all();

        $adjustments = PayrollAdjustment::whereIn('employee_id', $employeeIds)
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->groupBy('employee_id');

        $presentDaysMap = $this->getPresentDaysMap($employeeIds, $start, $end);
        $leaveDaysMap = $this->getApprovedLeaveDaysMap($employeeIds, $start, $end);
        $paidLeaveMap = $leaveDaysMap['paid'] ?? [];
        $unpaidLeaveMap = $leaveDaysMap['unpaid'] ?? [];

        $items = [];
        $totals = [
            'total_gross' => 0.0,
            'total_bonus' => 0.0,
            'total_deductions' => 0.0,
            'total_tax' => 0.0,
            'total_attendance_deductions' => 0.0,
            'total_adjustments' => 0.0,
            'total_net' => 0.0,
        ];

        foreach ($employees as $emp) {
            $gross = (float) ($emp->salary ?? 0);

            $empAdjustments = $adjustments->get($emp->id, collect());
            $bonusAdj = (float) $empAdjustments->where('type', 'bonus')->sum('amount');
            $deductionAdj = (float) $empAdjustments->where('type', 'deduction')->sum('amount');
            $taxAdj = (float) $empAdjustments->where('type', 'tax')->sum('amount');

            $companyDeduction = $gross * ($deductionRate / 100.0);
            $companyTax = $gross * ($taxRate / 100.0);

            $presentSet = $presentDaysMap[(int) $emp->id] ?? [];
            $paidLeaveSet = $paidLeaveMap[(int) $emp->id] ?? [];
            $unpaidLeaveSet = $unpaidLeaveMap[(int) $emp->id] ?? [];

            $presentDays = 0;
            $paidLeaveDays = 0;
            $unpaidLeaveDays = 0;

            foreach ($workingSet as $day => $_) {
                if (!empty($presentSet[$day])) {
                    $presentDays++;
                    continue;
                }
                if (!empty($paidLeaveSet[$day])) {
                    $paidLeaveDays++;
                    continue;
                }
                if (!empty($unpaidLeaveSet[$day])) {
                    $unpaidLeaveDays++;
                    continue;
                }
            }

            $absentDays = max(0, $workingDaysCount - $presentDays - $paidLeaveDays - $unpaidLeaveDays);
            $dailyRate = $workingDaysCount > 0 ? ($gross / $workingDaysCount) : 0.0;
            $attendanceDeduction = $dailyRate * ($absentDays + $unpaidLeaveDays);

            $deductionTotal = $companyDeduction + $deductionAdj + $attendanceDeduction;
            $taxTotal = $companyTax + $taxAdj;

            $adjustmentTotal = $bonusAdj - $deductionTotal - $taxTotal;
            $net = $gross + $adjustmentTotal;

            $items[] = [
                'employee_id' => (int) $emp->id,
                'employee_name' => (string) (optional($emp->user)->name ?? ''),
                'employee_email' => (string) (optional($emp->user)->email ?? ''),
                'gross' => $gross,
                'company_deduction' => $companyDeduction,
                'company_tax' => $companyTax,
                'bonus_total' => $bonusAdj,
                'deduction_total' => $deductionTotal,
                'tax_total' => $taxTotal,
                'attendance_working_days' => $workingDaysCount,
                'attendance_present_days' => $presentDays,
                'attendance_paid_leave_days' => $paidLeaveDays,
                'attendance_unpaid_leave_days' => $unpaidLeaveDays,
                'attendance_absent_days' => $absentDays,
                'attendance_deduction' => $attendanceDeduction,
                'adjustments_total' => $adjustmentTotal,
                'net' => $net,
            ];

            $totals['total_gross'] += $gross;
            $totals['total_bonus'] += $bonusAdj;
            $totals['total_deductions'] += $deductionTotal;
            $totals['total_tax'] += $taxTotal;
            $totals['total_attendance_deductions'] += $attendanceDeduction;
            $totals['total_adjustments'] += $adjustmentTotal;
            $totals['total_net'] += $net;
        }

        return [
            'ok' => true,
            'status' => 200,
            'payload' => [
                'ok' => true,
                'period' => sprintf('%04d-%02d', $year, $month),
                'month' => $month,
                'year' => $year,
                'employees_count' => count($items),
                'settings' => [
                    'tax_rate_percent' => $taxRate,
                    'deduction_rate_percent' => $deductionRate,
                ],
                'totals' => $totals,
                'items' => $items,
            ],
        ];
    }

    private function tenantHasFinanceSettingsSchema(): bool
    {
        return Schema::connection('Tenant')->hasTable('finance_settings');
    }

    public function previewMonthlyPayroll(Request $request)
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

        $calc = $this->buildPayrollCalculation($month, $year);
        return response()->json($calc['payload'], $calc['status']);
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

        $calc = $this->buildPayrollCalculation($month, $year);
        if (!$calc['ok']) {
            return response()->json($calc['payload'], $calc['status']);
        }

        $payload = $calc['payload'];
        $taxRate = (float) ($payload['settings']['tax_rate_percent'] ?? 0);
        $deductionRate = (float) ($payload['settings']['deduction_rate_percent'] ?? 0);
        $totals = $payload['totals'] ?? [];
        $items = $payload['items'] ?? [];

        $payroll = DB::connection('Tenant')->transaction(function () use ($month, $year, $tenantUser, $taxRate, $deductionRate, $totals, $items) {
            $run = Payroll::create([
                'month' => $month,
                'year' => $year,
                'status' => 'draft',
                'generated_by' => $tenantUser?->id,
                'generated_at' => now(),
                'tax_rate_percent' => $taxRate,
                'deduction_rate_percent' => $deductionRate,
                'total_gross' => (float) ($totals['total_gross'] ?? 0),
                'total_bonus' => (float) ($totals['total_bonus'] ?? 0),
                'total_deductions' => (float) ($totals['total_deductions'] ?? 0),
                'total_tax' => (float) ($totals['total_tax'] ?? 0),
                'total_attendance_deductions' => (float) ($totals['total_attendance_deductions'] ?? 0),
                'total_adjustments' => (float) ($totals['total_adjustments'] ?? 0),
                'total_net' => (float) ($totals['total_net'] ?? 0),
                'employees_count' => count($items),
            ]);

            foreach ($items as $it) {
                PayrollItem::create([
                    'payroll_id' => $run->id,
                    'employee_id' => (int) $it['employee_id'],
                    'gross' => (float) ($it['gross'] ?? 0),
                    'company_deduction' => (float) ($it['company_deduction'] ?? 0),
                    'company_tax' => (float) ($it['company_tax'] ?? 0),
                    'bonus_total' => (float) ($it['bonus_total'] ?? 0),
                    'deduction_total' => (float) ($it['deduction_total'] ?? 0),
                    'tax_total' => (float) ($it['tax_total'] ?? 0),
                    'attendance_working_days' => (int) ($it['attendance_working_days'] ?? 0),
                    'attendance_present_days' => (int) ($it['attendance_present_days'] ?? 0),
                    'attendance_paid_leave_days' => (int) ($it['attendance_paid_leave_days'] ?? 0),
                    'attendance_unpaid_leave_days' => (int) ($it['attendance_unpaid_leave_days'] ?? 0),
                    'attendance_absent_days' => (int) ($it['attendance_absent_days'] ?? 0),
                    'attendance_deduction' => (float) ($it['attendance_deduction'] ?? 0),
                    'adjustments_total' => (float) ($it['adjustments_total'] ?? 0),
                    'net' => (float) ($it['net'] ?? 0),
                ]);
            }

            return $run;
        });

        return response()->json(['ok' => true, 'payroll' => $payroll]);
    }

    public function recalculatePayrollRun(Request $request, $id)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema() || !$this->tenantHasAdjustmentsSchema() || !$this->tenantHasFinanceSettingsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant database is not migrated for payroll/finance yet. Run php artisan migrate:tenants.',
            ], 409);
        }

        $run = Payroll::findOrFail((int) $id);
        if ((string) $run->status !== 'draft') {
            return response()->json(['ok' => false, 'message' => 'Only draft payroll runs can be recalculated.'], 409);
        }

        $calc = $this->buildPayrollCalculation((int) $run->month, (int) $run->year);
        if (!$calc['ok']) {
            return response()->json($calc['payload'], $calc['status']);
        }

        $payload = $calc['payload'];
        $taxRate = (float) ($payload['settings']['tax_rate_percent'] ?? 0);
        $deductionRate = (float) ($payload['settings']['deduction_rate_percent'] ?? 0);
        $totals = $payload['totals'] ?? [];
        $items = $payload['items'] ?? [];

        DB::connection('Tenant')->transaction(function () use ($run, $taxRate, $deductionRate, $totals, $items) {
            PayrollItem::where('payroll_id', $run->id)->delete();

            foreach ($items as $it) {
                PayrollItem::create([
                    'payroll_id' => $run->id,
                    'employee_id' => (int) $it['employee_id'],
                    'gross' => (float) ($it['gross'] ?? 0),
                    'company_deduction' => (float) ($it['company_deduction'] ?? 0),
                    'company_tax' => (float) ($it['company_tax'] ?? 0),
                    'bonus_total' => (float) ($it['bonus_total'] ?? 0),
                    'deduction_total' => (float) ($it['deduction_total'] ?? 0),
                    'tax_total' => (float) ($it['tax_total'] ?? 0),
                    'attendance_working_days' => (int) ($it['attendance_working_days'] ?? 0),
                    'attendance_present_days' => (int) ($it['attendance_present_days'] ?? 0),
                    'attendance_paid_leave_days' => (int) ($it['attendance_paid_leave_days'] ?? 0),
                    'attendance_unpaid_leave_days' => (int) ($it['attendance_unpaid_leave_days'] ?? 0),
                    'attendance_absent_days' => (int) ($it['attendance_absent_days'] ?? 0),
                    'attendance_deduction' => (float) ($it['attendance_deduction'] ?? 0),
                    'adjustments_total' => (float) ($it['adjustments_total'] ?? 0),
                    'net' => (float) ($it['net'] ?? 0),
                ]);
            }

            $run->tax_rate_percent = $taxRate;
            $run->deduction_rate_percent = $deductionRate;
            $run->total_gross = (float) ($totals['total_gross'] ?? 0);
            $run->total_bonus = (float) ($totals['total_bonus'] ?? 0);
            $run->total_deductions = (float) ($totals['total_deductions'] ?? 0);
            $run->total_tax = (float) ($totals['total_tax'] ?? 0);
            $run->total_attendance_deductions = (float) ($totals['total_attendance_deductions'] ?? 0);
            $run->total_adjustments = (float) ($totals['total_adjustments'] ?? 0);
            $run->total_net = (float) ($totals['total_net'] ?? 0);
            $run->employees_count = count($items);
            $run->save();
        });

        $fresh = Payroll::with(['generator'])->find($run->id);
        return response()->json(['ok' => true, 'payroll' => $fresh]);
    }

    public function finalizePayrollRun(Request $request, $id)
    {
        if (!$this->tenantHasPayrollSchema()) {
            return response()->json(['ok' => false, 'message' => 'Tenant database is not migrated for payroll yet.'], 409);
        }

        $run = Payroll::findOrFail((int) $id);
        if ((string) $run->status !== 'draft') {
            return response()->json(['ok' => false, 'message' => 'Only draft payroll runs can be finalized.'], 409);
        }

        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();

        $run->status = 'finalized';
        $run->finalized_by = $tenantUser?->id;
        $run->finalized_at = now();
        $run->save();

        return response()->json(['ok' => true, 'payroll' => $run]);
    }

    public function printPayrollRun(Request $request, $id)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            abort(409, 'Tenant database is not migrated for payroll printing yet.');
        }

        $payroll = Payroll::with(['generator'])->findOrFail((int) $id);
        $items = PayrollItem::with(['employee.user'])->where('payroll_id', $payroll->id)->orderBy('employee_id')->get();

        $period = sprintf('%04d-%02d', (int) $payroll->year, (int) $payroll->month);

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Payroll ' . e($period) . '</title>'
            . '<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;font-size:12px;}th{background:#f5f5f5;text-align:left;}h1{font-size:18px;margin:0 0 8px;} .muted{color:#666;font-size:12px;margin:0 0 16px;}</style>'
            . '</head><body>'
            . '<h1>Payroll Summary - ' . e($period) . '</h1>'
            . '<div class="muted">Status: ' . e((string) $payroll->status) . ' • Employees: ' . e((string) $payroll->employees_count) . '</div>'
            . '<table><thead><tr>'
            . '<th>Employee</th><th>Email</th><th>Gross</th><th>Bonus</th><th>Tax</th><th>Deductions</th><th>Attendance Deduction</th><th>Net</th>'
            . '</tr></thead><tbody>';

        foreach ($items as $it) {
            $html .= '<tr>'
                . '<td>' . e(optional(optional($it->employee)->user)->name ?? ('Employee #' . $it->employee_id)) . '</td>'
                . '<td>' . e(optional(optional($it->employee)->user)->email ?? '') . '</td>'
                . '<td>' . e((string) $it->gross) . '</td>'
                . '<td>' . e((string) ($it->bonus_total ?? 0)) . '</td>'
                . '<td>' . e((string) ($it->tax_total ?? 0)) . '</td>'
                . '<td>' . e((string) ($it->deduction_total ?? 0)) . '</td>'
                . '<td>' . e((string) ($it->attendance_deduction ?? 0)) . '</td>'
                . '<td>' . e((string) $it->net) . '</td>'
                . '</tr>';
        }

        $html .= '</tbody></table>'
            . '<p class="muted" style="margin-top:16px;">Tip: use your browser Print → Save as PDF.</p>'
            . '</body></html>';

        return response($html);
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
