<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payroll extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'month',
        'year',
        'status',
        'generated_by',
        'generated_at',
        'total_gross',
        'total_bonus',
        'total_deductions',
        'total_tax',
        'total_adjustments',
        'total_net',
        'employees_count',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'generated_at' => 'datetime',
        'total_gross' => 'decimal:2',
        'total_bonus' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_adjustments' => 'decimal:2',
        'total_net' => 'decimal:2',
        'employees_count' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'generated_by');
    }
}
