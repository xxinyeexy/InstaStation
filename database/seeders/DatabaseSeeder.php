<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Student;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Generate a random matric number
     */
    private function generateMatricNumber(): string
    {
        $prefix = fake()->randomElement(['TG', 'TP', 'CB', 'CD', 'TL']);
        $year = rand(20, 25);
        $serial = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        return "{$prefix}{$year}{$serial}";
    }

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call([
            StudentSeeder::class,
            StaffSeeder::class,
            FaqSeeder::class,
            ParcelSeeder::class,
            PaymentSeeder::class,
            ReportSeeder::class,
        ]);

        // Create users for each student to enable matric search
        $students = Student::all();
        foreach ($students as $student) {
            // Check if user already exists for this student
            $existingUser = User::where('email', $student->email)->first();
            if (!$existingUser) {
                User::factory()->create([
                    'name' => $student->student_name,
                    'email' => $student->email,
                    'type' => 'student',
                    'matric' => $student->matric,
                    'password' => $student->password,

                ]);
            }
        }

        // Create test user only if it doesn't exist
        $testUser = User::where('email', 'test@gmail.com')->first();
        if (!$testUser) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@gmail.com',
            ]);
        }
    }
}
