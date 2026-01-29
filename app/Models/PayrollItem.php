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
        'company_deduction',
        'company_tax',
        'bonus_total',
        'deduction_total',
        'tax_total',
        'attendance_working_days',
        'attendance_present_days',
        'attendance_paid_leave_days',
        'attendance_unpaid_leave_days',
        'attendance_absent_days',
        'attendance_deduction',
        'adjustments_total',
        'net',
    ];

    protected $casts = [
        'gross' => 'decimal:2',
        'company_deduction' => 'decimal:2',
        'company_tax' => 'decimal:2',
        'bonus_total' => 'decimal:2',
        'deduction_total' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'attendance_working_days' => 'integer',
        'attendance_present_days' => 'integer',
        'attendance_paid_leave_days' => 'integer',
        'attendance_unpaid_leave_days' => 'integer',
        'attendance_absent_days' => 'integer',
        'attendance_deduction' => 'decimal:2',
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
