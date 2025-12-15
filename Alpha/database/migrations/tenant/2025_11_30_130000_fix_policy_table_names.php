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
        // Rename old table names to correct names
        if (Schema::hasTable('_leave_policys') && !Schema::hasTable('leave_policies')) {
            Schema::rename('_leave_policys', 'leave_policies');
        }
        
        if (Schema::hasTable('_attendance_policys') && !Schema::hasTable('attendance_policies')) {
            Schema::rename('_attendance_policys', 'attendance_policies');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('leave_policies')) {
            Schema::rename('leave_policies', '_leave_policys');
        }
        
        if (Schema::hasTable('attendance_policies')) {
            Schema::rename('attendance_policies', '_attendance_policys');
        }
    }
};
