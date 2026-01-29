<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Notifications\PasswordChangedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        try {
            $request->user()->notify(new PasswordChangedNotification(
                ipAddress: $request->ip(),
                userAgent: $request->userAgent(),
            ));
        } catch (\Throwable $e) {
            Log::error('Failed to send password changed email', [
                'user_id' => $request->user()->id,
                'email' => $request->user()->email,
                'message' => $e->getMessage(),
            ]);
        }

        return back();
    }
}
