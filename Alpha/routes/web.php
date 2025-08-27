<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Middleware\SwitchTenantDatabase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;


Route::middleware(['auth', SwitchTenantDatabase::class])->group(function () {
    Route::get('/dashboard', function () {
        return 'Welcome to your tenant dashboard!';
    });

    // More tenant-specific routes here
});

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;


Route::middleware(['auth', SwitchTenantDatabase::class])->get('/tenant-users-json', function () {
    // Query the users table in the tenant database
    $users = DB::connection('Tenant')->table('users')->get();

    return response()->json([
        'tenant_id' => Auth::user()->tenant_id,
        'connected_db' => DB::connection('Tenant')->getDatabaseName(),
        'users' => $users,
    ]);
});


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
