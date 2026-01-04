<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add visual confirmation requirement to attendance policies
     */
    public function up(): void
    {
        if (!Schema::hasTable('attendance_policies')) {
            return;
        }

        Schema::table('attendance_policies', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_policies', 'requires_visual_confirmation')) {
                $table->boolean('requires_visual_confirmation')->default(false)->after('requires_fingerprint');
            }
            if (!Schema::hasColumn('attendance_policies', 'visual_confirmation_message')) {
                $table->text('visual_confirmation_message')->nullable()->after('requires_visual_confirmation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendance_policies')) {
            Schema::table('attendance_policies', function (Blueprint $table) {
                if (Schema::hasColumn('attendance_policies', 'requires_visual_confirmation')) {
                    $table->dropColumn('requires_visual_confirmation');
                }
                if (Schema::hasColumn('attendance_policies', 'visual_confirmation_message')) {
                    $table->dropColumn('visual_confirmation_message');
                }
            });
        }
    }
};
