<?php

namespace Tests\Feature;

use App\Http\Middleware\SwitchTenantDatabase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SwitchTenantDatabaseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // In tests we run SQLite in-memory for the default connection.
        // Switch the Tenant connection to sqlite as well so we can verify switching safely.
        config([
            'database.connections.Tenant.driver' => 'sqlite',
            'database.connections.Tenant.database' => database_path('tenant_initial.sqlite'),
            'database.connections.Tenant.foreign_key_constraints' => true,
        ]);

        // Define a small test-only endpoint that goes through the middleware and lets us inspect config.
        Route::middleware(['web', 'auth', SwitchTenantDatabase::class])->get('/__test/tenant-db', function () {
            return response()->json([
                'tenant_db_config' => config('database.connections.Tenant.database'),
            ]);
        });
    }

    public function test_switches_tenant_database_config_for_tenant_user(): void
    {
        $tenant = Tenant::create([
            'subscription_id' => 'sub_test',
            'database' => ':memory:',
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        $this->actingAs($user)
            ->get('/__test/tenant-db')
            ->assertOk()
            ->assertJson([
                'tenant_db_config' => ':memory:',
            ]);
    }

    public function test_logs_out_and_redirects_when_tenant_database_connection_fails(): void
    {
        $tenant = Tenant::create([
            'subscription_id' => 'sub_test',
            'database' => 'broken_db',
            'created_by' => 1,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'employee',
        ]);

        DB::partialMock();
        DB::shouldReceive('purge')->with('Tenant')->once();
        DB::shouldReceive('reconnect')->with('Tenant')->once()->andThrow(new \Exception('fail'));

        $response = $this->actingAs($user)->get('/__test/tenant-db');

        $response->assertRedirect('/?modal=login');
        $this->assertGuest();
        $response->assertSessionHasErrors(['email']);
    }
}
