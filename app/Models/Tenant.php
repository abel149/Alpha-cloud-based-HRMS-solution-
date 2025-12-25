<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $connection = 'mysql';

    protected $fillable = [
        'subscription_id',
        'database',
        'created_by',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
