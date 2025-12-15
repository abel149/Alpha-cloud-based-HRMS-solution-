<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Store tenant ID in session
        $user = Auth::user();
        if ($user->role === 'Super_admin') {
            // Super admin goes to central dashboard / tenant management page
            return redirect()->route('tenants.index');
        }
        session(['tenant_id' => $user->tenant_id, 'role' => $user->role,]);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'tenant_id' => ['required', 'string', 'exists:tenants,database'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        // Get tenant by database
        $tenant = \App\Models\Tenant::where('database', $this->tenant_id)->first();
        
        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => 'Invalid tenant selected.',
            ]);
        }

        // Find user by email in central database
        $user = \App\Models\User::where('email', $this->email)->first();

        if (! $user || ! Auth::attempt(
            ['email' => $this->email, 'password' => $this->password],
            $this->boolean('remember')
        )) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Check if user belongs to selected tenant
        if ($user->tenant_id !== $tenant->id) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'This account does not belong to the selected tenant.',
            ]);
        }
    }
    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}
