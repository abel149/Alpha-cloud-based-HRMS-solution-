<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollItem extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'gross',
        'adjustments_total',
        'net',
    ];

    protected $casts = [
        'gross' => 'decimal:2',
        'adjustments_total' => 'decimal:2',
        'net' => 'decimal:2',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
