<?php



use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TenantController;

Route::get('/test-api', function () {
    return response()->json(['message' => 'API is working!']);
});
Route::post('/create-tenant', [TenantController::class, 'store']);
