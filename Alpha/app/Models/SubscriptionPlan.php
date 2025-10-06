<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'planId',
        'name',
        'price',
        'features',
        'durationDays',
    ];
}
