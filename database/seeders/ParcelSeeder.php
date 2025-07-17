<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Parcel;
use App\Models\Student;
use App\Models\Staff;

class ParcelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = Student::all();
        $staff = Staff::all();

        if ($students->count() === 0 || $staff->count() === 0) {
            $this->command->warn('⚠️ Skipping ParcelSeeder: No students or staff available.');
            return;
        }

        Parcel::factory()->count(10)->make()->each(function ($parcel) use ($students, $staff) {
            $parcel->student_id = $students->random()->student_id;
            $parcel->created_by = $staff->random()->staff_id;
            $parcel->last_edited_by = $staff->random()->staff_id;
            $parcel->save();
        });
    }
}
