<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_name' => $this->faker->firstName() . ' ' . $this->faker->lastName(),
            'phone_no' => $this->faker->numerify('01#########'),
            'room_no' => $this->faker->randomElement(range('A', 'I')) .
                $this->faker->numberBetween(1, 3) . '-' .
                $this->faker->numberBetween(1, 8) .
                str_pad($this->faker->numberBetween(1, 4), 2, '0', STR_PAD_LEFT),
            'matric' => $this->faker->randomElement(['TG', 'TP', 'CB', 'CD', 'TL']) . rand(20, 25) .  str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT),
            'email' => strtolower($this->faker->firstName . '.' . $this->faker->lastName) . '@gmail.com',
            'password' => Hash::make('password'), // Always hash passwords
            'profile_pic' => null,
            'status' => $this->faker->randomElement(['Active', 'Inactive']),
            'remember_token' => Str::random(10),
            'reset_password_token' => null,

        ];
    }
}
