<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureDepartmentManager;
use App\Http\Middleware\EnsureFinanceManager;
use App\Http\Middleware\EnsureHrManager;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RoleAccessMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['web', 'auth', EnsureHrManager::class])->get('/__test/role/hr', function () {
            return response()->json(['ok' => true]);
        });

        Route::middleware(['web', 'auth', EnsureFinanceManager::class])->get('/__test/role/finance', function () {
            return response()->json(['ok' => true]);
        });

        Route::middleware(['web', 'auth', EnsureDepartmentManager::class])->get('/__test/role/manager', function () {
            return response()->json(['ok' => true]);
        });
    }

    public function test_hr_routes_allow_hr_manager_and_deny_employee(): void
    {
        $hr = User::factory()->create(['role' => 'hr_manager']);
        $employee = User::factory()->create(['role' => 'employee']);

        $this->actingAs($hr)->get('/__test/role/hr')->assertOk();
        $this->actingAs($employee)->get('/__test/role/hr')->assertStatus(403);
    }

    public function test_finance_routes_allow_finance_manager_and_deny_employee(): void
    {
        $finance = User::factory()->create(['role' => 'finance_manager']);
        $employee = User::factory()->create(['role' => 'employee']);

        $this->actingAs($finance)->get('/__test/role/finance')->assertOk();
        $this->actingAs($employee)->get('/__test/role/finance')->assertStatus(403);
    }

    public function test_department_manager_routes_allow_department_manager_and_deny_employee(): void
    {
        $manager = User::factory()->create(['role' => 'department_manager']);
        $employee = User::factory()->create(['role' => 'employee']);

        $this->actingAs($manager)->get('/__test/role/manager')->assertOk();
        $this->actingAs($employee)->get('/__test/role/manager')->assertStatus(403);
    }

    public function test_company_admin_can_access_all_role_protected_routes(): void
    {
        $admin = User::factory()->create(['role' => 'company_admin']);

        $this->actingAs($admin)->get('/__test/role/hr')->assertOk();
        $this->actingAs($admin)->get('/__test/role/finance')->assertOk();
        $this->actingAs($admin)->get('/__test/role/manager')->assertOk();
    }

    public function test_super_admin_can_access_all_role_protected_routes(): void
    {
        $admin = User::factory()->create(['role' => 'Super_admin']);

        $this->actingAs($admin)->get('/__test/role/hr')->assertOk();
        $this->actingAs($admin)->get('/__test/role/finance')->assertOk();
        $this->actingAs($admin)->get('/__test/role/manager')->assertOk();
    }
}
