<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payrolls')) {
            Schema::create('payrolls', function (Blueprint $table) {
                $table->id();
                $table->unsignedTinyInteger('month');
                $table->unsignedSmallInteger('year');
                $table->string('status')->default('completed');
                $table->unsignedBigInteger('generated_by')->nullable();
                $table->timestamp('generated_at')->nullable();
                $table->decimal('total_gross', 12, 2)->default(0);
                $table->decimal('total_adjustments', 12, 2)->default(0);
                $table->decimal('total_net', 12, 2)->default(0);
                $table->unsignedInteger('employees_count')->default(0);
                $table->timestamps();
            });
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            if (!Schema::hasColumn('payrolls', 'month')) {
                $table->unsignedTinyInteger('month')->nullable()->after('id');
            }
            if (!Schema::hasColumn('payrolls', 'year')) {
                $table->unsignedSmallInteger('year')->nullable()->after('month');
            }
            if (!Schema::hasColumn('payrolls', 'status')) {
                $table->string('status')->default('completed')->after('year');
            }
            if (!Schema::hasColumn('payrolls', 'generated_by')) {
                $table->unsignedBigInteger('generated_by')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payrolls', 'generated_at')) {
                $table->timestamp('generated_at')->nullable()->after('generated_by');
            }
            if (!Schema::hasColumn('payrolls', 'total_gross')) {
                $table->decimal('total_gross', 12, 2)->default(0)->after('generated_at');
            }
            if (!Schema::hasColumn('payrolls', 'total_adjustments')) {
                $table->decimal('total_adjustments', 12, 2)->default(0)->after('total_gross');
            }
            if (!Schema::hasColumn('payrolls', 'total_net')) {
                $table->decimal('total_net', 12, 2)->default(0)->after('total_adjustments');
            }
            if (!Schema::hasColumn('payrolls', 'employees_count')) {
                $table->unsignedInteger('employees_count')->default(0)->after('total_net');
            }
        });
    }

    public function down(): void
    {
    }
};
