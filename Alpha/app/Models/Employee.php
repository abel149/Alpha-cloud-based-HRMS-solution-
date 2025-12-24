<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'user_id',
        'department_id',
        'hire_date',
        'job_title',
        'employee_code',
        'phone',
        'address',
        'salary',
        'employment_type',
        'status',
        'cv',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'salary' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
