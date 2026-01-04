<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendancePolicy extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
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

    protected $casts = [
        'requires_check_in' => 'boolean',
        'requires_check_out' => 'boolean',
        'requires_company_wifi' => 'boolean',
        'requires_fingerprint' => 'boolean',
        'requires_visual_confirmation' => 'boolean',
        'is_active' => 'boolean',
        'grace_period_minutes' => 'integer',
        'late_penalty_minutes' => 'integer',
        'minimum_work_hours' => 'integer',
    ];
}
