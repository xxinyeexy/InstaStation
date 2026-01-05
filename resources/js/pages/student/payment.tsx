import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, CheckCircle, CircleAlert, CircleCheck, CreditCard, WalletCards, X, Upload, Info, Calendar, Sparkles, HandCoins } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type Summary = {
    overdue: number;
    pending: number;
    verified: number;
    total_paid: number;
};

type Row = {
    parcel_id: number;
    parcel_code: string;
    tracking_no: string;
    sender: string;
    amount: number;
    arrival: string;
    payment_state: 'Pending' | 'Overdue' | 'Verified' | 'Rejected' | 'Processing';
    rejection_reason?: string | null;
    rejection_date?: string | null;
    proof_url?: string | null;
    submitted_at?: string | null;
};

type PaymentRow = {
    payment_id: number;
    parcel_code: string | null;
    amount: number;
    status: 'Verified' | 'Pending' | 'Rejected';
    submitted_at: string | null;
    verified_at: string | null;
    proof_url: string | null;
    reason?: string | null;
};

// Notification interface
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    parcel_code?: string;
    parcel_id?: number;
    rejected_by?: string;
    rejected_at?: string;
    reason?: string;
    created_at: string;
    read_at?: string | null;
    is_read: boolean;
}

export default function Payment({ summary, rows, payments }: { summary: Summary; rows: Row[]; payments: PaymentRow[] }) {
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('paymentCentre'),
            href: '/student/payment',
        },
    ];
    const badge = (state: Row['payment_state']) => {
        if (state === 'Overdue') return 'text-destructive bg-destructive/10 border-destructive/20';
        if (state === 'Rejected') return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20';
        if (state === 'Verified')
            return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
        if (state === 'Processing')
            return 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20';
        return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
    };

    const pageProps: any = usePage<SharedData>().props;
    const serverNotifications: any[] = pageProps.notifications || [];

    // Debug: Log notifications on load
    useEffect(() => {
        console.log('=== PAYMENT PAGE LOADED ===');
        console.log('Payment page - Server notifications received:', serverNotifications);
        console.log('Payment page - Notification count:', serverNotifications.length);
        console.log(
            'Payment page - Notification IDs:',
            serverNotifications.map((n) => ({ id: n.id, title: n.title, read_at: n.read_at })),
        );
    }, []);

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [notificationList, setNotificationList] = useState<any[]>(serverNotifications);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
    const [paymentSort, setPaymentSort] = useState<'newest' | 'oldest'>('newest');

    const handlePayNow = (parcelId: number) => {
        router.visit(`/student/payment/submit/${parcelId}`);
    };

    // Get flash messages from the page props
    const { flash } = usePage().props as any;

    // Filter and sort payment history
    const filteredPayments = payments
        .filter((p) => {
            if (paymentFilter === 'all') return true;
            if (paymentFilter === 'verified') return p.status === 'Verified';
            if (paymentFilter === 'pending') return p.status === 'Pending';
            if (paymentFilter === 'rejected') return p.status === 'Rejected';
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.submitted_at || '').getTime();
            const dateB = new Date(b.submitted_at || '').getTime();
            return paymentSort === 'newest' ? dateB - dateA : dateA - dateB;
        });


    // Format date as DD/MM/YYYY, HH:MM AM/PM
    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Function to translate payment states
    const getPaymentStateTranslation = (state: string): string => {
        const normalized = state?.toLowerCase();
        if (normalized === 'verified') return t('verified');
        if (normalized === 'pending') return t('pending');
        if (normalized === 'overdue') return t('overdue');
        if (normalized === 'rejected') return t('rejected');
        if (normalized === 'processing') return t('processing');
        return state;
    };

    // Update notification list when props change, filtering out dismissed ones
    useEffect(() => {
        console.log('Payment page - Server notifications changed:', serverNotifications);
        console.log('Dismissed IDs:', Array.from(dismissedNotificationIds));

        // Filter out any notifications that were manually dismissed
        const filteredNotifications = serverNotifications.filter((n) => !dismissedNotificationIds.has(n.id));
        console.log('Filtered notifications:', filteredNotifications.length);
        setNotificationList(filteredNotifications);
    }, [serverNotifications, dismissedNotificationIds]);

    // Refresh data when component mounts (e.g., returning from payment submission)
    useEffect(() => {
        // Check if there's a flash message
        if (flash.success) {
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        }

        // Cleanup any legacy URL params if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_submitted') === 'true') {
            urlParams.delete('payment_submitted');
            const clearedParcel = urlParams.get('cleared_parcel');
            if (clearedParcel) {
                setNotificationList((prev) => prev.filter((n) => String(n.parcel_id) !== clearedParcel || n.type !== 'payment_rejected'));
                urlParams.delete('cleared_parcel');
            }
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);

            // Still show toast if coming from legacy link
            if (!flash.success) {
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 5000);
            }
        }
    }, [flash.success]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.notification-dropdown') && !target.closest('.notification-bell')) {
                setShowNotificationDropdown(false);
            }
        };

        if (showNotificationDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotificationDropdown]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setViewerUrl(null);
        };
        window.addEventListener('keydown', onKey as any);
        return () => window.removeEventListener('keydown', onKey as any);
    }, []);

    // Handle notification click
    const handleNotificationClick = async (notification: any) => {
        console.log('Notification clicked - Full object:', notification);
        console.log('Notification clicked - ID:', notification.id);
        console.log('Notification clicked - ID type:', typeof notification.id);

        // Close dropdown after clicking
        setShowNotificationDropdown(false);

        // Keep payment_rejected visible until resubmission; others can be dismissed immediately
        const isStickyRejection = notification.type === 'payment_rejected';
        if (!isStickyRejection) {
            // Add to dismissed list so it won't come back even if props refresh
            setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

            // Optimistically remove from UI immediately for better UX
            setNotificationList((prev) => prev.filter((n) => n.id !== notification.id));
        }

        // Mark as read on the server unless it is sticky (payment_rejected)
        if (notification.id && !isStickyRejection) {
            try {
                console.log('Attempting to mark notification as read:', notification.id);
                const response = await fetch(`/student/notifications/${notification.id}/mark-read`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    credentials: 'same-origin',
                });

                console.log('Response status:', response.status, 'OK:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('Server error response:', errorText);
                    console.log('Server returned non-OK status (notification may already be read):', response.status);
                    // Check if it's a real error or just already marked
                    if (response.status !== 404) {
                        console.error('Unexpected error marking notification as read');
                    }
                    return;
                }

                const result = await response.json();
                console.log('Mark as read SUCCESS response:', result);
            } catch (e) {
                console.error('Exception marking notification as read:', e);
                // Don't restore notification to list - better UX to keep it removed
            }
        }

        // Handle different notification types
        const title = notification.title?.toLowerCase() || '';
        const message = notification.message?.toLowerCase() || '';

        // Check if it's a "Parcel Collected" notification - just mark as read and don't navigate
        if (title.includes('parcel collected') || message.includes('successfully collected')) {
            // Just remove from list, no navigation
            return;
        }

        // For other notifications, navigate as usual
        if (notification.type === 'payment_rejected' && notification.parcel_id) {
            // Navigate but keep the notification visible (will be cleared after resubmission by backend)
            router.visit(`/student/payment/submit/${notification.parcel_id}`);
        } else if (notification.parcel_id) {
            router.visit(`/student/parcel/${notification.parcel_id}`);
        } else if (notification.type === 'payment_verified') {
            router.visit('/student/payment');
        }
    };

    const headerAction = (
        <div className="relative">
            <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="notification-bell relative rounded-full border border-border bg-background p-2.5 shadow-sm hover:bg-accent"
            >
                <Bell className="h-5 w-5 text-foreground" />
                {notificationList.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {notificationList.length}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
                <div className="notification-dropdown absolute top-12 right-0 z-50 w-96 rounded-lg border bg-popover shadow-lg">
                    <div className="border-b border-border p-4">
                        <h3 className="text-lg font-semibold text-popover-foreground">{t('notifications')}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notificationList.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">{t('noNotifications')}</div>
                        ) : (
                            notificationList.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="cursor-pointer border-b border-border bg-popover p-4 hover:bg-accent"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-popover-foreground">{notification.title}</h4>
                                            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                                            {notification.reason && (
                                                <div className="mt-3 group overflow-hidden rounded-xl border border-red-100 bg-red-50/30 p-3 dark:border-red-900/30 dark:bg-red-900/10 transition-all hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-red-800 dark:text-red-300">{t('staffFeedback')}</span>
                                                    </div>
                                                    <p className="pl-3.5 text-xs italic leading-relaxed text-red-700 dark:text-red-400">
                                                        "{notification.reason}"
                                                    </p>
                                                </div>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerAction={headerAction}>
            <Head title={t('paymentCentre')} />

            {/* Success Toast Notification */}
            {showSuccessToast && (
                <div className="fixed top-8 left-1/2 z-[250] -translate-x-1/2">
                    <div className="flex min-w-[320px] items-center justify-center gap-2 rounded-2xl bg-[#f0fdf4] px-5 py-2.5 text-[#065f46] shadow-sm animate-in fade-in slide-in-from-top-4">
                        <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                            {flash.success || 'Payment proof uploaded successfully! Staff will verify within 24 hours.'}
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground">{t('paymentCentre')}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('manageParcelPayments')}</p>
                </div>

                {/* Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">{t('overdue')}</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.overdue}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{t('delayPayments')}</div>
                        </div>
                        <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                            <CircleAlert className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">{t('pendingItems')}</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.pending}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{t('awaitingPayments')}</div>
                        </div>
                        <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-600 dark:text-yellow-400">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">{t('verified')}</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.verified}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{t('successfullyVerified')}</div>
                        </div>
                        <div className="rounded-full bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                            <WalletCards className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></WalletCards>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">{t('totalPaid')}</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">RM {summary.total_paid.toFixed(2)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{t('receivedPayments')}</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <HandCoins className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border p-3 sm:p-4 text-base sm:text-lg font-semibold text-card-foreground">
                        <span className="rounded-full bg-destructive/10 p-1 text-destructive">
                            <CircleAlert className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </span>
                        {t('paymentsRequired')}
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            {/* Desktop Header - Hidden on Mobile */}
                            <div className="hidden sm:grid grid-cols-6 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                                <div>{t('parcelID')}</div>
                                <div>{t('sender')}</div>
                                <div>{t('amount')}</div>
                                <div>{t('arrivalDate')}</div>
                                <div>{t('status')}</div>
                                <div>{t('actions')}</div>
                            </div>

                            {rows.map((r) => (
                                <div
                                    key={r.parcel_id}
                                    className={`border-b border-border p-4 sm:grid sm:grid-cols-6 sm:gap-2 sm:px-4 sm:py-3 ${r.payment_state === 'Overdue' ? 'bg-destructive/5' : ''}`}
                                >
                                    {/* Mobile View: Stacked Layout */}
                                    <div className="flex flex-col gap-2 sm:hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-card-foreground">
                                                    {r.payment_state === 'Pending' || r.payment_state === 'Overdue' || r.payment_state === 'Rejected' ? (
                                                        <button onClick={() => handlePayNow(r.parcel_id)} className="underline decoration-dotted text-left">
                                                            {r.parcel_code}
                                                        </button>
                                                    ) : (
                                                        r.parcel_code
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{r.sender || '—'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-card-foreground">RM{r.amount.toFixed(2)}</div>
                                                <div className="text-xs text-muted-foreground">{r.arrival}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${badge(r.payment_state)}`}
                                            >
                                                {r.payment_state === 'Overdue' && (
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                                                    </svg>
                                                )}
                                                {r.payment_state === 'Pending' && (
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                                {r.payment_state === 'Verified' && (
                                                    <WalletCards className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></WalletCards>
                                                )}
                                                {r.payment_state === 'Rejected' && (
                                                    <X className="h-3.5 w-3.5" />
                                                )}
                                                {getPaymentStateTranslation(r.payment_state)}
                                            </span>

                                            {/* Mobile Actions */}
                                            <div className="flex gap-2">
                                                {r.payment_state === 'Pending' || r.payment_state === 'Overdue' ? (
                                                    null
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop View: Grid Layout */}
                                    <div className="hidden sm:block font-semibold text-card-foreground">{r.parcel_code}</div>
                                    <div className="hidden sm:block text-muted-foreground">{r.sender || '—'}</div>
                                    <div className="hidden sm:block font-semibold text-card-foreground">RM{r.amount.toFixed(2)}</div>
                                    <div className="hidden sm:block text-muted-foreground">{r.arrival}</div>
                                    <div className="hidden sm:block">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${badge(r.payment_state)}`}
                                        >
                                            {r.payment_state === 'Overdue' && (
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                                                </svg>
                                            )}
                                            {r.payment_state === 'Pending' && (
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            {r.payment_state === 'Verified' && (
                                                <WalletCards className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></WalletCards>
                                            )}
                                            {r.payment_state === 'Rejected' && (
                                                <X className="h-3.5 w-3.5" />
                                            )}
                                            {getPaymentStateTranslation(r.payment_state)}
                                        </span>
                                    </div>
                                    <div>
                                        {r.payment_state !== 'Verified' ? (
                                            <button
                                                onClick={() => handlePayNow(r.parcel_id)}
                                                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                {t('payNow')}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{t('paid')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-3 sm:p-4 gap-3 sm:gap-0">
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">{t('paymentHistory')}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('viewManageSubmissions')}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Filter Dropdown */}
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'verified' | 'pending' | 'rejected')}
                                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">{t('allStatus')}</option>
                                <option value="verified">{t('verified')}</option>
                                <option value="pending">{t('pending')}</option>
                                <option value="rejected">{t('rejected')}</option>
                            </select>
                            {/* Sort Dropdown */}
                            <select
                                value={paymentSort}
                                onChange={(e) => setPaymentSort(e.target.value as 'newest' | 'oldest')}
                                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="newest">{t('mostRecent')}</option>
                                <option value="oldest">{t('oldestFirst')}</option>
                            </select>
                        </div>
                    </div>
                    {filteredPayments.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {paymentFilter === 'all' ? t('noPaymentsYet') : t('noPaymentsFound').replace('{filter}', paymentFilter)}
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {filteredPayments.map((p) => (
                                <li key={p.payment_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4">
                                    {/* Left: code + status */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full p-1 ${p.status === 'Verified'
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                : p.status === 'Rejected'
                                                    ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                                    : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                                }`}
                                        >
                                            {p.status === 'Verified' && <WalletCards className="h-4 w-4" />}
                                            {p.status === 'Rejected' && <X className="h-4 w-4" />}
                                            {p.status === 'Pending' && (
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="font-medium text-card-foreground">{p.parcel_code ?? '—'}</span>
                                        <span
                                            className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${p.status === 'Verified'
                                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                                                : p.status === 'Rejected'
                                                    ? 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400'
                                                    : 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400'
                                                }`}
                                        >
                                            {p.status === 'Verified' && <WalletCards className="h-3 w-3" />}
                                            {p.status === 'Rejected' && <X className="h-3 w-3" />}
                                            {p.status === 'Pending' && (
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                            {getPaymentStateTranslation(p.status)}
                                        </span>
                                    </div>
                                    {/* Middle: dates */}
                                    <div className="ml-auto text-right text-xs text-muted-foreground">
                                        <div>{t('submitted')}: {p.submitted_at ?? '—'}</div>
                                        <div>{t('verified')}: {p.verified_at ?? '—'}</div>
                                    </div>
                                    {/* Right: proof thumbnail */}
                                    <div className="ml-4">
                                        {p.proof_url ? (
                                            <button onClick={() => setViewerUrl(p.proof_url)} className="block focus:outline-none">
                                                <img
                                                    src={p.proof_url}
                                                    alt="Payment Proof"
                                                    className="h-12 w-16 rounded-md object-cover ring-1 ring-border"
                                                />
                                            </button>
                                        ) : (
                                            <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border">
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M3 5h18M3 19h18M3 5l7 7-7 7m18-14l-7 7 7 7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* Proof Viewer Modal */}
                {viewerUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative max-w-4xl w-full animate-in zoom-in-95 duration-300">
                            <button
                                onClick={() => setViewerUrl(null)}
                                className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <img src={viewerUrl} alt="Payment Proof" className="h-full w-full rounded-2xl object-contain shadow-2xl" />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
