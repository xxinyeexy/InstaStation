import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlarmClock, ArrowLeft, CheckCircle, CircleAlert, CreditCard, Package, PackageOpen, User, WalletCards } from 'lucide-react';

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
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('myParcels'), href: '/student/parcel' },
        { title: t('viewDetails'), href: `/student/parcel/${parcel.id}` },
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
                case 'pink':
                    return 'h-5 w-5 text-pink-500';
                case 'yellow':
                    return 'h-5 w-5 text-yellow-500';
                case 'purple':
                    return 'h-5 w-5 text-purple-500';
                default:
                    return 'h-5 w-5 text-gray-500';
            }
        };

        const iconClass = getIconClass(color);

        switch (iconName) {
            case 'package':
                return <Package className={iconClass} />;
            case 'package-open':
                return <PackageOpen className={iconClass} />;
            case 'clock':
                return <CircleAlert className={iconClass} />;
            case 'credit-card':
                return <CreditCard className={iconClass} />;
            case 'wallet-cards':
                return <WalletCards className={iconClass} />;
            case 'check-circle':
                return <CheckCircle className={iconClass} />;
            default:
                return <Package className={iconClass} />;
        }
    };

    // Function to translate status values
    const getTranslatedStatus = (status: string): string => {
        const normalized = status?.toLowerCase();
        if (normalized === 'pending payment') return t('pendingPayment');
        if (normalized === 'ready for collection') return t('readyForCollection');
        if (normalized === 'collected') return t('collected');
        if (normalized === 'unclaimed') return t('unclaimed');
        return status;
    };

    // Function to translate payment status
    const getTranslatedPaymentStatus = (status: string): string => {
        const normalized = status?.toLowerCase();
        if (normalized === 'verified') return t('verified');
        if (normalized === 'pending') return t('pending');
        return status;
    };

    // Function to translate tracking event titles
    const getTranslatedEventTitle = (title: string): string => {
        switch (title) {
            case 'Parcel Arrived':
                return t('parcelArrived');
            case 'Student Matched':
                return t('studentMatched');
            case 'Payment Submitted':
                return t('paymentSubmitted');
            case 'Payment Verified':
                return t('paymentVerified');
            case 'Ready for Collection':
                return t('parcelReadyCollection');
            default:
                return title;
        }
    };

    // Function to translate tracking event descriptions
    const getTranslatedEventDescription = (description: string): string => {
        switch (description) {
            case 'Parcel received at university mail center':
                return t('parcelReceived');
            case 'Automatically matched to registered student':
                return t('automaticallyMatched');
            case 'Student submitted payment proof via QR scan':
                return t('studentSubmittedProof');
            case 'Payment verified and approved by staff':
                return t('paymentVerifiedApproved');
            case 'Parcel is ready for student collection':
                return t('parcelCollection');
            default:
                return description;
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
            <Head title={t('parcelDetails')} />
            <div className="min-h-screen bg-white p-4 sm:p-6 dark:bg-gray-900">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex items-center gap-3">
                    <button
                        onClick={() => router.visit('/student/parcel')}
                        className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">{t('back')}</span>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('parcelDetails')}</h1>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                    {/* Left Section - Parcel Information */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('parcelInformation')}</h2>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('parcelID')}</label>
                                    <span className="font-['Consolas'] text-gray-600 dark:text-gray-400">{parcel.parcel_code}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('status')}</label>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(parcel.status)}`}
                                    >
                                        {getTranslatedStatus(parcel.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('trackingNumber')}</label>
                                    <span className="font-['Consolas'] text-gray-600 dark:text-gray-400">{parcel.tracking_no}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('paymentStatus')}</label>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusBadgeColor(parcel.paymentStatus)}`}
                                    >
                                        {getTranslatedPaymentStatus(parcel.paymentStatus)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('arrivalDate')}</label>
                                    <span className="text-gray-600 dark:text-gray-400">{parcel.arrivalDate}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('sender')}</label>
                                    <span className="text-gray-600 dark:text-gray-400">{parcel.sender}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('size')}</label>
                                    <span className="text-gray-600 dark:text-gray-400">{parcel.size}</span>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('location')}</label>
                                    <span className="text-gray-600 dark:text-gray-400">{parcel.location}</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('daysInStorage')}</label>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {parcel.days} {t('days')}
                                </span>
                            </div>

                            {/* Show payment proof image (if available) */}
                            {payment_proof_url && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('paymentProof')}</label>
                                    <div className="mt-2">
                                        <img
                                            src={payment_proof_url}
                                            alt="Payment proof"
                                            className="max-h-48 w-full rounded-md border object-contain dark:border-gray-700"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Show scheduled pickup information if available */}
                            {parcel.schedule && parcel.time_slot && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                    <h3 className="mb-2 sm:mb-3 text-sm font-semibold text-blue-900 dark:text-blue-100">{t('scheduledPickup')}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-700 dark:text-blue-300">{t('dateTime')}</label>
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                {new Date(parcel.schedule).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-700 dark:text-blue-300">{t('timeSlot')}</label>
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{parcel.time_slot}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Tracking History */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2">
                            <AlarmClock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                {t('trackingHistory')} - #{parcel.parcel_code}
                            </h2>
                        </div>

                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                            <div className="space-y-6">
                                {trackingHistory.map((event) => (
                                    <div key={event.id} className="relative flex items-start gap-4">
                                        {/* Timeline dot */}
                                        <div
                                            className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-700 ${event.iconColor === 'blue'
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : event.iconColor === 'orange'
                                                    ? 'bg-orange-50 dark:bg-orange-900/20'
                                                    : event.iconColor === 'green'
                                                        ? 'bg-green-50 dark:bg-green-900/20'
                                                        : event.iconColor === 'pink'
                                                            ? 'bg-pink-50 dark:bg-pink-900/20'
                                                            : event.iconColor === 'yellow'
                                                                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                                                : event.iconColor === 'purple'
                                                                    ? 'bg-purple-50 dark:bg-purple-900/20'
                                                                    : event.iconColor === 'red'
                                                                        ? 'bg-gray-100 dark:bg-gray-800'
                                                                        : 'bg-white dark:bg-gray-800'
                                                }`}
                                        >
                                            {renderIcon(event.title === 'Ready for Collection' ? 'package-open' : event.title === 'Payment Verified' ? 'wallet-cards' : event.icon, event.iconColor)}
                                        </div>

                                        {/* Event content */}
                                        <div className="flex-1 space-y-1">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{getTranslatedEventTitle(event.title)}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{getTranslatedEventDescription(event.description)}</p>

                                            {event.hasAttribution && event.attribution && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <User className="h-3 w-3" />
                                                    <span>{event.attribution}</span>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500 dark:text-gray-400">{event.timestamp}</p>
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
