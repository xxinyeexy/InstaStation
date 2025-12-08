import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, Calendar, CircleCheck, Clock, MapPin, X } from 'lucide-react';
import { useState } from 'react';

interface ParcelData {
    id: number;
    parcel_code: string;
    tracking_no: string;
    status: string;
    collection_code: string;
    sender: string;
    payment_status: string;
    student_user: {
        id: number;
        name: string;
        matric: string;
        email: string;
    } | null;
}

interface Props {
    parcel: ParcelData;
}

const SchedulePickup = ({ parcel }: Props) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slotAvailability, setSlotAvailability] = useState<Record<string, { count: number; full: boolean; recommended: boolean }>>({});
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleClose = () => {
        router.visit('/student/parcel');
    };

    const handleSchedule = async () => {
        if (!selectedDate || !selectedTimeSlot) {
            setErrorMessage('Please select both date and time slot for collection');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 5000);
            return;
        }

        setIsSubmitting(true);

        try {
            // Get CSRF token from meta tag
            const getCsrfToken = () => {
                const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (metaToken) return metaToken;

                // Fallback: try to get from cookie
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'XSRF-TOKEN') {
                        return decodeURIComponent(value);
                    }
                }

                // Last resort: check if it's in the page
                return document.head.querySelector('[name="csrf-token"]')?.getAttribute('content') || '';
            };

            const csrfToken = getCsrfToken();
            console.log('CSRF Token found:', csrfToken ? 'Yes' : 'No');

            if (!csrfToken) {
                setErrorMessage('Session expired. Please refresh the page and try again.');
                setShowErrorToast(true);
                setTimeout(() => setShowErrorToast(false), 5000);
                return;
            }

            // Convert selected date and time to a proper datetime string
            const selectedTimeSlotData = timeSlots.find((slot) => slot.id === selectedTimeSlot);
            if (!selectedTimeSlotData) {
                throw new Error('Invalid time slot selected');
            }

            // Parse the time slot to get start time (e.g., "9:00 AM - 10:00 AM" -> "09:00")
            const timeMatch = selectedTimeSlotData.label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
            if (!timeMatch) {
                throw new Error('Invalid time format');
            }

            let hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const period = timeMatch[3];

            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            } else if (period === 'AM' && hour === 12) {
                hour = 0;
            }

            // Validate hour and minute
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new Error('Invalid time values');
            }

            // Create the scheduled datetime
            const scheduledDate = new Date(selectedDate);
            scheduledDate.setHours(hour, minute, 0, 0);

            // Ensure we're working with the correct timezone
            const localScheduledDate = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000);

            // Debug logging
            console.log('Selected date:', selectedDate);
            console.log('Selected time slot:', selectedTimeSlotData);
            console.log('Parsed hour:', hour, 'minute:', minute, 'period:', period);
            console.log('Final scheduled date:', scheduledDate);
            console.log('Local scheduled date:', localScheduledDate);
            console.log('ISO string:', localScheduledDate.toISOString());

            // Prepare the request data
            const requestData = {
                parcel_id: parcel.id,
                scheduled_datetime: localScheduledDate.toISOString(),
                time_slot: selectedTimeSlotData.label, // Store the complete time slot range
            };

            console.log('Scheduling pickup with data:', requestData);

            const response = await fetch(`/student/schedule/${parcel.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(requestData),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    console.log('Error response:', errorData);

                    // Handle CSRF token mismatch specifically
                    if (response.status === 419 || (errorData.message && errorData.message.includes('CSRF'))) {
                        errorMessage = 'Your session has expired. Please refresh the page and try again.';
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.errors) {
                        const validationErrors = Object.entries(errorData.errors)
                            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('\n');
                        errorMessage = `Validation errors:\n${validationErrors}`;
                    }
                } catch (parseError) {
                    console.log('Could not parse error response as JSON');
                    const errorText = await response.text();
                    console.log('Error response text:', errorText);
                    errorMessage += `\n\nResponse: ${errorText}`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Success response:', result);

            // Show success toast notification
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 7000);

            // Navigate immediately with Inertia for smooth transition
            router.visit('/student/parcel', {
                only: ['parcels', 'notifications'],
                preserveState: false,
                preserveScroll: false,
            });
        } catch (error) {
            console.error('Scheduling error:', error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate calendar days
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Add empty days for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    const isWeekday = (date: Date) => {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return selectedDate && date.toDateString() === selectedDate.toDateString();
    };

    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const fetchAvailability = async (date: Date) => {
        try {
            setIsLoadingSlots(true);
            // Use LOCAL date (not UTC) to avoid off-by-one day issues
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const res = await fetch(`/student/schedule/${parcel.id}/availability?date=${encodeURIComponent(dateStr)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`Failed to load availability (${res.status})`);
            const data = await res.json();
            const map: Record<string, { count: number; full: boolean; recommended: boolean }> = {};
            for (const s of data.slots) {
                map[s.label] = { count: s.count, full: s.full, recommended: s.recommended };
            }
            setSlotAvailability(map);
        } catch (e) {
            console.error('Failed to fetch availability', e);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateClick = (date: Date) => {
        if (!isPastDate(date)) {
            setSelectedDate(date);
            setSelectedTimeSlot(''); // Reset time slot when date changes
            fetchAvailability(date);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    // Get time slots based on selected date (weekday vs weekend)
    const getTimeSlots = () => {
        if (!selectedDate) {
            // Default to weekday slots if no date selected
            return [
                { id: '13:00-14:00', label: '1:00 PM - 2:00 PM', available: true },
                { id: '14:00-15:00', label: '2:00 PM - 3:00 PM', available: true },
                { id: '15:00-16:00', label: '3:00 PM - 4:00 PM', available: true },
                { id: '16:00-17:00', label: '4:00 PM - 5:00 PM', available: true },
                { id: '17:00-18:00', label: '5:00 PM - 6:00 PM', available: true },
                { id: '21:00-22:00', label: '9:00 PM - 10:00 PM', available: true },
                { id: '22:00-23:00', label: '10:00 PM - 11:00 PM', available: true },
            ];
        }

        const isWeekendDate = isWeekend(selectedDate);

        if (isWeekendDate) {
            // Saturday & Sunday slots - must match backend exactly
            return [
                { id: '10:00-11:00', label: '10:00 AM - 11:00 AM', available: true },
                { id: '11:00-12:00', label: '11:00 AM - 12:00 PM', available: true },
                { id: '12:00-13:00', label: '12:00 PM - 1:00 PM', available: true },
                { id: '14:00-15:00', label: '2:00 PM - 3:00 PM', available: true },
                { id: '15:00-16:00', label: '3:00 PM - 4:00 PM', available: true },
                { id: '16:00-17:00', label: '4:00 PM - 5:00 PM', available: true },
            ];
        } else {
            // Monday - Friday slots - must match backend exactly
            return [
                { id: '13:00-14:00', label: '1:00 PM - 2:00 PM', available: true },
                { id: '14:00-15:00', label: '2:00 PM - 3:00 PM', available: true },
                { id: '15:00-16:00', label: '3:00 PM - 4:00 PM', available: true },
                { id: '16:00-17:00', label: '4:00 PM - 5:00 PM', available: true },
                { id: '17:00-18:00', label: '5:00 PM - 6:00 PM', available: true },
                { id: '21:00-22:00', label: '9:00 PM - 10:00 PM', available: true },
                { id: '22:00-23:00', label: '10:00 PM - 11:00 PM', available: true },
            ];
        }
    };

    const timeSlots = getTimeSlots();

    // Check if a time slot has passed for today
    const isTimeSlotPassed = (slotId: string, date: Date | null) => {
        if (!date) return false;

        const today = new Date();
        // If the selected date is not today, the slot hasn't passed
        if (date.toDateString() !== today.toDateString()) return false;

        // Parse the slot end time
        const endTimeMatch = slotId.match(/(\d{1,2}):(\d{2})$/);
        if (!endTimeMatch) return false;

        const endHour = parseInt(endTimeMatch[1]);
        const endMinute = parseInt(endTimeMatch[2]);

        // Create a date object for the slot end time today
        const slotEndTime = new Date(today);
        slotEndTime.setHours(endHour, endMinute, 0, 0);

        // If current time has passed the slot end time, it's too late
        return today >= slotEndTime;
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const breadcrumbs = [
        { title: 'My Parcel', href: '/student/parcel' },
        { title: 'Schedule Pickup', href: `/student/schedule/${parcel.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Pickup" />
            {/* Success Toast Notification */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 z-50 duration-300 animate-in fade-in slide-in-from-top-4">
                    <div className="max-w-96 min-w-80 rounded-lg border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-800 shadow-lg backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                <CircleCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold">Collection Scheduled Successfully!</h4>
                                <p className="mt-1 text-sm opacity-90">
                                    Your pickup has been scheduled for {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                                    at {timeSlots.find((slot) => slot.id === selectedTimeSlot)?.label}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSuccessToast(false)}
                                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast Notification */}
            {showErrorToast && (
                <div className="fixed top-4 right-4 z-50 duration-300 animate-in fade-in slide-in-from-top-4">
                    <div className="max-w-96 min-w-80 rounded-lg border border-red-200 bg-red-50/95 p-4 text-red-800 shadow-lg backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold">Scheduling Failed</h4>
                                <p className="mt-1 text-sm opacity-90">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => setShowErrorToast(false)}
                                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="mx-auto max-w-6xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Pickup - {parcel.parcel_code}</h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">Choose your preferred date and time for parcel collection</p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-6xl px-6 py-8">
                    {/* Parcel Status Section */}
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
                        <div className="mb-4 flex items-center gap-2">
                            <CircleCheck className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold text-green-800 dark:text-green-100">Approved</span>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <span className="text-sm text-green-700 dark:text-green-300">Tracking ID:</span>
                                <span className="ml-2 font-medium text-green-900 dark:text-green-100">{parcel.tracking_no}</span>
                            </div>
                            <div>
                                <span className="text-sm text-green-700 dark:text-green-300">Sender:</span>
                                <span className="ml-2 font-medium text-green-900 dark:text-green-100">{parcel.sender}</span>
                            </div>
                            <div>
                                <span className="text-sm text-green-700 dark:text-green-300">Payment Status:</span>
                                <span className="ml-2 rounded bg-green-200 px-2 py-1 font-medium text-green-900 dark:bg-green-800 dark:text-green-100">{parcel.payment_status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Collection Location Section */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            Collection Location
                        </h2>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">University Parcel Center</h3>
                            <p className="text-gray-600 dark:text-gray-400">Ground Floor, Student Services Building</p>
                            <div className="text-gray-600 dark:text-gray-400">
                                <p className="font-medium">Operating Hours:</p>
                                <p>Monday - Friday: 1:00 PM - 6:00 PM, 9:00 PM - 11:00 PM</p>
                                <p>Saturday & Sunday: 10:00 AM - 1:00 PM, 2:00 PM - 5:00 PM</p>
                            </div>
                        </div>
                    </div>

                    {/* Scheduling Section */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Select Date Card */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                Select Date
                            </h2>
                            <p className="mb-4 text-gray-600 dark:text-gray-400">Choose your preferred collection date</p>

                            {/* Calendar Header */}
                            <div className="mb-4 flex items-center justify-between">
                                <button onClick={() => navigateMonth('prev')} className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>
                                <button onClick={() => navigateMonth('next')} className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="mb-4 grid grid-cols-7 gap-1">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {day}
                                    </div>
                                ))}
                                {getDaysInMonth(currentMonth).map((date, index) => (
                                    <div key={index} className="text-center">
                                        {date ? (
                                            <button
                                                onClick={() => handleDateClick(date)}
                                                disabled={isPastDate(date)}
                                                className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${isSelected(date)
                                                    ? 'bg-blue-500 text-white'
                                                    : isToday(date)
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                        : isPastDate(date)
                                                            ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                                            : isWeekend(date)
                                                                ? 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20'
                                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                                    } `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        ) : (
                                            <div className="h-10 w-10"></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Notes */}
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-semibold">Operating Hours:</p>
                                <p>• Monday - Friday: 1 PM - 6 PM, 9 PM - 11 PM</p>
                                <p>• Saturday & Sunday: 10 AM - 1 PM, 2 PM - 5 PM</p>
                            </div>
                        </div>

                        {/* Select Time Slot Card */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Select Time Slot
                            </h2>
                            <p className="mb-4 text-gray-600 dark:text-gray-400">Choose your preferred collection time</p>

                            {/* Time Slots */}
                            <div className="mb-6 space-y-3">
                                {timeSlots.map((slot) => {
                                    const state = slotAvailability[slot.label];
                                    const currentCount = typeof state?.count === 'number' ? state.count : 0;
                                    const maxCapacity = 10;
                                    const isFull = state?.full === true || currentCount >= maxCapacity;
                                    // Show recommended for slots with less than 5 students (50% capacity)
                                    const isRecommended = !isFull && currentCount < 5;
                                    const hasPassed = isTimeSlotPassed(slot.id, selectedDate);
                                    const isAvailable = !isFull && !hasPassed;
                                    const isSelectedSlot = selectedTimeSlot === slot.id;

                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => isAvailable && setSelectedTimeSlot(slot.id)}
                                            disabled={!isAvailable || isLoadingSlots}
                                            className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${isAvailable
                                                ? isSelectedSlot
                                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/40'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700'
                                                : 'cursor-not-allowed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
                                                } `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                <span className={isAvailable ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}>{slot.label}</span>
                                                <span
                                                    className={`ml-2 text-xs font-medium ${isFull ? 'text-red-600' : currentCount >= 8 ? 'text-orange-600' : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    title={`${currentCount} students scheduled out of ${maxCapacity} maximum capacity`}
                                                >
                                                    {currentCount}/{maxCapacity} slots
                                                </span>
                                                {isRecommended && !hasPassed && (
                                                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            {isFull && <span className="text-sm font-medium text-red-500">Full</span>}
                                            {!isFull && hasPassed && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Passed</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Note Section */}
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                                <h4 className="mb-1 font-semibold text-yellow-900 dark:text-yellow-100">Note:</h4>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Please arrive within your selected time slot. Bring your QR code or collection code.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pickup Summary Section - Only show when both date and time are selected */}
                    {selectedDate && selectedTimeSlot && (
                        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
                            <h2 className="mb-4 text-xl font-semibold text-blue-900 dark:text-blue-100">Pickup Summary</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <span className="text-sm text-blue-700 dark:text-blue-300">Date:</span>
                                    <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                                        {selectedDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-blue-700 dark:text-blue-300">Time:</span>
                                    <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                                        {timeSlots.find((slot) => slot.id === selectedTimeSlot)?.label}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-blue-700 dark:text-blue-300">Location:</span>
                                    <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">University Parcel Center</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Buttons */}
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={handleClose}
                            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedule}
                            disabled={!selectedDate || !selectedTimeSlot || isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Scheduling...
                                </>
                            ) : (
                                'Schedule Pickup'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SchedulePickup;
