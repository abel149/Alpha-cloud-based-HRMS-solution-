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
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Notifications\CompanyAdminCredentialsNotification;
use Illuminate\Support\Facades\Notification;


class TenantController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'subscriptionId' => 'required|string',
            'database' => 'required|string|unique:tenants,database',
            'createdby' => 'nullable|integer',
            // Keep tenant_application_id optional and do not enforce exists() here,
            // to avoid validation failures if the ID/connection mismatch. We'll
            // still try to match and update the application record below.
            'tenant_application_id' => 'nullable|integer',
        ]);

        Log::info('TenantController@store called from Super Admin', [
            'subscriptionId' => $request->subscriptionId,
            'database' => $request->database,
            'tenant_application_id' => $request->tenant_application_id,
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
            Log::info('Tenant created successfully (central tenants table)', [
                'tenant_id' => $tenant->id,
                'database' => $tenant->database,
            ]);

            // Set tenant DB config dynamically
            config(['database.connections.Tenant' => [
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
            DB::purge('Tenant');
            DB::reconnect('Tenant');

            // Run tenant migrations
            Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--database' => 'Tenant',
                '--force' => true,
            ]);

            // If this tenant comes from a paid application, mark it as created.
            // We match by both explicit tenant_application_id and by transaction_id (subscriptionId)
            // so the row is updated even if one of them is missing.
            TenantApplication::where(function ($q) use ($request) {
                if ($request->filled('tenant_application_id')) {
                    $q->where('id', $request->tenant_application_id);
                }

                if ($request->filled('subscriptionId')) {
                    if ($request->filled('tenant_application_id')) {
                        $q->orWhere('transaction_id', $request->subscriptionId);
                    } else {
                        $q->where('transaction_id', $request->subscriptionId);
                    }
                }
            })->update(['tenant_created' => 1]);

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
        $tenants = Tenant::orderByDesc('id')->get();

        // Fetch tenant applications that have completed payment but are not yet provisioned as tenants
        // (tenant_created is either NULL or explicitly 0)
        $paidApplications = TenantApplication::where('payment_status', 'Paid')
            ->where(function ($q) {
                $q->whereNull('tenant_created')
                  ->orWhere('tenant_created', 0);
            })
            ->orderByDesc('id')
            ->get();

        // Fetch all subscription plans
        $subscriptionPlans = SubscriptionPlan::orderByDesc('id')->get();
        //Fetch users
        $compadmin = User::orderByDesc('id')->get();

        return Inertia::render('SuperAdmin/Tenants/Index', [
            'tenants' => $tenants,
            'paidApplications' => $paidApplications,
            'subscriptionPlans' => $subscriptionPlans,
            'users' => $compadmin, // pass it to the frontend
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $data = $request->validate([
            'subscription_id' => 'nullable|string|max:255',
        ]);

        $tenant->update($data);

        return redirect()->route('tenants.index')->with('success', 'Tenant updated successfully!');
    }

    public function destroy(Tenant $tenant)
    {
        $dbName = (string) $tenant->database;

        if ($dbName === '' || !preg_match('/^[A-Za-z0-9_]+$/', $dbName)) {
            return back()->with('error', 'Failed to delete tenant. Invalid tenant database name.');
        }

        try {
            try {
                DB::disconnect('Tenant');
                DB::purge('Tenant');
            } catch (\Throwable $e) {
                // ignore
            }

            $existingDb = DB::select(
                "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
                [$dbName]
            );

            if (count($existingDb) > 0) {
                DB::statement("DROP DATABASE `$dbName`");
            }

            $tenant->delete();

            return redirect()->route('tenants.index')->with('success', 'Tenant deleted successfully!');
        } catch (\Throwable $e) {
            Log::error('Tenant deletion error', [
                'tenant_id' => $tenant->id,
                'database' => $dbName,
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to delete tenant database. Please ensure no active connections are using it and try again.');
        }
    }

    public function create()
    {
        // Fetch subscription plans for the create form
        $subscriptionPlans = SubscriptionPlan::all();
        
        return Inertia::render('SuperAdmin/Tenants/Create', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }
    public function storeuser(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->email)),
        ]);

        $request->validate([
            'tenantid' => 'required|integer|exists:tenants,id',
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
        ]);

        $tenantId = (int) $request->tenantid;
        $tempPasswordPlain = (string) \Illuminate\Support\Str::random(12);
        $tempPasswordHashed = Hash::make($tempPasswordPlain);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $tempPasswordHashed,
            'role' => 'company_admin',
            'tenant_id' => $tenantId, // stays central
        ]);

        try {
            Notification::route('mail', $user->email)->notify(new CompanyAdminCredentialsNotification(
                tenantId: $tenantId,
                tempPassword: $tempPasswordPlain,
            ));
        } catch (\Throwable $e) {
            Log::error('Failed to send company admin credentials email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => $tenantId,
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', 'Company Admin created but email could not be sent. Please check mail settings (SMTP) and try again.');
        }

        return back()->with('success', 'Company Admin created and credentials emailed successfully');
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
