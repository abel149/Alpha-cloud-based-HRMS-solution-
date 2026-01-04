<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceLog extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'employee_id',
        'type',
        'logged_at',
        'ip_address',
        'wifi_verified',
        'fingerprint_verified',
        'visual_confirmed_at',
        'visual_confirmation_image',
        'visual_confirmation_ip',
        'visual_confirmed_by',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'visual_confirmed_at' => 'datetime',
        'wifi_verified' => 'boolean',
        'fingerprint_verified' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
