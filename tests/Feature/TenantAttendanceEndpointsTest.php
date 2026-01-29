<?php

namespace Tests\Feature;

use App\Models\AttendancePolicy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

class TenantAttendanceEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private string $tenantDbPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantDbPath = database_path('tenant_attendance_test.sqlite');
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

    public function test_wifi_check_passes_when_no_active_policy_requires_company_wifi(): void
    {
        $tenant = Tenant::create([
            'subscription_id' => 'sub_attendance',
            'database' => $this->tenantDbPath,
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $this->actingAs($user)
            ->get('/tenant/wifi-check')
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'policy_required' => false,
            ]);
    }

    public function test_wifi_check_denies_when_policy_requires_wifi_but_no_allowlist_configured(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'WiFi Required',
            'requires_company_wifi' => true,
            'company_wifi_allowed_ips' => '',
            'company_wifi_allowed_cidrs' => '',
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

        $this->actingAs($user)
            ->get('/tenant/wifi-check')
            ->assertOk()
            ->assertJson([
                'ok' => false,
                'policy_required' => true,
                'reason' => 'Company Wi-Fi allowlist not configured',
            ]);
    }

    public function test_wifi_check_allows_when_ip_is_in_allowlist(): void
    {
        AttendancePolicy::create([
            'policy_name' => 'WiFi Required',
            'requires_company_wifi' => true,
            'company_wifi_allowed_ips' => '127.0.0.1',
            'company_wifi_allowed_cidrs' => '',
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

        $this->actingAs($user)
            ->get('/tenant/wifi-check')
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'policy_required' => true,
            ]);
    }

    public function test_attendance_policy_endpoint_returns_active_policy_fields(): void
    {
        $policy = AttendancePolicy::create([
            'policy_name' => 'Default Policy',
            'requires_company_wifi' => true,
            'requires_fingerprint' => true,
            'requires_visual_confirmation' => false,
            'visual_confirmation_message' => 'Hello',
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

        $this->actingAs($user)
            ->get('/tenant/attendance-policy')
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'policy' => [
                    'id' => $policy->id,
                    'policy_name' => 'Default Policy',
                    'requires_company_wifi' => true,
                    'requires_fingerprint' => true,
                    'requires_visual_confirmation' => false,
                    'visual_confirmation_message' => 'Hello',
                ],
            ]);
    }
}
