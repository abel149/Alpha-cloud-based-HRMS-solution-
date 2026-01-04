<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add fingerprint template storage and biometric authentication support
     */
    public function up(): void
    {
        if (!Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'fingerprint_template')) {
                $table->text('fingerprint_template')->nullable()->after('cv');
            }
            if (!Schema::hasColumn('employees', 'fingerprint_registered_at')) {
                $table->timestamp('fingerprint_registered_at')->nullable()->after('fingerprint_template');
            }
            if (!Schema::hasColumn('employees', 'webauthn_credentials')) {
                // Store WebAuthn credentials as JSON for biometric authentication
                $table->json('webauthn_credentials')->nullable()->after('fingerprint_registered_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'fingerprint_template')) {
                $table->dropColumn('fingerprint_template');
            }
            if (Schema::hasColumn('employees', 'fingerprint_registered_at')) {
                $table->dropColumn('fingerprint_registered_at');
            }
            if (Schema::hasColumn('employees', 'webauthn_credentials')) {
                $table->dropColumn('webauthn_credentials');
            }
        });
    }
};
