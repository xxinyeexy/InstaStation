<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

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
          $status = $this->faker->randomElement([
            'Pending Payment',
            'Approved',
            'Ready For Collection',
            'Collected',
            'Unclaimed'
        ]);

        // Random created_at date in the past
        $createdAt = $this->faker->dateTimeBetween('-30 days', 'now');

        // Calculate days from created_at
        $days = now()->diffInDays($createdAt);

        // If not unclaimed, assign student and schedule
        $isUnclaimed = $status === 'Unclaimed';
        $student = $isUnclaimed
            ? null
            : User::where('type', 'student')->inRandomOrder()->first()
                ?? User::factory()->create(['type' => 'student']);

        $staff = User::where('type', 'staff')->inRandomOrder()->first()
            ?? User::factory()->staff()->create();

        return [
            'tracking_no' => $this->faker->unique()->regexify('[A-Z0-9]{10}'),
            'parcel_status' => $status,
            'days' => $days,
            'sender' => $this->faker->randomElement([
                'SHOPEE', 'JNT', 'FLASH', 'NINJAVAN', 'POSLAJU',
                'GDEX', 'ABX', 'BEST', 'PGEON', 'DHL',
                'LAZADA', 'CITYLINK', 'LINECLEAR', 'POS Malaysia', 'SKYNET'
            ]),
            'size' => $this->faker->randomElement(['Small', 'Medium', 'Large', 'Extra Large']),
            'location' => $this->faker->regexify('Shelf [A-Z]-\d{2}'),
            'qr_code' => $this->faker->optional()->uuid(),
            'schedule' => $isUnclaimed ? null : $this->faker->dateTimeBetween('now', '+3 days'),
            'report_at' => now(),
            'student_id' => $student?->id,
            'created_by' => $staff->id,
            'last_edited_by' => $staff->id,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }
}
