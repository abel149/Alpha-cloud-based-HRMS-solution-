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
        // Permissions table
        if (!Schema::connection('Tenant')->hasTable('permissions')) {
            Schema::connection('Tenant')->create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // e.g., 'view_employees', 'edit_employees'
                $table->string('display_name');
                $table->string('module'); // e.g., 'employees', 'attendance', 'leave'
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // Roles table (additional custom roles beyond user role enum)
        if (!Schema::connection('Tenant')->hasTable('roles')) {
            Schema::connection('Tenant')->create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('display_name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Role-Permission pivot table
        if (!Schema::connection('Tenant')->hasTable('role_permission')) {
            Schema::connection('Tenant')->create('role_permission', function (Blueprint $table) {
                $table->id();
                $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
                $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
                $table->timestamps();
                $table->unique(['role_id', 'permission_id']);
            });
        }

        // User-Role pivot table (for additional roles beyond primary role)
        if (!Schema::connection('Tenant')->hasTable('user_role')) {
            Schema::connection('Tenant')->create('user_role', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
                $table->timestamps();
                $table->unique(['user_id', 'role_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('Tenant')->dropIfExists('user_role');
        Schema::connection('Tenant')->dropIfExists('role_permission');
        Schema::connection('Tenant')->dropIfExists('roles');
        Schema::connection('Tenant')->dropIfExists('permissions');
    }
};
