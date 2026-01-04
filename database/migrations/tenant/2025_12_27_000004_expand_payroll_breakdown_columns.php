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
                if (!Schema::hasColumn('payrolls', 'total_bonus')) {
                    $table->decimal('total_bonus', 12, 2)->default(0)->after('total_gross');
                }
                if (!Schema::hasColumn('payrolls', 'total_deductions')) {
                    $table->decimal('total_deductions', 12, 2)->default(0)->after('total_bonus');
                }
                if (!Schema::hasColumn('payrolls', 'total_tax')) {
                    $table->decimal('total_tax', 12, 2)->default(0)->after('total_deductions');
                }
            });
        }

        if (Schema::hasTable('payroll_items')) {
            Schema::table('payroll_items', function (Blueprint $table) {
                if (!Schema::hasColumn('payroll_items', 'bonus_total')) {
                    $table->decimal('bonus_total', 12, 2)->default(0)->after('gross');
                }
                if (!Schema::hasColumn('payroll_items', 'deduction_total')) {
                    $table->decimal('deduction_total', 12, 2)->default(0)->after('bonus_total');
                }
                if (!Schema::hasColumn('payroll_items', 'tax_total')) {
                    $table->decimal('tax_total', 12, 2)->default(0)->after('deduction_total');
                }
            });
        }
    }

    public function down(): void
    {
    }
};
