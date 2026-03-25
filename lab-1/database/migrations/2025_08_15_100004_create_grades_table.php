<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade');
            $table->decimal('grade', 3, 2)->nullable();
            $table->string('remarks')->nullable();
            $table->string('semester')->default('1st');
            $table->string('academic_year')->default('2025-2026');
            $table->timestamps();

            $table->unique(['enrollment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
