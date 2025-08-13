<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ParcelController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/register', [RegisteredUserController::class, 'create'])
    ->name('register');

Route::post('/register', [RegisteredUserController::class, 'store']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// Staff and Parcel routes - all under auth middleware
Route::middleware('auth')->group(function () {

    // Staff routes
    Route::get('/staff/parcel', [ParcelController::class, 'index'])
        ->name('staff.parcel');
    Route::patch('/staff/parcel/{id}/collect', [ParcelController::class, 'markAsCollected'])->name('staff.parcel.collect');
    Route::delete('/staff/parcel/{id}', [ParcelController::class, 'destroy']);
    Route::get('/staff/parcel/{id}/details', [ParcelController::class, 'getParcelDetails'])->name('staff.parcel.details');
    Route::put('/staff/parcel/{id}', [ParcelController::class, 'update'])->name('staff.parcel.update');

    // Student routes
    Route::get('/student/parcel', [StudentController::class, 'student'])
        ->name('student.parcel');
    Route::get('/student/parcel/{id}', [StudentController::class, 'viewParcel'])
        ->name('student.view-parcel');
    Route::get('/student/schedule/{id}', [StudentController::class, 'schedulePickup'])
        ->name('student.schedule-pickup');
    Route::get('/student/schedule/{id}/availability', [StudentController::class, 'timeSlotAvailability'])
        ->name('student.schedule-availability');
    Route::post('/student/schedule/{id}', [StudentController::class, 'storeSchedule'])
        ->name('student.store-schedule');

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
