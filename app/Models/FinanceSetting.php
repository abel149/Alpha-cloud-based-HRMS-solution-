<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceSetting extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'tax_rate_percent',
        'deduction_rate_percent',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tax_rate_percent' => 'decimal:2',
        'deduction_rate_percent' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'updated_by');
    }
}
