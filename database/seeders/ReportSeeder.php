<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Report;
use App\Models\Parcel;
use App\Models\User;

class ReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         $students = User::where('type', 'student')->get();
        $parcels = Parcel::all();

        if ($students->count() === 0 || $parcels->count() === 0) {
            $this->command->warn('⚠️ Skipping ReportSeeder: No students or parcels available.');
            return;
        }

        Report::factory()->count(10)->make()->each(function ($report) use ($students, $parcels) {
            $report->student_id = $students->random()->id;
            $report->parcel_id = $parcels->random()->parcel_id;
            $report->save();
        });
    }
}
