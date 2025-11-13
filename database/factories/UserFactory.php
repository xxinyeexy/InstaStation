<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'=> $this->faker->firstName() . ' ' . $this->faker->lastName(),
            'email' => strtolower(fake()->firstName() . '.' . fake()->lastName()) . '@gmail.com',
            'email_verified_at' => now(),
            'type' => 'student',
            'matric' => fake()->randomElement(['TG', 'TP', 'CB', 'CD', 'TL']) . rand(20, 25) . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT),
            'room_no' => $this->faker->randomElement(range('A', 'I')) .
                $this->faker->numberBetween(1, 3) . '-' .
                $this->faker->numberBetween(1, 8) .
                str_pad($this->faker->numberBetween(1, 4), 2, '0', STR_PAD_LEFT),
            'phone_no' => $this->faker->numerify('01#########'),
            'profile_pic' => null,
            'status' => $this->faker->randomElement(['Active', 'Inactive']),
            'department' => null,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Define a staff state for the factory.
     */
    public function staff(): static
    {
        return $this->state(fn(array $attributes) => [
            'name' => $this->faker->firstName() . ' ' . $this->faker->lastName(),
            'email' => strtolower(fake()->firstName() . '.' . fake()->lastName()) . '@gmail.com',
            'email_verified_at' => now(),
            'type' => 'staff',
            'matric' => null,
            'room_no' => null,
            'phone_no' => $this->faker->numerify('01#########'),
            'profile_pic' => null,
            'status' => $this->faker->randomElement(['Active', 'Inactive']),
            'department' => fake()->randomElement([
               
                'Operations - General',
                'Operations - Admin'
            ]),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ]);
    }
}
