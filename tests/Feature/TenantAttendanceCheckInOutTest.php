<?php

namespace Tests\Feature;

use App\Models\AttendancePolicy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenantAttendanceCheckInOutTest extends TestCase
{
    use RefreshDatabase;

    private string $tenantDbPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantDbPath = database_path('tenant_attendance_checkinout_test.sqlite');
        if (file_exists($this->tenantDbPath)) {
            @unlink($this->tenantDbPath);
        }
        file_put_contents($this->tenantDbPath, '');

        config([
            'database.connections.Tenant.driver' => 'sqlite',
            'database.connections.Tenant.database' => $this->tenantDbPath,
            'database.connections.Tenant.foreign_key_constraints' => true,
        ]);

        DB::purge('Tenant');
        DB::reconnect('Tenant');

        Schema::connection('Tenant')->create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->string('role')->nullable();
            $table->timestamps();
        });

        Schema::connection('Tenant')->create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->date('hire_date')->nullable();
            $table->string('job_title')->nullable();
            $table->string('employee_code')->nullable();
            $table->string('phone')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->string('employment_type')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::connection('Tenant')->create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('type');
            $table->dateTime('logged_at');
            $table->string('ip_address')->nullable();
            $table->boolean('wifi_verified')->default(false);
            $table->boolean('fingerprint_verified')->default(false);
            $table->timestamps();
        });

        Schema::connection('Tenant')->create('attendance_policies', function (Blueprint $table) {
            $table->id();
            $table->string('policy_name')->nullable();
            $table->boolean('requires_company_wifi')->default(false);
            $table->text('company_wifi_allowed_ips')->nullable();
            $table->text('company_wifi_allowed_cidrs')->nullable();
            $table->boolean('requires_fingerprint')->default(false);
            $table->boolean('requires_visual_confirmation')->default(false);
            $table->text('visual_confirmation_message')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createTenantUserAndEmployeeFor(User $centralUser): int
    {
        $tenantUserId = (int) DB::connection('Tenant')->table('users')->insertGetId([
            'name' => $centralUser->name,
            'email' => $centralUser->email,
            'password' => $centralUser->password,
            'role' => $centralUser->role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return (int) DB::connection('Tenant')->table('employees')->insertGetId([
            'user_id' => $tenantUserId,
            'employee_code' => 'E001',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function csrfHeaders(): array
    {
        $token = csrf_token();

        return [
            'X-CSRF-TOKEN' => $token,
        ];
    }

    public function test_check_in_creates_attendance_log_when_policy_allows(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'No restrictions',
            'requires_company_wifi' => false,
            'requires_visual_confirmation' => false,
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $employeeId = $this->createTenantUserAndEmployeeFor($user);

        $response = $this->actingAs($user)
            ->withSession(['_token' => csrf_token()])
            ->withHeaders($this->csrfHeaders())
            ->postJson('/tenant/employee/attendance/check-in');

        $response->assertOk()->assertJson([
            'ok' => true,
        ]);

        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $employeeId,
            'type' => 'check_in',
            'wifi_verified' => 1,
        ], 'Tenant');
    }

    public function test_check_out_creates_attendance_log_when_policy_allows(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'No restrictions',
            'requires_company_wifi' => false,
            'requires_visual_confirmation' => false,
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $employeeId = $this->createTenantUserAndEmployeeFor($user);

        $response = $this->actingAs($user)
            ->withSession(['_token' => csrf_token()])
            ->withHeaders($this->csrfHeaders())
            ->postJson('/tenant/employee/attendance/check-out');

        $response->assertOk()->assertJson([
            'ok' => true,
        ]);

        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $employeeId,
            'type' => 'check_out',
            'wifi_verified' => 1,
        ], 'Tenant');
    }

    public function test_check_in_denies_when_wifi_required_and_no_allowlist_configured(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'WiFi required',
            'requires_company_wifi' => true,
            'company_wifi_allowed_ips' => '',
            'company_wifi_allowed_cidrs' => '',
            'requires_visual_confirmation' => false,
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $employeeId = $this->createTenantUserAndEmployeeFor($user);

        $response = $this->actingAs($user)
            ->withSession(['_token' => csrf_token()])
            ->withHeaders($this->csrfHeaders())
            ->postJson('/tenant/employee/attendance/check-in');

        $response->assertStatus(403)->assertJson([
            'ok' => false,
            'message' => 'Company Wi-Fi verification failed',
        ]);

        $this->assertDatabaseMissing('attendance_logs', [
            'employee_id' => $employeeId,
            'type' => 'check_in',
        ], 'Tenant');
    }

    public function test_check_in_denies_when_visual_confirmation_required_but_not_confirmed(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'Visual required',
            'requires_company_wifi' => false,
            'requires_visual_confirmation' => true,
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $employeeId = $this->createTenantUserAndEmployeeFor($user);

        $response = $this->actingAs($user)
            ->withSession(['_token' => csrf_token()])
            ->withHeaders($this->csrfHeaders())
            ->postJson('/tenant/employee/attendance/check-in');

        $response->assertStatus(403)->assertJson([
            'ok' => false,
            'message' => 'Visual confirmation required. Please take a photo first.',
        ]);

        $this->assertDatabaseMissing('attendance_logs', [
            'employee_id' => $employeeId,
            'type' => 'check_in',
        ], 'Tenant');
    }

    public function test_check_in_allows_when_visual_confirmation_is_valid_and_clears_session(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'Visual required',
            'requires_company_wifi' => false,
            'requires_visual_confirmation' => true,
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $employeeId = $this->createTenantUserAndEmployeeFor($user);

        $response = $this->actingAs($user)
            ->withSession([
                '_token' => csrf_token(),
                'visual_confirmed' => true,
                'visual_confirmed_at' => now()->timestamp,
                'visual_confirmed_employee_id' => $employeeId,
            ])
            ->withHeaders($this->csrfHeaders())
            ->postJson('/tenant/employee/attendance/check-in');

        $response->assertOk()->assertJson([
            'ok' => true,
        ]);

        $this->assertDatabaseHas('attendance_logs', [
            'employee_id' => $employeeId,
            'type' => 'check_in',
        ], 'Tenant');

        $response->assertSessionMissing('visual_confirmed');
        $response->assertSessionMissing('visual_confirmed_at');
        $response->assertSessionMissing('visual_confirmed_employee_id');
    }
}
