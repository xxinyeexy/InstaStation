<?php

namespace App\Jobs;

use App\Models\Parcel;
use App\Models\Notification as DBNotification;
use App\Notifications\ParcelReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendParcelReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Parcel $parcel;

    /**
     * Create a new job instance.
     */
    public function __construct(Parcel $parcel)
    {
        $this->parcel = $parcel;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        try {
            $student = $this->parcel->studentUser;
            if (!$student || empty($student->email)) {
                Log::info('ParcelReminder: skipping parcel without student email', ['parcel_id' => $this->parcel->parcel_id]);
                return;
            }

            // Prevent duplicate reminders: if a recent notification for the same parcel exists, skip
            $recent = DBNotification::where('notifiable_id', $student->id)
                ->where('type', ParcelReminderNotification::class)
                ->where('created_at', '>=', now()->subMinutes(10))
                ->get();

            foreach ($recent as $r) {
                $data = json_decode($r->data, true);
                if (!empty($data['parcel_id']) && intval($data['parcel_id']) === intval($this->parcel->parcel_id)) {
                    Log::info('ParcelReminder: recent notification already exists, skipping', ['parcel_id' => $this->parcel->parcel_id, 'student_id' => $student->id]);
                    return;
                }
            }

            // Calculate reminder number
            $previousCount = DBNotification::where('notifiable_id', $student->id)
                ->where('type', ParcelReminderNotification::class)
                ->where('data->parcel_id', $this->parcel->parcel_id)
                ->count();
            
            $reminderNumber = $previousCount + 1;

            // Use Notification to send email (to keep it simple and centralized)
            $student->notify(new ParcelReminderNotification($this->parcel, $reminderNumber));
            // Update parcel to record reminder was sent (after notify)
            try {
                $this->parcel->reminder_sent_at = now();
                $this->parcel->save();
            } catch (\Exception $e) {
                Log::warning('Failed to update reminder_sent_at for parcel', ['parcel_id' => $this->parcel->parcel_id, 'error' => $e->getMessage()]);
            }

            Log::info('ParcelReminder: notification dispatched', ['parcel_id' => $this->parcel->parcel_id, 'student_id' => $student->id]);
        } catch (\Exception $e) {
            Log::error('ParcelReminder job failed: ' . $e->getMessage(), ['parcel_id' => $this->parcel->parcel_id]);
        }
    }
}
