<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Parcel>
 */
class ParcelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tracking_no' => $this->faker->unique()->regexify('[A-Z0-9]{10}'),
            'parcel_status' => $this->faker->randomElement(['Pending Payment', 'Approved', 'Ready To Collect', 'Collected']),
            'days' => $this->faker->numberBetween(0, 30),
            'sender' => $this->faker->randomElement(['Shopee', 'Lazada', 'Amazon']),
            'size' => $this->faker->randomElement(['Small', 'Medium', 'Large', 'Extra Large']),
            'location' => $this->faker->optional()->regexify('Shelf [A-Z]-\d{2}'),
            'qr_code' => $this->faker->optional()->uuid(),
            'schedule' => $this->faker->dateTimeBetween('now', '+3 days'),
            'report_at' => now(),
        ];
    }
}
