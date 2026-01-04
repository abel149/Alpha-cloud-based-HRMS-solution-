<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\TenantUser;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class FaceVerificationController extends Controller
{
    private function ensureFaceEnrollmentSchema(): bool
    {
        if (!Schema::connection('Tenant')->hasTable('employees')) {
            return false;
        }

        $missingImage = !Schema::connection('Tenant')->hasColumn('employees', 'face_enrollment_image');
        $missingHash = !Schema::connection('Tenant')->hasColumn('employees', 'face_enrollment_hash');
        $missingDescriptor = !Schema::connection('Tenant')->hasColumn('employees', 'face_descriptor');
        $missingAt = !Schema::connection('Tenant')->hasColumn('employees', 'face_enrolled_at');

        if (!$missingImage && !$missingHash && !$missingDescriptor && !$missingAt) {
            return true;
        }

        try {
            Schema::connection('Tenant')->table('employees', function (Blueprint $table) use ($missingImage, $missingHash, $missingDescriptor, $missingAt) {
                if ($missingImage) {
                    $table->string('face_enrollment_image')->nullable();
                }
                if ($missingHash) {
                    $table->string('face_enrollment_hash', 64)->nullable();
                }
                if ($missingDescriptor) {
                    $table->longText('face_descriptor')->nullable();
                }
                if ($missingAt) {
                    $table->timestamp('face_enrolled_at')->nullable();
                }
            });
            return true;
        } catch (\Throwable $e) {
            // Fallback to raw SQL for legacy tenants.
            try {
                $conn = DB::connection('Tenant');
                if ($missingImage) {
                    $conn->statement("ALTER TABLE employees ADD COLUMN face_enrollment_image VARCHAR(255) NULL");
                }
                if ($missingHash) {
                    $conn->statement("ALTER TABLE employees ADD COLUMN face_enrollment_hash VARCHAR(64) NULL");
                }
                if ($missingDescriptor) {
                    $conn->statement("ALTER TABLE employees ADD COLUMN face_descriptor LONGTEXT NULL");
                }
                if ($missingAt) {
                    $conn->statement("ALTER TABLE employees ADD COLUMN face_enrolled_at TIMESTAMP NULL");
                }
                return true;
            } catch (\Throwable $e2) {
                return false;
            }
        }
    }

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

    private function currentEmployee(): ?Employee
    {
        $tenantUser = TenantUser::where('email', auth()->user()->email)->first();
        if (!$tenantUser) {
            return null;
        }

        return Employee::where('user_id', $tenantUser->id)->first();
    }

    private function decodeDataUrlToBytes(string $dataUrl): ?string
    {
        $base64 = preg_replace('/^data:image\/[a-zA-Z0-9+.-]+;base64,/', '', $dataUrl);
        $bytes = base64_decode($base64);
        if ($bytes === false) {
            return null;
        }
        return $bytes;
    }

    private function computeAverageHash(string $imageBytes): ?string
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

    public function status(Request $request)
    {
        $this->ensureFaceEnrollmentSchema();

        $employee = $this->currentEmployee();
        if (!$employee) {
            return response()->json(['ok' => false, 'message' => 'Employee not found'], 404);
        }

        return response()->json([
            'ok' => true,
            'enrolled' => !empty($employee->face_descriptor),
            'enrolled_at' => $employee->face_enrolled_at?->toISOString(),
        ]);
    }

    public function enroll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|string',
            'hash' => ['nullable', 'string', 'regex:/^[0-9a-fA-F]{16}$/'],
            'descriptor' => ['required', 'array'],
            'descriptor.*' => ['numeric'],
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'message' => $validator->errors()->first()], 422);
        }

        if (!$this->ensureFaceEnrollmentSchema()) {
            return response()->json(['ok' => false, 'message' => 'Tenant database is missing face enrollment columns. Run: php artisan migrate:tenants'], 500);
        }

        $employee = $this->currentEmployee();
        if (!$employee) {
            return response()->json(['ok' => false, 'message' => 'Employee not found'], 404);
        }

        $bytes = $this->decodeDataUrlToBytes($request->input('image'));
        if (!$bytes) {
            return response()->json(['ok' => false, 'message' => 'Invalid image data'], 422);
        }

        $descriptor = $this->normalizeDescriptor($request->input('descriptor'));
        if (empty($descriptor)) {
            return response()->json(['ok' => false, 'message' => 'No face detected. Please try again with better lighting and keep your face centered.'], 422);
        }

        $hash = $request->input('hash');
        if (empty($hash)) {
            $hash = $this->computeAverageHash($bytes);
            if (!$hash) {
                return response()->json(['ok' => false, 'message' => 'Unable to process image. Please try again.'], 500);
            }
        }

        try {
            $employee->face_enrollment_image = null;
            $employee->face_enrollment_hash = $hash;
            $employee->face_descriptor = $descriptor;
            $employee->face_enrolled_at = now();
            $employee->save();
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Failed to save registered photo.'], 500);
        }

        return response()->json([
            'ok' => true,
            'enrolled' => true,
            'enrolled_at' => $employee->face_enrolled_at?->toISOString(),
        ]);
    }
}
