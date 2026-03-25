<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    protected $appends = ['letter_grade'];

    protected $fillable = [
        'enrollment_id',
        'grade',
        'remarks',
        'semester',
        'academic_year',
    ];

    protected function casts(): array
    {
        return [
            'grade' => 'decimal:2',
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function getLetterGradeAttribute(): string
    {
        if ($this->grade === null) return 'N/A';
        if ($this->grade >= 1.0 && $this->grade <= 1.25) return 'Excellent';
        if ($this->grade <= 1.50) return 'Very Good';
        if ($this->grade <= 1.75) return 'Good';
        if ($this->grade <= 2.00) return 'Very Satisfactory';
        if ($this->grade <= 2.25) return 'Satisfactory';
        if ($this->grade <= 2.50) return 'Fairly Satisfactory';
        if ($this->grade <= 2.75) return 'Fair';
        if ($this->grade <= 3.00) return 'Passed';
        return 'Failed';
    }
}
