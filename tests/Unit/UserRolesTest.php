<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Tests\TestCase;

class UserRolesTest extends TestCase
{
    public function test_is_hr_returns_true_only_for_hr_manager(): void
    {
        $hr = new User(['role' => 'hr_manager']);
        $admin = new User(['role' => 'company_admin']);
        $employee = new User(['role' => 'employee']);
        $nullRole = new User(['role' => null]);
        $unknown = new User(['role' => 'something_else']);

        $this->assertTrue($hr->isHR());
        $this->assertFalse($admin->isHR());
        $this->assertFalse($employee->isHR());
        $this->assertFalse($nullRole->isHR());
        $this->assertFalse($unknown->isHR());
    }

    public function test_is_company_admin_returns_true_only_for_company_admin(): void
    {
        $admin = new User(['role' => 'company_admin']);
        $hr = new User(['role' => 'hr_manager']);
        $employee = new User(['role' => 'employee']);
        $nullRole = new User(['role' => null]);

        $this->assertTrue($admin->isCompanyAdmin());
        $this->assertFalse($hr->isCompanyAdmin());
        $this->assertFalse($employee->isCompanyAdmin());
        $this->assertFalse($nullRole->isCompanyAdmin());
    }

    public function test_user_tenant_relationship_is_defined_correctly(): void
    {
        $user = new User();

        $rel = $user->tenant();
        $this->assertInstanceOf(BelongsTo::class, $rel);
        $this->assertSame(Tenant::class, get_class($rel->getRelated()));
    }

    public function test_user_fillable_contains_expected_fields(): void
    {
        $user = new User();
        $fillable = $user->getFillable();

        $this->assertContains('tenant_id', $fillable);
        $this->assertContains('name', $fillable);
        $this->assertContains('email', $fillable);
        $this->assertContains('password', $fillable);
        $this->assertContains('role', $fillable);
    }

    public function test_user_hidden_contains_security_sensitive_fields(): void
    {
        $user = new User();
        $hidden = $user->getHidden();

        $this->assertContains('password', $hidden);
        $this->assertContains('remember_token', $hidden);
    }

    public function test_user_casts_contains_expected_casts(): void
    {
        $user = new User();
        $casts = $user->getCasts();

        $this->assertArrayHasKey('email_verified_at', $casts);
        $this->assertSame('datetime', $casts['email_verified_at']);

        $this->assertArrayHasKey('password', $casts);
        $this->assertSame('hashed', $casts['password']);
    }
}
