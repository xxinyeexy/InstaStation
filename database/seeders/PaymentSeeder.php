<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\Parcel;
use App\Models\Staff;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         
        $parcels = Parcel::all();
        $staff = Staff::all();

        if ($parcels->count() === 0 || $staff->count() === 0) {
            $this->command->warn('⚠️ Skipping PaymentSeeder: No parcels or staff available.');
            return;
        }

        Payment::factory()->count(10)->make()->each(function ($payment) use ($parcels, $staff) {
            $payment->parcel_id = $parcels->random()->parcel_id;
            $payment->verified_by = $staff->random()->staff_id;
            $payment->save();
        });
    
    }
}
