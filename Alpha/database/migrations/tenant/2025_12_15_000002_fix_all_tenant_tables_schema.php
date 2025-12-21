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
        // Fix Departments Table
        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (!Schema::hasColumn('departments', 'name')) {
                    $table->string('name')->after('id');
                }
                if (!Schema::hasColumn('departments', 'description')) {
                    // Check if name exists now (it should), otherwise add after id
                    if (Schema::hasColumn('departments', 'name')) {
                        $table->text('description')->nullable()->after('name');
                    } else {
                        $table->text('description')->nullable()->after('id');
                    }
                }
                if (!Schema::hasColumn('departments', 'manager_id')) {
                    $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
                }
                if (!Schema::hasColumn('departments', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }

        // Fix Leave Policies Table
        if (Schema::hasTable('leave_policies')) {
            Schema::table('leave_policies', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_policies', 'policy_name')) {
                    $table->string('policy_name')->after('id');
                }
                if (!Schema::hasColumn('leave_policies', 'leave_type')) {
                    $table->string('leave_type')->after('id');
                }
                if (!Schema::hasColumn('leave_policies', 'days_allowed_per_year')) {
                    $table->integer('days_allowed_per_year')->after('id');
                }
                if (!Schema::hasColumn('leave_policies', 'is_paid')) {
                    $table->boolean('is_paid')->default(true);
                }
                if (!Schema::hasColumn('leave_policies', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('leave_policies', 'requires_approval')) {
                    $table->boolean('requires_approval')->default(true);
                }
                if (!Schema::hasColumn('leave_policies', 'max_consecutive_days')) {
                    $table->integer('max_consecutive_days')->nullable();
                }
                if (!Schema::hasColumn('leave_policies', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }

        // Fix Attendance Policies Table
        if (Schema::hasTable('attendance_policies')) {
            Schema::table('attendance_policies', function (Blueprint $table) {
                if (!Schema::hasColumn('attendance_policies', 'policy_name')) {
                    $table->string('policy_name')->after('id');
                }
                if (!Schema::hasColumn('attendance_policies', 'work_start_time')) {
                    $table->time('work_start_time')->after('id');
                }
                if (!Schema::hasColumn('attendance_policies', 'work_end_time')) {
                    $table->time('work_end_time')->after('id');
                }
                if (!Schema::hasColumn('attendance_policies', 'grace_period_minutes')) {
                    $table->integer('grace_period_minutes')->default(15);
                }
                if (!Schema::hasColumn('attendance_policies', 'late_penalty_minutes')) {
                    $table->integer('late_penalty_minutes')->nullable();
                }
                if (!Schema::hasColumn('attendance_policies', 'requires_check_in')) {
                    $table->boolean('requires_check_in')->default(true);
                }
                if (!Schema::hasColumn('attendance_policies', 'requires_check_out')) {
                    $table->boolean('requires_check_out')->default(true);
                }
                if (!Schema::hasColumn('attendance_policies', 'minimum_work_hours')) {
                    $table->integer('minimum_work_hours')->default(8);
                }
                if (!Schema::hasColumn('attendance_policies', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('attendance_policies', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }

        // Fix Roles Table
        if (Schema::hasTable('roles')) {
            Schema::table('roles', function (Blueprint $table) {
                if (!Schema::hasColumn('roles', 'name')) {
                    $table->string('name')->unique()->after('id');
                }
                if (!Schema::hasColumn('roles', 'display_name')) {
                    $table->string('display_name')->after('id');
                }
                if (!Schema::hasColumn('roles', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('roles', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We generally don't want to drop columns in a fix migration rollback as it might cause data loss
    }
};
