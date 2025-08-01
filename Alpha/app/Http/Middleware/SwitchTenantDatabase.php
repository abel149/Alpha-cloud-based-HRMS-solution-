<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SwitchTenantDatabase
{
    public function handle(Request $request, Closure $next)
    {
        // Make sure the user is logged in first
        $user = Auth::user();

        if ($user && $user->tenant && $user->tenant->database) {
            config([
                'database.connections.tenant.database' => $user->tenant->database,
            ]);

            DB::purge('tenant');
            DB::reconnect('tenant');
        }

        return $next($request);
    }
}
