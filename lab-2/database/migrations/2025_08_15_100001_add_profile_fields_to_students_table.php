<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('student_number')->unique()->nullable()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('address');
            $table->unsignedTinyInteger('year_level')->default(1)->after('date_of_birth');
            $table->string('program')->nullable()->after('year_level');
            $table->string('status')->default('ACTIVE')->after('program');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['student_number', 'phone', 'address', 'date_of_birth', 'year_level', 'program', 'status']);
        });
    }
};
