<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

class MigrateTenants extends Command
{
    protected $signature = 'migrate:tenants';
    protected $description = 'Run tenant-specific migrations for each tenant database';

    public function handle()
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->info("Migrating DB for tenant database: {$tenant->database}");


            // Set dynamic DB config
            Config::set('database.connections.tenant', [
                'driver' => 'mysql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '3306'),
                'database' => $tenant->database,
                'username' => env('DB_USERNAME', 'root'),
                'password' => env('DB_PASSWORD', ''),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]);

            DB::purge('tenant'); // clear old connection
            DB::reconnect('tenant');

            // Run migrations in /database/migrations/tenant
            Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--database' => 'tenant',
                '--force' => true,
            ]);

            $this->line(Artisan::output());
        }

        $this->info("✅ All tenant migrations complete.");
    }
}
