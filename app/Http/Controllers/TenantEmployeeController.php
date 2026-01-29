<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendancePolicy;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PayrollItem;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class TenantEmployeeController extends Controller
{
    private ?bool $cachedHasPayrollSchema = null;
    private ?bool $cachedHasPayrollItemsSchema = null;

    private function currentEmployee(): ?Employee
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        if (!$tenantUser) {
            return null;
        }

        return Employee::where('user_id', $tenantUser->id)->first();
    }

    private function tenantHasPayrollSchema(): bool
    {
        if ($this->cachedHasPayrollSchema !== null) {
            return $this->cachedHasPayrollSchema;
        }

        $ok = Schema::connection('Tenant')->hasTable('payrolls')
            && Schema::connection('Tenant')->hasColumn('payrolls', 'month')
            && Schema::connection('Tenant')->hasColumn('payrolls', 'year');

        $this->cachedHasPayrollSchema = $ok;
        return $ok;
    }

    private function tenantHasPayrollItemsSchema(): bool
    {
        if ($this->cachedHasPayrollItemsSchema !== null) {
            return $this->cachedHasPayrollItemsSchema;
        }

        $ok = Schema::connection('Tenant')->hasTable('payroll_items');
        $this->cachedHasPayrollItemsSchema = $ok;
        return $ok;
    }

    public function listLeaveRequests(Request $request)
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => true, 'requests' => []]);
        }

        $requests = LeaveRequest::with(['approver'])
            ->where('employee_id', $employee->id)
            ->orderByDesc('id')
            ->get();

        return response()->json(['ok' => true, 'requests' => $requests]);
    }

    public function storeLeaveRequest(Request $request)
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => false, 'message' => 'Employee record not found'], 422);
        }

        $request->validate([
            'leave_type' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $leave = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['ok' => true, 'leave' => $leave]);
    }

    public function listPayslips(Request $request)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            return response()->json([
                'ok' => true,
                'payslips' => [],
                'warning' => 'Tenant payroll schema not migrated yet.',
            ]);
        }

        $employee = $this->currentEmployee();
        if (!$employee) {
            return response()->json(['ok' => true, 'payslips' => []]);
        }

        $rows = PayrollItem::query()
            ->join('payrolls', 'payrolls.id', '=', 'payroll_items.payroll_id')
            ->where('payroll_items.employee_id', $employee->id)
            ->orderByDesc('payrolls.year')
            ->orderByDesc('payrolls.month')
            ->orderByDesc('payrolls.id')
            ->limit(24)
            ->get([
                'payroll_items.payroll_id',
                'payroll_items.gross',
                'payroll_items.bonus_total',
                'payroll_items.deduction_total',
                'payroll_items.tax_total',
                'payroll_items.adjustments_total',
                'payroll_items.net',
                'payrolls.month as payroll_month',
                'payrolls.year as payroll_year',
                'payrolls.status as payroll_status',
                'payrolls.generated_at as payroll_generated_at',
            ]);

        $payslips = $rows->map(function ($r) {
            $year = (int) ($r->payroll_year ?? 0);
            $month = (int) ($r->payroll_month ?? 0);
            return [
                'payroll_id' => (int) $r->payroll_id,
                'period' => sprintf('%04d-%02d', $year, $month),
                'status' => (string) ($r->payroll_status ?? 'completed'),
                'gross' => (string) ($r->gross ?? '0.00'),
                'bonus' => (string) ($r->bonus_total ?? '0.00'),
                'deductions' => (string) ($r->deduction_total ?? '0.00'),
                'tax' => (string) ($r->tax_total ?? '0.00'),
                'adjustments' => (string) ($r->adjustments_total ?? '0.00'),
                'net' => (string) ($r->net ?? '0.00'),
                'generated_at' => $r->payroll_generated_at,
            ];
        })->values();

        return response()->json(['ok' => true, 'payslips' => $payslips]);
    }

    public function showPayslip(Request $request, $payrollId)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            return response()->json([
                'ok' => false,
                'message' => 'Tenant payroll schema not migrated yet.',
            ], 409);
        }

        $employee = $this->currentEmployee();
        if (!$employee) {
            return response()->json(['ok' => false, 'message' => 'Employee record not found'], 422);
        }

        $pid = (int) $payrollId;

        $row = PayrollItem::query()
            ->join('payrolls', 'payrolls.id', '=', 'payroll_items.payroll_id')
            ->where('payroll_items.employee_id', $employee->id)
            ->where('payroll_items.payroll_id', $pid)
            ->first([
                'payroll_items.payroll_id',
                'payroll_items.gross',
                'payroll_items.bonus_total',
                'payroll_items.deduction_total',
                'payroll_items.tax_total',
                'payroll_items.adjustments_total',
                'payroll_items.net',
                'payrolls.month as payroll_month',
                'payrolls.year as payroll_year',
                'payrolls.status as payroll_status',
                'payrolls.generated_at as payroll_generated_at',
            ]);

        if (!$row) {
            return response()->json(['ok' => false, 'message' => 'Payslip not found'], 404);
        }

        $year = (int) ($row->payroll_year ?? 0);
        $month = (int) ($row->payroll_month ?? 0);

        return response()->json([
            'ok' => true,
            'payslip' => [
                'payroll_id' => (int) $row->payroll_id,
                'period' => sprintf('%04d-%02d', $year, $month),
                'status' => (string) ($row->payroll_status ?? 'completed'),
                'gross' => (string) ($row->gross ?? '0.00'),
                'bonus' => (string) ($row->bonus_total ?? '0.00'),
                'deductions' => (string) ($row->deduction_total ?? '0.00'),
                'tax' => (string) ($row->tax_total ?? '0.00'),
                'adjustments' => (string) ($row->adjustments_total ?? '0.00'),
                'net' => (string) ($row->net ?? '0.00'),
                'generated_at' => $row->payroll_generated_at,
            ],
        ]);
    }

    public function exportPayslipCsv(Request $request, $payrollId)
    {
        if (!$this->tenantHasPayrollSchema() || !$this->tenantHasPayrollItemsSchema()) {
            abort(409, 'Tenant payroll schema not migrated yet.');
        }

        $employee = $this->currentEmployee();
        if (!$employee) {
            abort(422, 'Employee record not found');
        }

        $pid = (int) $payrollId;

        $row = PayrollItem::query()
            ->join('payrolls', 'payrolls.id', '=', 'payroll_items.payroll_id')
            ->where('payroll_items.employee_id', $employee->id)
            ->where('payroll_items.payroll_id', $pid)
            ->first([
                'payroll_items.payroll_id',
                'payroll_items.gross',
                'payroll_items.bonus_total',
                'payroll_items.deduction_total',
                'payroll_items.tax_total',
                'payroll_items.adjustments_total',
                'payroll_items.net',
                'payrolls.month as payroll_month',
                'payrolls.year as payroll_year',
                'payrolls.status as payroll_status',
                'payrolls.generated_at as payroll_generated_at',
            ]);

        if (!$row) {
            abort(404, 'Payslip not found');
        }

        $year = (int) ($row->payroll_year ?? 0);
        $month = (int) ($row->payroll_month ?? 0);
        $period = sprintf('%04d-%02d', $year, $month);

        $filename = sprintf('payslip_%s_employee_%d.csv', $period, (int) $employee->id);

        return response()->streamDownload(function () use ($employee, $row, $period) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Payslip Period', $period]);
            fputcsv($out, ['Employee ID', (string) $employee->id]);
            fputcsv($out, ['Employee Name', (string) optional($employee->user)->name]);
            fputcsv($out, ['Employee Email', (string) optional($employee->user)->email]);
            fputcsv($out, []);

            fputcsv($out, ['Gross', 'Bonus', 'Deductions', 'Tax', 'Adjustments', 'Net']);
            fputcsv($out, [
                (string) ($row->gross ?? 0),
                (string) ($row->bonus_total ?? 0),
                (string) ($row->deduction_total ?? 0),
                (string) ($row->tax_total ?? 0),
                (string) ($row->adjustments_total ?? 0),
                (string) ($row->net ?? 0),
            ]);

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function checkIn(Request $request)
    {
        return $this->logAttendance($request, 'check_in');
    }

    public function checkOut(Request $request)
    {
        return $this->logAttendance($request, 'check_out');
    }

    private function logAttendance(Request $request, string $type)
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => false, 'message' => 'Employee record not found'], 422);
        }

        $policy = AttendancePolicy::where('is_active', true)->orderByDesc('id')->first();
        $requiresCompanyWifi = (bool) optional($policy)->requires_company_wifi;
        $requiresFingerprint = false;

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

        $wifiOk = true;
        if ($requiresCompanyWifi) {
            if (count($allowedIps) === 0 && count($cidrs) === 0) {
                $wifiOk = false;
            } else {
                $wifiOk = in_array($ip, $allowedIps, true);
                if (!$wifiOk) {
                    foreach ($cidrs as $cidr) {
                        if ($ipInCidr($ip, $cidr)) {
                            $wifiOk = true;
                            break;
                        }
                    }
                }
            }
        }

        // Biometric/passkey attendance is disabled in this workflow.
        $fingerOk = true;

        // Check visual confirmation requirement
        $visualOk = false;
        $requiresVisual = (bool) optional($policy)->requires_visual_confirmation;
        if ($requiresVisual) {
            $visualConfirmed = session('visual_confirmed', false);
            $visualConfirmedAt = session('visual_confirmed_at', 0);
            $visualConfirmedEmployeeId = session('visual_confirmed_employee_id');
            
            // Visual confirmation is valid for 5 minutes
            $isValid = $visualConfirmed
                && (now()->timestamp - (int) $visualConfirmedAt) < 300
                && !empty($visualConfirmedEmployeeId)
                && (int) $visualConfirmedEmployeeId === (int) $employee->id;
            
            if ($isValid) {
                $visualOk = true;
            }
        } else {
            // If visual confirmation not required, mark as OK
            $visualOk = true;
        }

        if ($requiresCompanyWifi && !$wifiOk) {
            return response()->json(['ok' => false, 'message' => 'Company Wi-Fi verification failed'], 403);
        }

        if ($requiresFingerprint && !$fingerOk) {
            return response()->json(['ok' => false, 'message' => 'Biometric verification required. Please verify your fingerprint first.'], 403);
        }

        if ($requiresVisual && !$visualOk) {
            return response()->json(['ok' => false, 'message' => 'Visual confirmation required. Please take a photo first.'], 403);
        }

        $payload = [
            'employee_id' => $employee->id,
            'type' => $type,
            'logged_at' => now(),
            'ip_address' => $ip,
            'wifi_verified' => $wifiOk,
            'fingerprint_verified' => $fingerOk,
        ];

        // Some tenants may not have the visual confirmation columns yet.
        if (
            Schema::connection('Tenant')->hasColumn('attendance_logs', 'visual_confirmed_at')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'visual_confirmation_image')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'visual_confirmation_ip')
            && Schema::connection('Tenant')->hasColumn('attendance_logs', 'visual_confirmed_by')
        ) {
            $payload['visual_confirmed_at'] = $requiresVisual ? session('visual_confirmed_at') : null;
            $payload['visual_confirmation_image'] = $requiresVisual ? session('visual_confirmation_image') : null;
            $payload['visual_confirmation_ip'] = $requiresVisual ? session('visual_confirmation_ip') : null;
            $payload['visual_confirmed_by'] = $requiresVisual ? 'self' : null;
        }

        $log = AttendanceLog::create($payload);

        // Prevent re-use of the same visual confirmation for multiple actions/people.
        if ($requiresVisual) {
            session()->forget([
                'visual_confirmed',
                'visual_confirmed_at',
                'visual_confirmation_image',
                'visual_confirmation_ip',
                'visual_confirmed_employee_id',
                'visual_confirmed_distance',
            ]);
        }

        return response()->json(['ok' => true, 'log' => $log]);
    }
}
