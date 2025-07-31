<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed 10 students
        User::factory()
            ->count(10)
            ->create();

        // Seed 10 staff members
        User::factory()
            ->count(10)
            ->staff()
            ->create();
    }
}