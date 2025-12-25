<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    // List all subscription plans
    public function index()
    {
        $plans = SubscriptionPlan::all();

        return Inertia::render('SuperAdmin/SubscriptionPlans/Index', [
            'plans' => $plans,
        ]);
    }

    // Show create form
    public function create()
    {
        return Inertia::render('SuperAdmin/SubscriptionPlans/Create');
    }

    // Store new plan
    public function store(Request $request)
    {
        $request->validate([
            'planId' => 'required|string|unique:subscription_plans,planId',
            'name' => 'required|string',
            'price' => 'required|numeric|min:0',
            'features' => 'required|string',
            'durationDays' => 'required|integer|min:1',
        ]);

        SubscriptionPlan::create($request->all());

        return redirect()->route('subscription-plans.index')
            ->with('success', 'Subscription plan created successfully.');
    }
}
