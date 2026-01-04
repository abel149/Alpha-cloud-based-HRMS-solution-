<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add visual confirmation storage for attendance verification
     */
    public function up(): void
    {
        if (!Schema::hasTable('attendance_logs')) {
            return;
        }

        Schema::table('attendance_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_logs', 'visual_confirmed_at')) {
                $table->timestamp('visual_confirmed_at')->nullable();
            }
            if (!Schema::hasColumn('attendance_logs', 'visual_confirmation_image')) {
                // Store base64 encoded image or file path
                $table->text('visual_confirmation_image')->nullable();
            }
            if (!Schema::hasColumn('attendance_logs', 'visual_confirmation_ip')) {
                $table->string('visual_confirmation_ip')->nullable();
            }
            if (!Schema::hasColumn('attendance_logs', 'visual_confirmed_by')) {
                $table->string('visual_confirmed_by')->nullable(); // 'self' or admin user ID
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendance_logs')) {
            Schema::table('attendance_logs', function (Blueprint $table) {
                if (Schema::hasColumn('attendance_logs', 'visual_confirmed_at')) {
                    $table->dropColumn('visual_confirmed_at');
                }
                if (Schema::hasColumn('attendance_logs', 'visual_confirmation_image')) {
                    $table->dropColumn('visual_confirmation_image');
                }
                if (Schema::hasColumn('attendance_logs', 'visual_confirmation_ip')) {
                    $table->dropColumn('visual_confirmation_ip');
                }
                if (Schema::hasColumn('attendance_logs', 'visual_confirmed_by')) {
                    $table->dropColumn('visual_confirmed_by');
                }
            });
        }
    }
};
