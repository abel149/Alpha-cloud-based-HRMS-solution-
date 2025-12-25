<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollAdjustment extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'type',
        'amount',
        'description',
        'created_by',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'amount' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by');
    }
}
