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
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'wifi_verified' => 'boolean',
        'fingerprint_verified' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
