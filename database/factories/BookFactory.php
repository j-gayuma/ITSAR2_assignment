<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(rand(2, 5)),
            'author' => fake()->name(),
            'description' => fake()->paragraphs(3, true),
            'cover_image' => null,
            'published_at' => fake()->dateTimeBetween('-10 years', 'now'),
            'category_id' => Category::factory(),
            'is_available' => true,
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
