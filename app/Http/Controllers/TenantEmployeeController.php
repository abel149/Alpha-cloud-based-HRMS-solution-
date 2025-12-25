<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendancePolicy;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\TenantUser;
use Illuminate\Http\Request;

class TenantEmployeeController extends Controller
{
    public function listLeaveRequests()
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => true, 'requests' => []]);
        }

        $requests = LeaveRequest::where('employee_id', $employee->id)->orderByDesc('id')->get();
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
        $requiresFingerprint = (bool) optional($policy)->requires_fingerprint;

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

        $fingerOk = (bool) $request->boolean('fingerprint_verified');

        if ($requiresCompanyWifi && !$wifiOk) {
            return response()->json(['ok' => false, 'message' => 'Company Wi-Fi verification failed'], 403);
        }

        if ($requiresFingerprint && !$fingerOk) {
            return response()->json(['ok' => false, 'message' => 'Fingerprint verification required'], 403);
        }

        $log = AttendanceLog::create([
            'employee_id' => $employee->id,
            'type' => $type,
            'logged_at' => now(),
            'ip_address' => $ip,
            'wifi_verified' => $wifiOk,
            'fingerprint_verified' => $fingerOk,
        ]);

        return response()->json(['ok' => true, 'log' => $log]);
    }
}
