<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Middleware\SwitchTenantDatabase;
use App\Http\Controllers\TenantController;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TenantApplicationController;


// -------------------
// Public Routes
// -------------------
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// -------------------
// Authenticated User Routes (Central DB)
// -------------------
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// -------------------
// Tenant Routes
// -------------------
Route::middleware(['auth', SwitchTenantDatabase::class])->group(function () {
    Route::get('/tenant-dashboard', function () {
        return Inertia::render('Dashboard'); // Tenant dashboard page
    })->name('tenant.dashboard');

    Route::get('/tenant-users-json', function () {
        // Query the users table in the tenant database
        $users = DB::connection('tenant')->table('users')->get();

        return response()->json([
            'tenant_id' => Auth::user()->tenant_id,
            'connected_db' => DB::connection('tenant')->getDatabaseName(),
            'users' => $users,
        ]);
    });

    // Add more tenant-specific routes here
});

// -------------------
// Super Admin Routes
// -------------------
Route::middleware(['auth', EnsureSuperAdmin::class])->group(function () {
    Route::get('/superadmin/tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::get('/superadmin/tenants/create', [TenantController::class, 'create'])->name('tenants.create');
    Route::post('/superadmin/tenants', [TenantController::class, 'store'])->name('tenants.store');
});



// Show the form page (Inertia React)
Route::get('/tenant/apply', function () {
    return inertia('SuperAdmin/Tenants/Apply');
})->name('tenant.apply');

// Handle form submission (POST)
Route::post('/tenant/apply', [TenantApplicationController::class, 'apply'])
    ->name('tenant.apply.store');

// Chapa callback
// Safer: allow any HTTP method for callback
Route::any('/chapa/callback', [TenantApplicationController::class, 'chapaCallback'])
    ->name('chapa.callback');


// Inertia success/fail pages
Route::get('/applications/success', fn() => inertia('SuperAdmin/Tenants/PaymentSuccess'))
    ->name('applications.success');

Route::get('/applications/failed', fn() => inertia('SuperAdmin/Tenants/PaymentFailed'))
    ->name('applications.failed');
// -------------------

// Default Dashboard (optional, central DB, verified users)
// -------------------
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard'); // This can be central DB dashboard if needed
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/auth.php';
