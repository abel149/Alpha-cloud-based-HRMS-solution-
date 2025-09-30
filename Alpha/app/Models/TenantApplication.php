<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'email',
        'plan',
        'transaction_id',
        'payment_status',
        'tenant_created',
    ];
}
