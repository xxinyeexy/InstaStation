<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\StaffController;
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
    Route::get('/staff/parcel', [StaffController::class, 'staff'])
        ->name('staff.parcel');
    
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