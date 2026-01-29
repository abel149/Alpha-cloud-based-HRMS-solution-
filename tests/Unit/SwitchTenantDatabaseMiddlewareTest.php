<?php

namespace Tests\Unit;

use App\Http\Middleware\SwitchTenantDatabase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class SwitchTenantDatabaseMiddlewareTest extends TestCase
{
    public function test_bypasses_for_super_admin(): void
    {
        $middleware = new SwitchTenantDatabase();

        $user = (object) [
            'role' => 'Super_admin',
        ];

        Auth::shouldReceive('user')->once()->andReturn($user);
        DB::shouldReceive('purge')->never();
        DB::shouldReceive('reconnect')->never();

        config(['database.connections.Tenant.database' => 'initial']);

        $called = false;
        $request = Request::create('/test', 'GET');
        $response = $middleware->handle($request, function () use (&$called) {
            $called = true;

            return new Response('ok', 200);
        });

        $this->assertTrue($called);
        $this->assertSame('initial', config('database.connections.Tenant.database'));
        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_exits_early_when_user_has_no_tenant_or_database(): void
    {
        $middleware = new SwitchTenantDatabase();

        $user = (object) [
            'role' => 'employee',
            'tenant' => null,
        ];

        Auth::shouldReceive('user')->once()->andReturn($user);
        DB::shouldReceive('purge')->never();
        DB::shouldReceive('reconnect')->never();

        config(['database.connections.Tenant.database' => 'initial']);

        $called = false;
        $request = Request::create('/test', 'GET');
        $response = $middleware->handle($request, function () use (&$called) {
            $called = true;

            return new Response('ok', 200);
        });

        $this->assertTrue($called);
        $this->assertSame('initial', config('database.connections.Tenant.database'));
        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_switches_tenant_database_and_reconnects(): void
    {
        $middleware = new SwitchTenantDatabase();

        $tenant = (object) [
            'database' => 'tenant_db',
        ];

        $user = (object) [
            'id' => 123,
            'tenant_id' => 99,
            'role' => 'employee',
            'tenant' => $tenant,
        ];

        Auth::shouldReceive('user')->once()->andReturn($user);
        DB::shouldReceive('purge')->with('Tenant')->once();
        DB::shouldReceive('reconnect')->with('Tenant')->once();

        config(['database.connections.Tenant.database' => 'initial']);

        $called = false;
        $request = Request::create('/test', 'GET');
        $response = $middleware->handle($request, function () use (&$called) {
            $called = true;

            return new Response('ok', 200);
        });

        $this->assertTrue($called);
        $this->assertSame('tenant_db', config('database.connections.Tenant.database'));
        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_logs_out_and_redirects_when_reconnect_throws(): void
    {
        $middleware = new SwitchTenantDatabase();

        $tenant = (object) [
            'database' => 'tenant_db',
        ];

        $user = (object) [
            'id' => 123,
            'tenant_id' => 99,
            'role' => 'employee',
            'tenant' => $tenant,
        ];

        Auth::shouldReceive('user')->once()->andReturn($user);
        Auth::shouldReceive('logout')->once();
        DB::shouldReceive('purge')->with('Tenant')->once();
        DB::shouldReceive('reconnect')->with('Tenant')->once()->andThrow(new \Exception('fail'));

        $request = Request::create('/test', 'GET');
        $response = $middleware->handle($request, function () {
            return new Response('ok', 200);
        });

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame(url('/?modal=login'), $response->getTargetUrl());
    }
}
