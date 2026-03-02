<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Money/Investing',
                'Design',
                'Business',
                'Self Improvement',
                'Technology',
                'Science',
                'History',
                'Fiction',
                'Philosophy',
                'Psychology',
            ]),
            'icon' => null,
        ];
    }
}
