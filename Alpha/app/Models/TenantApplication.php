<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantApplication extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'company_name',
        'email',
        'plan',
        'transaction_id',
        'payment_status',
        'tenant_created',
    ];

    protected $casts = [
        'tenant_created' => 'boolean',
    ];
}
