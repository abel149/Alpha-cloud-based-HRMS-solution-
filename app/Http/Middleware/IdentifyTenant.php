<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */

    public function handle($request, Closure $next)
    {
        $host = $request->getHost(); // e.g. company1.test

        $tenant = Tenant::where('domain', $host)->first();

        if (!$tenant) {
            abort(404, "Tenant not found");
        }

        config(['database.connections.Tenant.database' => $tenant->database]);
        DB::setDefaultConnection('Tenant');

        return $next($request);
    }
}
