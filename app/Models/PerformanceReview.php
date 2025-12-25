<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    protected $connection = 'Tenant';

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'period_start',
        'period_end',
        'rating',
        'strengths',
        'improvements',
        'goals',
        'submitted_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'rating' => 'integer',
        'submitted_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'reviewer_id');
    }
}
