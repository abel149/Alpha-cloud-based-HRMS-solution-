<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Models\Tenant;
use Exception;
use App\Models\TenantApplication;
use Inertia\Inertia;
use App\Models\SubscriptionPlan;

class TenantController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'subscriptionId' => 'required|string',
            'database' => 'required|string|unique:tenants,database',
            'createdby' => 'nullable|integer',
        ]);

        $dbName = $request->database;

        try {
            // Check if DB exists
            $existingDb = DB::select("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", [$dbName]);

            if (count($existingDb) > 0) {
                return back()->withErrors([
                    'database' => "Database '$dbName' already exists. Use a different name.",
                ]);
            }

            // Create new database
            DB::statement("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Save tenant info
            $tenant = Tenant::create([
                'subscription_id' => $request->subscriptionId,
                'database' => $dbName,
                'created_by' => $request->createdby,
            ]);

            // Set tenant DB config dynamically
            config(['database.connections.tenant' => [
                'driver' => 'mysql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '3306'),
                'database' => $dbName,
                'username' => env('DB_USERNAME', 'root'),
                'password' => env('DB_PASSWORD', ''),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]]);

            // Reconnect with the new tenant connection
            DB::purge('tenant');
            DB::reconnect('tenant');

            // Run tenant migrations
            Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--database' => 'tenant',
                '--force' => true,
            ]);

            // ✅ Redirect back with success message (Inertia-friendly)
            return redirect()->route('tenants.index')->with('success', 'Tenant created successfully!');
        } catch (Exception $e) {
            Log::error('Tenant creation error: ' . $e->getMessage());

            return back()->withErrors([
                'error' => 'Failed to create tenant. ' . $e->getMessage(),
            ]);
        }
    }



    public function index()
    {
        // Fetch tenants
        $tenants = Tenant::all();

        // Fetch tenant applications that have completed payment
        $paidApplications = TenantApplication::where('payment_status', 'Paid')->get();

        // Fetch all subscription plans
        $subscriptionPlans = SubscriptionPlan::all();

        return Inertia::render('SuperAdmin/Tenants/Index', [
            'tenants' => $tenants,
            'paidApplications' => $paidApplications,
            'subscriptionPlans' => $subscriptionPlans, // pass it to the frontend
        ]);
    }
    public function storeSubscriptionPlan(Request $request)
    {
        $request->validate([
            'planId' => 'required|string|unique:subscription_plans,planId',
            'name' => 'required|string',
            'price' => 'required|numeric',
            'features' => 'required|string',
            'durationDays' => 'required|integer',
        ]);

        SubscriptionPlan::create([
            'planId' => $request->planId,
            'name' => $request->name,
            'price' => $request->price,
            'features' => $request->features,
            'durationDays' => $request->durationDays,
        ]);

        return redirect()->back()->with('success', 'Subscription plan created successfully!');
    }
}
