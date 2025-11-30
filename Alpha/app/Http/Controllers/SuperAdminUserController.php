<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\TenantApplication;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Inertia\Inertia;

class SuperAdminUserController extends Controller
{
    public function index()
    {
        $tenants = Tenant::all();
        $paidApplications = TenantApplication::where('payment_status', 'Paid')->get();
        $subscriptionPlans = SubscriptionPlan::all();
        $users = User::whereNull('tenant_id')->get(); // Only platform-level users

        return Inertia::render('SuperAdmin/SubscriptionPlans/Index', [
            'tenants' => $tenants,
            'paidApplications' => $paidApplications,
            'subscriptionPlans' => [
                'plans' => $subscriptionPlans,
                'users' => $users,
            ],
        ]);
    }
    // Show create form
    public function create()
    {
        return Inertia::render('SuperAdmin/SubscriptionPlans/Create');
    }
}
