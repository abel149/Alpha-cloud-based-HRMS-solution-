<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('leave_requests')) {
            Schema::create('leave_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->string('leave_type');
                $table->date('start_date');
                $table->date('end_date');
                $table->text('reason')->nullable();
                $table->string('status')->default('pending');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
            });
            return;
        }

        Schema::table('leave_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_requests', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->after('id');
            }
            if (!Schema::hasColumn('leave_requests', 'leave_type')) {
                $table->string('leave_type')->after('employee_id');
            }
            if (!Schema::hasColumn('leave_requests', 'start_date')) {
                $table->date('start_date')->after('leave_type');
            }
            if (!Schema::hasColumn('leave_requests', 'end_date')) {
                $table->date('end_date')->after('start_date');
            }
            if (!Schema::hasColumn('leave_requests', 'reason')) {
                $table->text('reason')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('leave_requests', 'status')) {
                $table->string('status')->default('pending')->after('reason');
            }
            if (!Schema::hasColumn('leave_requests', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('status');
            }
            if (!Schema::hasColumn('leave_requests', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('leave_requests', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            }
        });
    }

    public function down(): void
    {
    }
};
