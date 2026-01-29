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
        Schema::table('employees', function (Blueprint $table) {
            // Check and add department_id
            if (!Schema::hasColumn('employees', 'department_id')) {
                // We use unsignedBigInteger explicitly to avoid issues if foreign key constraint fails immediately
                $table->unsignedBigInteger('department_id')->nullable()->after('user_id');
            }

            // Check and add other potential missing columns
            if (!Schema::hasColumn('employees', 'phone')) {
                $table->string('phone')->nullable()->after('employee_code');
            }
            if (!Schema::hasColumn('employees', 'address')) {
                $table->text('address')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('employees', 'salary')) {
                $table->decimal('salary', 10, 2)->nullable()->after('address');
            }
            if (!Schema::hasColumn('employees', 'employment_type')) {
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time')->after('salary');
            }
            if (!Schema::hasColumn('employees', 'status')) {
                $table->enum('status', ['active', 'on_leave', 'terminated'])->default('active')->after('employment_type');
            }
            if (!Schema::hasColumn('employees', 'cv')) {
                $table->binary('cv')->nullable()->after('status');
            }
        });

        // Add foreign key after the table alteration so we can safely check the schema.
        // This prevents provisioning failures when departments table is created later.
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'department_id') && Schema::hasTable('departments')) {
            try {
                Schema::table('employees', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['department_id']);
                    } catch (\Throwable $ignored) {
                        // ignore if FK doesn't exist
                    }

                    $table->foreign('department_id')
                        ->references('id')
                        ->on('departments')
                        ->onDelete('set null');
                });
            } catch (\Throwable $e) {
                // ignore: some tenants may have a different schema state
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'department_id')) {
                // Drop foreign key first if it exists - tricky to know name, usually employees_department_id_foreign
                try {
                    $table->dropForeign(['department_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('department_id');
            }
            // We won't drop other columns to avoid data loss in rollback of a fix migration
        });
    }
};
