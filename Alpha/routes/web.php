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
use App\Http\Controllers\SubscriptionPlanController;
use App\Controllers\SuperAdmin\SuperAdminUserController;

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

        $users = DB::connection('Tenant')->table('users')->get();

        return Inertia::render('Tenant/Dashboard', [
            'users' => $users,
            'tenant_db' => DB::connection('Tenant')->getDatabaseName(),
        ]);
    })->name('tenant.dashboard');
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
    return inertia('Apply');
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
Route::middleware(['auth'])->prefix('superadmin')->name('subscription-plans.')->group(function () {
    Route::get('/plans', [SubscriptionPlanController::class, 'index'])->name('index');
    Route::get('/plans/create', [SubscriptionPlanController::class, 'create'])->name('create');
    Route::post('/plans', [SubscriptionPlanController::class, 'store'])->name('store');
});
//subscription
Route::post('/subscription-plans', [TenantController::class, 'storeSubscriptionPlan'])
    ->name('subscription-plans.store')
    ->middleware(['auth']); // only accessible to logged-in Super Admin
//create user 
Route::post('/users', [TenantController::class, 'storeuser'])
    ->name('users.store')
    ->middleware(['auth']); // only accessible to logged-in Super Admin

// Default Dashboard (optional, central DB, verified users)
// -------------------
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard'); // This can be central DB dashboard if needed
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/auth.php';
