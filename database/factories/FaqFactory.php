<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Faq>
 */
class FaqFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'faq_question' => Str::limit($this->faker->sentence(8), 100),
            'faq_answer' => $this->faker->paragraph(1),
            'category' => $this->faker->randomElement(['General', 'Delivery', 'Payment']),
            'faq_status' => $this->faker->randomElement(['Active', 'Inactive']),
        ];
    }
}
