<?php

namespace App\Http\Controllers;

use App\Models\TenantApplication;
use App\Services\ChapaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TenantApplicationController extends Controller
{
    public function apply(Request $request, ChapaService $chapa)
    {
        $request->validate([
            'company_name' => 'required|string',
            'email' => 'required|email',
            'plan' => 'required|string',
        ]);



        // 2. Generate unique transaction ref
        $tx_ref = uniqid('tenant_');

        // 1. Save tenant application
        $application = TenantApplication::create([
            'company_name' => $request->company_name,
            'email' => $request->email,
            'plan' => $request->plan,
            'payment_status' => 'Pending',
            'transaction_id' => $tx_ref,
        ]);

        // 3. Determine amount dynamically
        $amount = $request->plan === 'pro' ? 1000 : 500;

        // 4. Use full callback URL from .env (important for Chapa)
        $callbackUrl = env('CHAPA_CALLBACK_URL', route('chapa.callback'));

        // 5. Initialize Chapa payment
        $payment = $chapa->initializePayment([
            'amount' => $amount,
            'currency' => 'ETB',
            'email' => $application->email,
            'first_name' => $application->company_name,
            'tx_ref' => $tx_ref,
            'callback_url' => $callbackUrl,
        ]);

        // Log response for debugging
        Log::info('Chapa payment response:', (array) $payment);

        if (!isset($payment['status']) || $payment['status'] !== 'success') {
            return response()->json([
                'error' => 'Payment initialization failed.'
            ], 400);
        }

        // 6. Store transaction ID
        $application->update(['transaction_id' => $tx_ref]);

        // ✅ Return Chapa checkout URL as JSON
        return response()->json([
            'checkout_url' => $payment['data']['checkout_url']
        ]);
    }
    public function chapaCallback(Request $request, ChapaService $chapa)
    {
        // Chapa sends trx_ref
        $tx_ref = $request->get('trx_ref');

        if (!$tx_ref) {
            Log::error('Chapa callback missing trx_ref/reference');
            return response('Missing trx_ref', 400);
        }

        $application = TenantApplication::where('transaction_id', $tx_ref)->first();

        if (!$application) {
            Log::error("Chapa callback: Application not found for tx_ref {$tx_ref}");
            return response('Application not found', 404);
        }

        // Verify payment with Chapa API
        $result = $chapa->verifyPayment($tx_ref);

        Log::info('Chapa verify response:', (array)$result);

        if (
            isset($result['status'], $result['data']['status'])
            && $result['status'] === 'success'
            && $result['data']['status'] === 'success'
        ) {
            $application->update(['payment_status' => 'Paid']); // ✅ correct way

            return redirect()->route('applications.success');
        }

        $application->update(['payment_status' => 'Failed']);
        return redirect()->route('applications.failed');
    }
}
