<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ChapaService
{
    protected $baseUrl;
    protected $secretKey;

    public function __construct()
    {
        $this->baseUrl = config('services.chapa.base_url', 'https://api.chapa.co/v1');
        $this->secretKey = env('CHAPA_SECRET_KEY');
    }

    public function initializePayment(array $data)
    {
        return Http::withToken($this->secretKey)
            ->post($this->baseUrl . '/transaction/initialize', $data)
            ->json();
    }

    public function verifyPayment($tx_ref)
    {
        return Http::withToken($this->secretKey)
            ->get($this->baseUrl . '/transaction/verify/' . $tx_ref)
            ->json();
    }
}
