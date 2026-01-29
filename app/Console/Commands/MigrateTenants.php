<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
            Config::set('database.connections.Tenant', [
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

            DB::purge('Tenant'); // clear old connection
            DB::reconnect('Tenant');

            $hasMigrationsTable = Schema::connection('Tenant')->hasTable('migrations');
            $hasExistingSchema = Schema::connection('Tenant')->hasTable('employees')
                || Schema::connection('Tenant')->hasTable('attendance_policies')
                || Schema::connection('Tenant')->hasTable('departments');

            try {
                // Preferred path: if migrations table exists, run normal tenant migrations.
                // Laravel will only apply NEW migrations.
                if ($hasMigrationsTable) {
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                } elseif ($hasExistingSchema) {
                    // Legacy tenant DB with tables but without migration history: run safe additive migrations only.
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_15_000002_fix_all_tenant_tables_schema.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_11_30_120000_create_roles_and_permissions_tables.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000003_add_wifi_and_fingerprint_to_attendance_policies_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000006_expand_leave_requests_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000007_expand_attendance_logs_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000008_expand_payrolls_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000009_create_payroll_items_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000010_create_payroll_adjustments_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000011_create_performance_reviews_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000012_ensure_finance_and_reviews_schema.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000001_add_fingerprint_template_to_employees_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_27_000001_add_face_enrollment_to_employees_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000002_add_visual_confirmation_to_attendance_logs.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000003_add_requires_visual_confirmation_to_attendance_policies.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                } else {
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                }

                $this->line(Artisan::output());
            } catch (\Throwable $e) {
                // Some tenants can have tables already created but missing migration records.
                // Running full migrations will fail with "table already exists". Fall back to safe additive migrations.
                $this->error("Migration failed for {$tenant->database}: {$e->getMessage()}");

                try {
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_15_000002_fix_all_tenant_tables_schema.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_11_30_120000_create_roles_and_permissions_tables.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000003_add_wifi_and_fingerprint_to_attendance_policies_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000006_expand_leave_requests_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_22_000007_expand_attendance_logs_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000008_expand_payrolls_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000009_create_payroll_items_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000010_create_payroll_adjustments_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000011_create_performance_reviews_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_24_000012_ensure_finance_and_reviews_schema.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000001_add_fingerprint_template_to_employees_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_27_000001_add_face_enrollment_to_employees_table.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000002_add_visual_confirmation_to_attendance_logs.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);
                    Artisan::call('migrate', [
                        '--path' => 'database/migrations/tenant/2025_12_26_000003_add_requires_visual_confirmation_to_attendance_policies.php',
                        '--database' => 'Tenant',
                        '--force' => true,
                    ]);

                    $this->line(Artisan::output());
                } catch (\Throwable $e2) {
                    $this->error("Fallback migration failed for {$tenant->database}: {$e2->getMessage()}");
                }
            }
        }

        $this->info("✅ All tenant migrations complete.");
    }
}
