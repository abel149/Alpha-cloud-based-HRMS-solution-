<?php

namespace App\Models;

class TenantUser extends User
{
    protected $connection = 'Tenant';
    protected $table = 'users';
}
