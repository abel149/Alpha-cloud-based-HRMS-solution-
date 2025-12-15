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
        Schema::create('attendance_policies', function (Blueprint $table) {
            $table->id();
            $table->string('policy_name');
            $table->time('work_start_time'); // e.g., 09:00:00
            $table->time('work_end_time'); // e.g., 17:00:00
            $table->integer('grace_period_minutes')->default(15);
            $table->integer('late_penalty_minutes')->nullable();
            $table->boolean('requires_check_in')->default(true);
            $table->boolean('requires_check_out')->default(true);
            $table->integer('minimum_work_hours')->default(8);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_policies');
    }
};
