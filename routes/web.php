<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Announcement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ParcelController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClaimController;

Route::get('/linkstorage', function () {
    Artisan::call('storage:link'); 
});

Route::get('/', function () {
    $now = now();

    $announcements = Announcement::query()
        ->where('announcement_status', 'Published')
        ->where(function ($q) use ($now) {
            $q->whereNull('publish_date')
                ->orWhere('publish_date', '<=', $now);
        })
        ->where(function ($q) use ($now) {
            $q->whereNull('expiry_date')
                ->orWhere('expiry_date', '>', $now);
        })
        ->orderByDesc(DB::raw('COALESCE(publish_date, created_at)'))
        ->get([
            'announcement_id',
            'announcement_title',
            'announcement_content',
            'announcement_image',
            'announcement_type',
            'publish_date',
            'created_at',
        ]);

    return Inertia::render('welcome', [
        'announcements' => $announcements,
    ]);
})->name('home');

// Public: Unclaimed parcels and claim start
Route::get('/unclaimed', [ClaimController::class, 'unclaimed'])->name('public.unclaimed');
Route::post('/claim/start', [ClaimController::class, 'start'])->name('claim.start');
Route::get('/claim/consume', [ClaimController::class, 'consume'])->name('claim.consume');
Route::post('/claim/search', [ClaimController::class, 'search'])->name('claim.search');

Route::get('/register', [RegisteredUserController::class, 'create'])
    ->name('register');

Route::post('/register', [RegisteredUserController::class, 'store']);



// Staff and Parcel routes - require authenticated and verified users
Route::middleware(['auth', 'verified'])->group(function () {
    // Redirect /dashboard to appropriate page based on user type
    Route::get('dashboard', function () {
        $user = \Illuminate\Support\Facades\Auth::user();
        if ($user && $user->type === 'staff') {
            return redirect()->route('staff.dashboard');
        }
        return redirect()->route('student.parcel');
    })->name('dashboard');
    // Export routes: preview (HTML) and download (PDF)
    Route::get('/parcels/{id}/export', [ParcelController::class, 'export'])->name('parcels.export');
    Route::get('/parcels/{id}/export/download', [ParcelController::class, 'exportDownload'])->name('parcels.export.download');

    // Staff routes
    Route::get('/staff/dashboard', [StaffController::class, 'dashboard'])
        ->name('staff.dashboard');

    Route::get('/staff/parcel', [ParcelController::class, 'index'])
        ->name('staff.parcel');
    // Bulk export of parcels with filters
    Route::get('/staff/parcels/export/bulk', [ParcelController::class, 'exportBulk'])
        ->name('staff.parcels.export.bulk');
    // Send reminders to students for uncollected parcels (AJAX)
    Route::post('/staff/parcels/remind', [ParcelController::class, 'remind'])->name('staff.parcels.remind');
    // Cleanup old collection records (3+ months)
    Route::post('/staff/parcels/cleanup-old', [ParcelController::class, 'cleanupOldRecords'])->name('staff.parcels.cleanup-old');
    Route::patch('/staff/parcel/{id}/collect', [ParcelController::class, 'markAsCollected'])->name('staff.parcel.collect');
    Route::delete('/staff/parcel/{id}', [ParcelController::class, 'destroy']);
    Route::get('/staff/parcel/{id}/details', [ParcelController::class, 'getParcelDetails'])->name('staff.parcel.details');
    Route::put('/staff/parcel/{id}', [ParcelController::class, 'update'])->name('staff.parcel.update');
    Route::get('/staff/parcel/by-code/{code}', [ParcelController::class, 'getParcelByCode'])
        ->where('code', '.*')
        ->name('staff.parcel.by-code');

    // Student routes
    Route::get('/student/parcel', [StudentController::class, 'student'])
        ->name('student.parcel');
    Route::get('/student/payment', [PaymentController::class, 'index'])
        ->name('student.payment');
    Route::get('/student/payment/history', [PaymentController::class, 'history'])
        ->name('student.payment.history');
    Route::get('/student/payment/submit/{id}', [PaymentController::class, 'showSubmit'])
        ->name('student.payment.submit');
    Route::post('/student/payment/submit/{id}', [PaymentController::class, 'storeStudentPayment'])
        ->name('student.payment.submit.store');
    Route::post('/student/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead'])
        ->name('student.notifications.mark-read');
    Route::get('/student/history', [ParcelController::class, 'history'])->name('student.history');
    // Staff: Verify Payments page
    Route::get('/staff/payments', [PaymentController::class, 'staffIndex'])
        ->name('staff.payments');
    Route::post('/staff/payments/{id}/approve', [PaymentController::class, 'approvePayment'])
        ->name('staff.payments.approve');
    Route::post('/staff/payments/{id}/reject', [PaymentController::class, 'rejectPayment'])
        ->name('staff.payments.reject');
    Route::get('/student/parcel/{id}', [StudentController::class, 'viewParcel'])
        ->name('student.view-parcel');
    Route::get('/student/schedule/{id}', [StudentController::class, 'schedulePickup'])
        ->name('student.schedule-pickup');
    Route::get('/student/schedule/{id}/availability', [StudentController::class, 'timeSlotAvailability'])
        ->name('student.schedule-availability');
    Route::post('/student/schedule/{id}', [StudentController::class, 'storeSchedule'])
        ->name('student.store-schedule');
    Route::get('/student/parcel/{id}/qr-code', [StudentController::class, 'generateQRCode'])
        ->name('student.qr-code');
    Route::get('/student/test-qr-code', [StudentController::class, 'testQRCode'])
        ->name('student.test-qr-code');
    Route::get('/staff/announcements', [AnnouncementController::class, 'index'])->name('staff.announcements');
    Route::post('/staff/announcements', [AnnouncementController::class, 'store'])->name('staff.announcements.store');
    Route::put('/staff/announcements/{announcement}', [AnnouncementController::class, 'update'])->name('staff.announcements.update');
    Route::delete('/staff/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('staff.announcements.destroy');
    Route::post('/staff/announcements/{announcement}/publish', [AnnouncementController::class, 'publish'])->name('staff.announcements.publish');
    Route::post('/staff/announcements/{announcement}/unpublish', [AnnouncementController::class, 'unpublish'])->name('staff.announcements.unpublish');
    Route::get('/student/faq', [FaqController::class, 'studentIndex'])
        ->name('student.faq');

    // Staff: Manage Users
    Route::get('/staff/manage-user', [StaffController::class, 'manageUsers'])
        ->name('staff.manage-user');

    // Staff: Manage FAQs
    Route::get('/staff/manage-faq', [FaqController::class, 'index'])->name('staff.manage-faq');
    Route::post('/staff/faq', [FaqController::class, 'store'])->name('staff.faq.store');
    Route::put('/staff/faq/{faq}', [FaqController::class, 'update'])->name('staff.faq.update');
    Route::delete('/staff/faq/{faq}', [FaqController::class, 'destroy'])->name('staff.faq.destroy');
    Route::post('/staff/faq/{faq}/publish', [FaqController::class, 'publish'])->name('staff.faq.publish');
    Route::post('/staff/faq/{faq}/unpublish', [FaqController::class, 'unpublish'])->name('staff.faq.unpublish');

    // Parcel routes
    Route::resource('parcels', ParcelController::class);
    Route::get('/staff/add-parcel', [ParcelController::class, 'create'])
        ->name('parcel.create');

    // API routes for AJAX calls
    Route::get('/api/students/search', [ParcelController::class, 'searchStudents'])
        ->name('students.search');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
