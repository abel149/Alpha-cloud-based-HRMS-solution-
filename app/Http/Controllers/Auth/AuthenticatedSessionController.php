<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user(); // Logged-in user from central DB
        
        if (!$user) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'email' => 'Authentication failed. Please try again.',
            ]);
        }
        
        // Super Admin - redirect to tenant management
        if ($user->role === 'Super_admin') {
            return redirect()->route('tenants.index');
        }
        
        // Company Admin - redirect to company admin dashboard
        if ($user->role === 'company_admin') {
            if (!$user->tenant_id) {
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'email' => 'Your account is not assigned to a tenant. Please contact the administrator.',
                ]);
            }
            session(['tenant_id' => $user->tenant_id]);
            return redirect()->route('company-admin.dashboard');
        }
        
        // Other tenant users - redirect to tenant dashboard
        if ($user->tenant_id) {
            session(['tenant_id' => $user->tenant_id]);
            return redirect()->route('tenant.dashboard');
        }
        
        // No valid tenant - logout and show error
        Auth::logout();
        return redirect()->route('login')->withErrors([
            'email' => 'Your account is not properly configured. Please contact the administrator.',
        ]);
    }
    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
