<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class TenantService
{
    public function createTenant(string $subscriptionId, string $databaseName, int $createdBy): Tenant
    {
        // 1. Create the tenant database
        DB::statement("CREATE DATABASE `$databaseName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // 2. Store tenant record in the central database
        $tenant = Tenant::create([
            'subscription_id' => $subscriptionId,
            'database' => $databaseName,
            'created_by' => $createdBy,
        ]);

        // 3. Configure and purge the tenant connection
        config(['database.connections.tenant.database' => $databaseName]);
        DB::purge('tenant');

        // 4. Run tenant-specific migrations
        Artisan::call('migrate', [
            '--path' => '/database/migrations/tenant',
            '--database' => 'tenant',
            '--force' => true,
        ]);

        return $tenant;
    }
}
