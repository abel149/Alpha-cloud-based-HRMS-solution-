<?php

namespace App\Http\Middleware;
// app/Http/Middleware/SwitchTenantDatabase.php

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class SwitchTenantDatabase
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        if ($user && $user->role === 'Super_admin') {
            return $next($request);
        }
        // 🛑 Exit early if not logged in
        if (! $user || ! $user->tenant || ! $user->tenant->database) {
            return $next($request);
        }

        try {
            // ✅ Switch database
            config([
                'database.connections.Tenant.database' => $user->tenant->database,
            ]);

            DB::purge('Tenant');
            DB::reconnect('Tenant');
        } catch (\Throwable $e) {
            Log::error('Failed to connect to tenant database', [
                'user_id' => optional($user)->id,
                'tenant_id' => optional($user)->tenant_id,
                'tenant_database' => optional(optional($user)->tenant)->database,
                'message' => $e->getMessage(),
            ]);

            Auth::logout();
            return redirect()->to('/?modal=login')->withErrors([
                'email' => 'Cannot connect to the tenant database. Please contact the administrator.',
            ]);
        }

        return $next($request);
    }
}
