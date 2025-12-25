<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeavePolicy extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'policy_name',
        'leave_type',
        'days_allowed_per_year',
        'is_paid',
        'description',
        'requires_approval',
        'max_consecutive_days',
        'is_active',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'requires_approval' => 'boolean',
        'is_active' => 'boolean',
        'days_allowed_per_year' => 'integer',
        'max_consecutive_days' => 'integer',
    ];
}
