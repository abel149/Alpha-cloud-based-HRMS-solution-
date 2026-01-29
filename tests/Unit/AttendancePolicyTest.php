<?php

namespace Tests\Unit;

use App\Models\AttendancePolicy;
use Tests\TestCase;

class AttendancePolicyTest extends TestCase
{
    public function test_uses_tenant_connection(): void
    {
        $policy = new AttendancePolicy();
        $this->assertSame('Tenant', $policy->getConnectionName());
    }

    public function test_fillable_contains_expected_fields(): void
    {
        $policy = new AttendancePolicy();
        $fillable = $policy->getFillable();

        $expected = [
            'policy_name',
            'work_start_time',
            'work_end_time',
            'grace_period_minutes',
            'late_penalty_minutes',
            'requires_check_in',
            'requires_check_out',
            'requires_company_wifi',
            'company_wifi_allowed_ips',
            'company_wifi_allowed_cidrs',
            'requires_fingerprint',
            'requires_visual_confirmation',
            'visual_confirmation_message',
            'minimum_work_hours',
            'description',
            'is_active',
        ];

        foreach ($expected as $field) {
            $this->assertContains($field, $fillable, "AttendancePolicy fillable missing {$field}");
        }
    }

    public function test_casts_configuration_is_correct(): void
    {
        $policy = new AttendancePolicy();
        $casts = $policy->getCasts();

        $this->assertSame('boolean', $casts['requires_check_in'] ?? null);
        $this->assertSame('boolean', $casts['requires_check_out'] ?? null);
        $this->assertSame('boolean', $casts['requires_company_wifi'] ?? null);
        $this->assertSame('boolean', $casts['requires_fingerprint'] ?? null);
        $this->assertSame('boolean', $casts['requires_visual_confirmation'] ?? null);
        $this->assertSame('boolean', $casts['is_active'] ?? null);

        $this->assertSame('integer', $casts['grace_period_minutes'] ?? null);
        $this->assertSame('integer', $casts['late_penalty_minutes'] ?? null);
        $this->assertSame('integer', $casts['minimum_work_hours'] ?? null);
    }

    public function test_boolean_and_integer_casts_apply_when_accessing_attributes(): void
    {
        $policy = new AttendancePolicy([
            'requires_check_in' => 1,
            'requires_check_out' => 0,
            'requires_company_wifi' => '1',
            'requires_fingerprint' => '0',
            'requires_visual_confirmation' => '1',
            'is_active' => '0',
            'grace_period_minutes' => '5',
            'late_penalty_minutes' => '10',
            'minimum_work_hours' => '8',
        ]);

        $this->assertTrue($policy->requires_check_in);
        $this->assertFalse($policy->requires_check_out);
        $this->assertTrue($policy->requires_company_wifi);
        $this->assertFalse($policy->requires_fingerprint);
        $this->assertTrue($policy->requires_visual_confirmation);
        $this->assertFalse($policy->is_active);

        $this->assertSame(5, $policy->grace_period_minutes);
        $this->assertSame(10, $policy->late_penalty_minutes);
        $this->assertSame(8, $policy->minimum_work_hours);
    }
}
