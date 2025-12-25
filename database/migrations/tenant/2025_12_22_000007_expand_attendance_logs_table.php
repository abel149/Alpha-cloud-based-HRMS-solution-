<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('attendance_logs')) {
            Schema::create('attendance_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->string('type');
                $table->timestamp('logged_at');
                $table->string('ip_address')->nullable();
                $table->boolean('wifi_verified')->default(false);
                $table->boolean('fingerprint_verified')->default(false);
                $table->timestamps();
            });
            return;
        }

        Schema::table('attendance_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_logs', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->after('id');
            }
            if (!Schema::hasColumn('attendance_logs', 'type')) {
                $table->string('type')->after('employee_id');
            }
            if (!Schema::hasColumn('attendance_logs', 'logged_at')) {
                $table->timestamp('logged_at')->nullable()->after('type');
            }
            if (!Schema::hasColumn('attendance_logs', 'ip_address')) {
                $table->string('ip_address')->nullable()->after('logged_at');
            }
            if (!Schema::hasColumn('attendance_logs', 'wifi_verified')) {
                $table->boolean('wifi_verified')->default(false)->after('ip_address');
            }
            if (!Schema::hasColumn('attendance_logs', 'fingerprint_verified')) {
                $table->boolean('fingerprint_verified')->default(false)->after('wifi_verified');
            }
        });
    }

    public function down(): void
    {
    }
};
