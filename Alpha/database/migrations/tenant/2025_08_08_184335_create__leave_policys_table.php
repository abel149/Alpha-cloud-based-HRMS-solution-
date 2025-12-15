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
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('policy_name');
            $table->string('leave_type'); // e.g., Annual, Sick, Casual, Maternity
            $table->integer('days_allowed_per_year');
            $table->boolean('is_paid')->default(true);
            $table->text('description')->nullable();
            $table->boolean('requires_approval')->default(true);
            $table->integer('max_consecutive_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_policies');
    }
};
