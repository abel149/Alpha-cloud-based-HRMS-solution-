<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\AttendancePolicy;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class VisualConfirmationController extends Controller
{
    private function normalizeDescriptor($descriptor): ?array
    {
        if (!is_array($descriptor)) {
            return null;
        }

        $out = [];
        foreach ($descriptor as $v) {
            if (!is_numeric($v)) {
                return null;
            }
            $out[] = (float) $v;
        }

        if (count($out) !== 128) {
            return null;
        }

        return $out;
    }

    private function euclideanDistance(array $a, array $b): ?float
    {
        if (count($a) !== count($b)) {
            return null;
        }

        $sum = 0.0;
        $n = count($a);
        for ($i = 0; $i < $n; $i++) {
            $d = ((float) $a[$i]) - ((float) $b[$i]);
            $sum += $d * $d;
        }

        return sqrt($sum);
    }

    private function computeAverageHashFromBytes(string $imageBytes): ?string
    {
        if (!function_exists('imagecreatefromstring')) {
            return null;
        }

        $img = @imagecreatefromstring($imageBytes);
        if (!$img) {
            return null;
        }

        $w = imagesx($img);
        $h = imagesy($img);
        if ($w <= 0 || $h <= 0) {
            imagedestroy($img);
            return null;
        }

        $thumb = imagecreatetruecolor(8, 8);
        imagecopyresampled($thumb, $img, 0, 0, 0, 0, 8, 8, $w, $h);

        $sum = 0;
        $pixels = [];
        for ($y = 0; $y < 8; $y++) {
            for ($x = 0; $x < 8; $x++) {
                $rgb = imagecolorat($thumb, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $gray = (int) round(($r + $g + $b) / 3);
                $pixels[] = $gray;
                $sum += $gray;
            }
        }

        $avg = (int) round($sum / 64);
        $bits = '';
        foreach ($pixels as $p) {
            $bits .= ($p >= $avg) ? '1' : '0';
        }

        $hex = '';
        for ($i = 0; $i < 64; $i += 4) {
            $chunk = substr($bits, $i, 4);
            $hex .= dechex(bindec($chunk));
        }

        imagedestroy($thumb);
        imagedestroy($img);

        return str_pad($hex, 16, '0', STR_PAD_LEFT);
    }

    private function hammingDistanceHex(string $h1, string $h2): ?int
    {
        if (strlen($h1) !== strlen($h2)) {
            return null;
        }

        $bin1 = '';
        $bin2 = '';
        for ($i = 0; $i < strlen($h1); $i++) {
            $bin1 .= str_pad(decbin(hexdec($h1[$i])), 4, '0', STR_PAD_LEFT);
            $bin2 .= str_pad(decbin(hexdec($h2[$i])), 4, '0', STR_PAD_LEFT);
        }

        $dist = 0;
        for ($i = 0; $i < strlen($bin1); $i++) {
            if ($bin1[$i] !== $bin2[$i]) {
                $dist++;
            }
        }

        return $dist;
    }

    /**
     * Store visual confirmation image for attendance
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|string', // base64 encoded image
            'attendance_type' => 'required|in:check_in,check_out',
            'hash' => ['nullable', 'string', 'regex:/^[0-9a-fA-F]{16}$/'],
            'descriptor' => ['required', 'array'],
            'descriptor.*' => ['numeric'],
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'error' => $validator->errors()->first()], 422);
        }

        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => false, 'error' => 'Employee not found'], 404);
        }

        // Get attendance policy to check if visual confirmation is required
        $policy = AttendancePolicy::where('is_active', true)->first();
        if (!$policy || !$policy->requires_visual_confirmation) {
            return response()->json(['ok' => false, 'error' => 'Visual confirmation not required'], 403);
        }

        try {
            // Process base64 image
            $imageData = $request->input('image');
            $imageData = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
            $imageData = base64_decode($imageData);

            if ($imageData === false) {
                return response()->json(['ok' => false, 'error' => 'Invalid image data'], 422);
            }

            if (empty($employee->face_descriptor)) {
                return response()->json(['ok' => false, 'error' => 'No registered face data found. Please register your photo again.'], 422);
            }

            $candidateDescriptor = $this->normalizeDescriptor($request->input('descriptor'));
            if (empty($candidateDescriptor)) {
                return response()->json(['ok' => false, 'error' => 'No face detected. Please try again with better lighting and keep your face centered.'], 422);
            }

            $storedDescriptor = $this->normalizeDescriptor($employee->face_descriptor);
            if (empty($storedDescriptor)) {
                return response()->json(['ok' => false, 'error' => 'Registered face data is corrupted. Please register your photo again.'], 500);
            }

            $distance = $this->euclideanDistance($storedDescriptor, $candidateDescriptor);
            if ($distance === null) {
                return response()->json(['ok' => false, 'error' => 'Verification failed (descriptor mismatch).'], 500);
            }

            if ($distance > 0.45) {
                return response()->json(['ok' => false, 'error' => 'Face verification failed. Please try again with better lighting and keep your face centered.'], 403);
            }

            // Generate unique filename
            $filename = 'visual_confirmation_' . $employee->id . '_' . now()->format('Y_m_d_H_i_s') . '.jpg';
            $path = 'visual_confirmations/' . $filename;

            // Store image
            Storage::disk('public')->put($path, $imageData);

            // Store in session for attendance verification
            session([
                'visual_confirmed' => true,
                'visual_confirmed_at' => now()->timestamp,
                'visual_confirmation_image' => $path,
                'visual_confirmation_ip' => $request->ip(),
                'visual_confirmed_employee_id' => $employee->id,
                'visual_confirmed_distance' => $distance,
            ]);

            return response()->json([
                'ok' => true,
                'message' => 'Visual confirmation recorded successfully',
                'image_path' => $path,
                'confirmed_at' => now()->toISOString(),
                'distance' => $distance,
            ]);

        } catch (\Exception $e) {
            return response()->json(['ok' => false, 'error' => 'Failed to store visual confirmation'], 500);
        }
    }

    /**
     * Get visual confirmation status
     */
    public function status(Request $request)
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        $employee = $tenantUser
            ? Employee::where('user_id', $tenantUser->id)->first()
            : null;
        if (!$employee) {
            return response()->json(['ok' => false, 'error' => 'Employee not found'], 404);
        }

        $policy = AttendancePolicy::where('is_active', true)->first();
        $requiresVisual = $policy?->requires_visual_confirmation ?? false;
        $visualConfirmed = session('visual_confirmed', false);
        $confirmedAt = session('visual_confirmed_at');
        $confirmedAtCarbon = null;
        if (is_numeric($confirmedAt)) {
            $confirmedAtCarbon = Carbon::createFromTimestamp((int) $confirmedAt);
        } elseif ($confirmedAt instanceof \DateTimeInterface) {
            $confirmedAtCarbon = Carbon::instance($confirmedAt);
        }

        // Clear visual confirmation if it's older than 5 minutes
        if ($visualConfirmed && $confirmedAtCarbon && now()->diffInMinutes($confirmedAtCarbon) > 5) {
            session()->forget(['visual_confirmed', 'visual_confirmed_at', 'visual_confirmation_image', 'visual_confirmation_ip']);
            $visualConfirmed = false;
            $confirmedAt = null;
            $confirmedAtCarbon = null;
        }

        return response()->json([
            'ok' => true,
            'requires_visual_confirmation' => $requiresVisual,
            'visual_confirmed' => $visualConfirmed,
            'visual_confirmed_at' => $confirmedAtCarbon?->toISOString(),
            'visual_confirmation_message' => $policy?->visual_confirmation_message,
        ]);
    }

    /**
     * Clear visual confirmation session
     */
    public function clear(Request $request)
    {
        session()->forget(['visual_confirmed', 'visual_confirmed_at', 'visual_confirmation_image', 'visual_confirmation_ip']);
        
        return response()->json([
            'ok' => true,
            'message' => 'Visual confirmation cleared',
        ]);
    }

    /**
     * Get visual confirmation image for admin viewing
     */
    public function getImage(Request $request, $attendanceLogId)
    {
        $attendanceLog = AttendanceLog::findOrFail($attendanceLogId);
        
        // Authorization check - only admins or the employee themselves can view
        $user = $request->user();
        if (!$user || ($user->employee?->id !== $attendanceLog->employee_id && !$user->is_admin)) {
            return response()->json(['ok' => false, 'error' => 'Unauthorized'], 403);
        }

        if (!$attendanceLog->visual_confirmation_image) {
            return response()->json(['ok' => false, 'error' => 'No visual confirmation image found'], 404);
        }

        $imagePath = $attendanceLog->visual_confirmation_image;
        
        if (!Storage::disk('public')->exists($imagePath)) {
            return response()->json(['ok' => false, 'error' => 'Image file not found'], 404);
        }

        $imageData = Storage::disk('public')->get($imagePath);
        
        return response($imageData)
            ->header('Content-Type', 'image/jpeg')
            ->header('Content-Disposition', 'inline; filename="visual_confirmation.jpg"');
    }
}
