<?php

namespace App\Http\Middleware;
// app/Http/Middleware/SwitchTenantDatabase.php

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class SwitchTenantDatabase
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // 🛑 Exit early if not logged in
        if (! $user || ! $user->tenant || ! $user->tenant->database) {
            return $next($request);
        }

        // ✅ Switch database
        config([
            'database.connections.Tenant.database' => $user->tenant->database,
        ]);

        DB::purge('Tenant');
        DB::reconnect('Tenant');

        return $next($request);
    }
}
