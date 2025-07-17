<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Staff>
 */
class StaffFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'staff_name' => $this->faker->name(),
            'phone_no' => $this->faker->numerify('01#########'),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'profile_pic' => null,
            'department' => $this->faker->optional()->word(),
            'user_type' => $this->faker->randomElement(['Standard', 'Admin']),
            'status' => $this->faker->randomElement(['Active', 'Inactive']),
            'remember_token' => Str::random(10),
            'reset_password_token' => null,
        ];
    }
}
