<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'face_enrollment_image')) {
                $table->string('face_enrollment_image')->nullable();
            }
            if (!Schema::hasColumn('employees', 'face_enrollment_hash')) {
                $table->string('face_enrollment_hash', 64)->nullable();
            }
            if (!Schema::hasColumn('employees', 'face_enrolled_at')) {
                $table->timestamp('face_enrolled_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'face_enrollment_image')) {
                $table->dropColumn('face_enrollment_image');
            }
            if (Schema::hasColumn('employees', 'face_enrollment_hash')) {
                $table->dropColumn('face_enrollment_hash');
            }
            if (Schema::hasColumn('employees', 'face_enrolled_at')) {
                $table->dropColumn('face_enrolled_at');
            }
        });
    }
};
