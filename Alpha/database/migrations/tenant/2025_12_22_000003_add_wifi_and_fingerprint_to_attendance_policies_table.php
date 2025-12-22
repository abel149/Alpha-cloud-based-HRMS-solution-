<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('attendance_policies')) {
            return;
        }

        Schema::table('attendance_policies', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_policies', 'requires_company_wifi')) {
                $table->boolean('requires_company_wifi')->default(false);
            }
            if (!Schema::hasColumn('attendance_policies', 'company_wifi_allowed_ips')) {
                $table->text('company_wifi_allowed_ips')->nullable();
            }
            if (!Schema::hasColumn('attendance_policies', 'company_wifi_allowed_cidrs')) {
                $table->text('company_wifi_allowed_cidrs')->nullable();
            }
            if (!Schema::hasColumn('attendance_policies', 'requires_fingerprint')) {
                $table->boolean('requires_fingerprint')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('attendance_policies')) {
            return;
        }

        Schema::table('attendance_policies', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_policies', 'requires_company_wifi')) {
                $table->dropColumn('requires_company_wifi');
            }
            if (Schema::hasColumn('attendance_policies', 'company_wifi_allowed_ips')) {
                $table->dropColumn('company_wifi_allowed_ips');
            }
            if (Schema::hasColumn('attendance_policies', 'company_wifi_allowed_cidrs')) {
                $table->dropColumn('company_wifi_allowed_cidrs');
            }
            if (Schema::hasColumn('attendance_policies', 'requires_fingerprint')) {
                $table->dropColumn('requires_fingerprint');
            }
        });
    }
};
