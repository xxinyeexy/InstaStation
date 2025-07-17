<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payment' => $this->faker->optional()->word() . '.pdf',
            'file_path' => 'payments/' . $this->faker->uuid . '.pdf',
            'payment_date' => $this->faker->optional()->date()
        ];
    }
}
