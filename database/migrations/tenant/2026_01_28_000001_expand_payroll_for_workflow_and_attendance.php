<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                if (!Schema::hasColumn('payrolls', 'tax_rate_percent')) {
                    $after = Schema::hasColumn('payrolls', 'generated_at') ? 'generated_at' : (Schema::hasColumn('payrolls', 'generated_by') ? 'generated_by' : (Schema::hasColumn('payrolls', 'status') ? 'status' : 'id'));
                    $table->decimal('tax_rate_percent', 6, 2)->default(0)->after($after);
                }
                if (!Schema::hasColumn('payrolls', 'deduction_rate_percent')) {
                    $after = Schema::hasColumn('payrolls', 'tax_rate_percent') ? 'tax_rate_percent' : (Schema::hasColumn('payrolls', 'generated_at') ? 'generated_at' : (Schema::hasColumn('payrolls', 'generated_by') ? 'generated_by' : 'id'));
                    $table->decimal('deduction_rate_percent', 6, 2)->default(0)->after($after);
                }
                if (!Schema::hasColumn('payrolls', 'finalized_by')) {
                    $after = Schema::hasColumn('payrolls', 'generated_by') ? 'generated_by' : (Schema::hasColumn('payrolls', 'status') ? 'status' : 'id');
                    $table->unsignedBigInteger('finalized_by')->nullable()->after($after);
                }
                if (!Schema::hasColumn('payrolls', 'finalized_at')) {
                    $table->timestamp('finalized_at')->nullable()->after('finalized_by');
                }
                if (!Schema::hasColumn('payrolls', 'total_attendance_deductions')) {
                    $after = Schema::hasColumn('payrolls', 'total_tax') ? 'total_tax' : (Schema::hasColumn('payrolls', 'total_net') ? 'total_net' : 'id');
                    $table->decimal('total_attendance_deductions', 12, 2)->default(0)->after($after);
                }
                if (!Schema::hasColumn('payrolls', 'notes')) {
                    $table->text('notes')->nullable();
                }
            });
        }

        if (Schema::hasTable('payroll_items')) {
            Schema::table('payroll_items', function (Blueprint $table) {
                if (!Schema::hasColumn('payroll_items', 'company_deduction')) {
                    $table->decimal('company_deduction', 12, 2)->default(0)->after('gross');
                }
                if (!Schema::hasColumn('payroll_items', 'company_tax')) {
                    $table->decimal('company_tax', 12, 2)->default(0)->after('company_deduction');
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_working_days')) {
                    $after = Schema::hasColumn('payroll_items', 'tax_total') ? 'tax_total' : (Schema::hasColumn('payroll_items', 'net') ? 'net' : 'id');
                    $table->unsignedSmallInteger('attendance_working_days')->default(0)->after($after);
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_present_days')) {
                    $table->unsignedSmallInteger('attendance_present_days')->default(0)->after('attendance_working_days');
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_paid_leave_days')) {
                    $table->unsignedSmallInteger('attendance_paid_leave_days')->default(0)->after('attendance_present_days');
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_unpaid_leave_days')) {
                    $table->unsignedSmallInteger('attendance_unpaid_leave_days')->default(0)->after('attendance_paid_leave_days');
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_absent_days')) {
                    $table->unsignedSmallInteger('attendance_absent_days')->default(0)->after('attendance_unpaid_leave_days');
                }
                if (!Schema::hasColumn('payroll_items', 'attendance_deduction')) {
                    $table->decimal('attendance_deduction', 12, 2)->default(0)->after('attendance_absent_days');
                }
            });
        }

        if (Schema::hasTable('payroll_adjustments')) {
            Schema::table('payroll_adjustments', function (Blueprint $table) {
                if (!Schema::hasColumn('payroll_adjustments', 'category')) {
                    $table->string('category')->nullable()->after('type');
                }
            });
        }
    }

    public function down(): void
    {
    }
};
