<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedTinyInteger('units')->default(3)->after('description');
            $table->string('schedule_day')->nullable()->after('units');
            $table->string('schedule_time')->nullable()->after('schedule_day');
            $table->string('room')->nullable()->after('schedule_time');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['units', 'schedule_day', 'schedule_time', 'room']);
        });
    }
};
