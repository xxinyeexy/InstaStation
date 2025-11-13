import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { AlarmClock, ArrowLeft, CheckCircle, CircleAlert, CreditCard, Package, User } from 'lucide-react';
import { type BreadcrumbItem, type SharedData } from '@/types';

// TypeScript interfaces
interface ParcelData {
    id: number;
    parcel_code: string;
    tracking_no: string;
    status: string;
    arrivalDate: string;
    paymentStatus: string;
    size: string;
    sender: string;
    location: string;
    days: number;
    schedule?: string;
    time_slot?: string;
    created_at: string;
    updated_at: string;
    student_user?: {
        id: number;
        name: string;
        matric: string;
        email: string;
    };
    created_by?: {
        id: number;
        name: string;
        email: string;
    };
    last_edited_by?: {
        id: number;
        name: string;
        email: string;
    };
}

interface TrackingEvent {
    id: number;
    title: string;
    description: string;
    attribution: string | null;
    timestamp: string;
    hasAttribution: boolean;
    icon: string;
    iconColor: string;
}

interface Props {
    parcel: ParcelData;
    trackingHistory: TrackingEvent[];
    payment_proof_url?: string | null;
}

const ParcelDetails = ({ parcel, trackingHistory, payment_proof_url }: Props) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Parcel', href: '/student/parcel' },
        { title: 'View Parcel Details', href: `/student/parcel/${parcel.id}` },
    ];
    // Function to render icon based on icon name and color
    const renderIcon = (iconName: string, color: string) => {
        const getIconClass = (color: string) => {
            switch (color) {
                case 'blue':
                    return 'h-5 w-5 text-blue-500';
                case 'orange':
                    return 'h-5 w-5 text-orange-500';
                case 'green':
                    return 'h-5 w-5 text-green-500';
                case 'red':
                    return 'h-5 w-5 text-red-500';
                default:
                    return 'h-5 w-5 text-gray-500';
            }
        };

        const iconClass = getIconClass(color);

        switch (iconName) {
            case 'package':
                return <Package className={iconClass} />;
            case 'clock':
                return <CircleAlert className={iconClass} />;
            case 'credit-card':
                return <CreditCard className={iconClass} />;
            case 'check-circle':
                return <CheckCircle className={iconClass} />;
            default:
                return <Package className={iconClass} />;
        }
    };

    // Function to get status badge color
    const getStatusBadgeColor = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'pending payment':
                return 'bg-orange-100 text-orange-800';
            case 'ready for collection':
                return 'bg-green-100 text-green-800';
            case 'collected':
                return 'bg-blue-100 text-blue-800';
            case 'unclaimed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Function to get payment status badge color
    const getPaymentStatusBadgeColor = (paymentStatus: string) => {
        switch (paymentStatus.toLowerCase()) {
            case 'verified':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-white p-6">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <button
                        onClick={() => router.visit('/student/parcel')}
                        className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Parcel Details</h1>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left Section - Parcel Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Parcel Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Parcel ID</label>
                                    <span className="font-['Consolas'] text-gray-600">{parcel.parcel_code}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(parcel.status)}`}
                                    >
                                        {parcel.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Tracking Number</label>
                                    <span className="font-['Consolas'] text-gray-600">{parcel.tracking_no}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payment Status</label>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusBadgeColor(parcel.paymentStatus)}`}
                                    >
                                        {parcel.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Arrival Date</label>
                                    <span className="text-gray-600">{parcel.arrivalDate}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Sender</label>
                                    <span className="text-gray-600">{parcel.sender}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Size</label>
                                    <span className="text-gray-600">{parcel.size}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                                    <span className="text-gray-600">{parcel.location}</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Days in Storage</label>
                                <span className="text-gray-600">{parcel.days} days</span>
                            </div>

                            {/* Show payment proof image (if available) */}
                            {payment_proof_url && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payment Proof</label>
                                    <div className="mt-2">
                                        <img
                                            src={payment_proof_url}
                                            alt="Payment proof"
                                            className="max-h-48 w-full rounded-md border object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Show scheduled pickup information if available */}
                            {parcel.schedule && parcel.time_slot && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-blue-900">Scheduled Pickup</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-700">Date & Time</label>
                                            <span className="text-sm font-medium text-blue-900">
                                                {new Date(parcel.schedule).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-700">Time Slot</label>
                                            <span className="text-sm font-medium text-blue-900">{parcel.time_slot}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Tracking History */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <AlarmClock className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Tracking History - #{parcel.parcel_code}</h2>
                        </div>

                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200"></div>

                            <div className="space-y-6">
                                {trackingHistory.map((event) => (
                                    <div key={event.id} className="relative flex items-start gap-4">
                                        {/* Timeline dot */}
                                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
                                            {renderIcon(event.icon, event.iconColor)}
                                        </div>

                                        {/* Event content */}
                                        <div className="flex-1 space-y-1">
                                            <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                                            <p className="text-sm text-gray-600">{event.description}</p>

                                            {event.hasAttribution && event.attribution && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <User className="h-3 w-3" />
                                                    <span>{event.attribution}</span>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500">{event.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default ParcelDetails;
