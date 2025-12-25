<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureFinanceManager
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check() || !in_array(Auth::user()->role, ['finance_manager', 'company_admin', 'Super_admin'])) {
            abort(403, 'Unauthorized. Finance access required.');
        }

        return $next($request);
    }
}
