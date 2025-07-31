<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Parcel;
use App\Models\Student;
use App\Models\Staff;
use App\Models\User;

class ParcelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = User::where('type', 'student')->get();
        $staff = User::where('type', 'staff')->get();

        if ($students->isEmpty() || $staff->isEmpty()) {
            $this->command->warn('⚠️ Skipping ParcelSeeder: No students or staff available.');
            return;
        }

        // Parcel::factory()
        //     ->count(10)
        //     ->make()
        //     ->each(function ($parcel) use ($students, $staff) {
        //         $parcel->student_id = $students->random()->id;
        //         $parcel->created_by = $staff->random()->id;
        //         $parcel->last_edited_by = $staff->random()->id;
        //         $parcel->save();
        // });
                Parcel::factory()->count(20)->create();

    }
}
