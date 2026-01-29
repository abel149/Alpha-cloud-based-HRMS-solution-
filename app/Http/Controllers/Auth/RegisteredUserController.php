<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string',
            'tenant_id' => 'nullable|exists:tenants,id', // nullable for Super Admin
        ]);

        // Step 1: Create user in central DB
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'tenant_id' => $request->role !== 'Super_admin' ? $request->tenant_id : null,
        ]);

        // Step 2: Only create in tenant DB if not Super Admin
        if ($request->role !== 'Super_admin') {
            $tenant = Tenant::find($request->tenant_id);
            if (!$tenant) {
                return redirect()->back()->withErrors(['tenant_id' => 'Invalid tenant ID.']);
            }

            // Switch to tenant DB
            config([
                'database.connections.Tenant.database' => $tenant->database,
            ]);
            DB::purge('Tenant');
            DB::reconnect('Tenant');

            // Step 3: Create user in tenant DB
            DB::connection('Tenant')->table('users')->insert([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Step 4: Event & redirect
        event(new Registered($user));

        return redirect()->to('/?modal=login');
    }
}
