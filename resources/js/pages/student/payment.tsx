import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, CheckCircle, CircleAlert, CircleCheck, CreditCard, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Summary = {
    overdue: number;
    pending: number;
    verified: number;
    total_paid: number;
};

type Row = {
    parcel_id: number;
    parcel_code: string;
    sender: string;
    amount: number;
    arrival: string;
    payment_state: 'Pending' | 'Overdue' | 'Verified';
};

type PaymentRow = {
    payment_id: number;
    parcel_code: string | null;
    amount: number;
    status: 'Verified' | 'Pending';
    submitted_at: string | null;
    verified_at: string | null;
    proof_url: string | null;
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
    created_at: string;
    read_at?: string | null;
    is_read: boolean;
}

export default function Payment({ summary, rows, payments }: { summary: Summary; rows: Row[]; payments: PaymentRow[] }) {
    const badge = (state: Row['payment_state']) => {
        if (state === 'Overdue') return 'text-destructive bg-destructive/10 border-destructive/20';
        if (state === 'Verified')
            return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
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

    // Get flash messages from the page props
    const { flash } = usePage().props as any;

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
        // Check if we're returning from a payment submission
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_submitted') === 'true') {
            // Remove the parameter from URL
            urlParams.delete('payment_submitted');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);

            // Show success toast
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        }
    }, []);

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

        // Add to dismissed list so it won't come back even if props refresh
        setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

        // Optimistically remove from UI immediately for better UX
        setNotificationList((prev) => prev.filter((n) => n.id !== notification.id));

        // Mark as read on the server
        if (notification.id) {
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
            router.visit(`/student/payment/submit/${notification.parcel_id}`);
        } else if (notification.parcel_id) {
            router.visit(`/student/parcel/${notification.parcel_id}`);
        } else if (notification.type === 'payment_verified') {
            router.visit('/student/payment');
        }
    };

    return (
        <AppLayout>
            <Head title="Payment Centre" />

            {/* Notification Bell - Positioned at top right (same as parcel page) */}
            <div className="fixed top-4 right-6 z-50">
                <div className="relative">
                    <button
                        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                        className="notification-bell relative rounded-full border border-border bg-background p-3 shadow-md hover:bg-accent"
                    >
                        <Bell className="h-6 w-6 text-foreground" />
                        {notificationList.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                                {notificationList.length}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotificationDropdown && (
                        <div className="notification-dropdown absolute top-12 right-0 z-50 w-96 rounded-lg border bg-popover shadow-lg">
                            <div className="border-b border-border p-4">
                                <h3 className="text-lg font-semibold text-popover-foreground">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notificationList.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
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
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {new Date(notification.created_at).toLocaleString()}
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
            </div>

            {/* Success Toast Notification */}
            {showSuccessToast && (
                <div className="fixed right-4 bottom-4 z-50">
                    <div className="max-w-96 min-w-80 rounded-lg border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-800 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold">Payment Submitted Successfully!</h4>
                                <p className="mt-1 text-sm opacity-90">Your payment proof has been uploaded. Staff will verify within 24 hours.</p>
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

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Payment Centre</h1>
                    <p className="text-sm text-muted-foreground">Manage your parcel payments</p>
                </div>

                {/* Tiles */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Overdue</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.overdue}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Delay payments</div>
                        </div>
                        <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                            <CircleAlert className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Pending Items</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.pending}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Awaiting payments</div>
                        </div>
                        <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-600 dark:text-yellow-400">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Verified</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">{summary.verified}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Successfully verified</div>
                        </div>
                        <div className="rounded-full bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                            <CircleCheck className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleCheck>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Total Paid</div>
                            <div className="mt-2 text-2xl font-bold text-card-foreground">RM {summary.total_paid.toFixed(2)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Received payments</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <WalletCards className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></WalletCards>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 border-b border-border p-4 text-lg font-semibold text-card-foreground">
                        <span className="rounded-full bg-destructive/10 p-1 text-destructive">
                            <CircleAlert className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </span>
                        Payments Required
                    </div>
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-6 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                            <div>Parcel ID</div>
                            <div>Sender</div>
                            <div>Amount</div>
                            <div>Arrival Date</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>
                        {rows.map((r) => (
                            <div
                                key={r.parcel_id}
                                className={`grid grid-cols-6 gap-2 px-4 py-3 ${r.payment_state === 'Overdue' ? 'bg-destructive/5' : ''}`}
                            >
                                <div className="font-semibold text-card-foreground">{r.parcel_code}</div>
                                <div className="text-muted-foreground">{r.sender || '—'}</div>
                                <div className="font-semibold text-card-foreground">RM{r.amount.toFixed(2)}</div>
                                <div className="text-muted-foreground">{r.arrival}</div>
                                <div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${badge(r.payment_state)}`}
                                    >
                                        {r.payment_state === 'Overdue' && (
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                                                />
                                            </svg>
                                        )}
                                        {r.payment_state === 'Pending' && (
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        )}
                                        {r.payment_state === 'Verified' && (
                                            <CircleCheck className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleCheck>
                                        )}
                                        {r.payment_state}
                                    </span>
                                </div>
                                <div>
                                    {r.payment_state !== 'Verified' ? (
                                        <Link
                                            href={`/student/payment/submit/${r.parcel_id}`}
                                            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Pay Now
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Paid</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment History */}
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <div>
                            <h2 className="text-lg font-semibold text-card-foreground">Payment History</h2>
                            <p className="text-sm text-muted-foreground">View and manage your payment submissions</p>
                        </div>
                    </div>
                    {payments.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No payments submitted yet.</div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {payments.map((p) => (
                                <li key={p.payment_id} className="flex items-center justify-between gap-4 p-4">
                                    {/* Left: code + status */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full p-1 ${p.status === 'Verified' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'}`}
                                        >
                                            {p.status === 'Verified' ? (
                                                <CircleCheck className="h-4 w-4" />
                                            ) : (
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
                                            className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${p.status === 'Verified' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400' : 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400'}`}
                                        >
                                            {p.status === 'Verified' ? (
                                                <CircleCheck className="h-3 w-3" />
                                            ) : (
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                            {p.status}
                                        </span>
                                    </div>
                                    {/* Middle: dates */}
                                    <div className="ml-auto text-right text-xs text-muted-foreground">
                                        <div>Submitted: {p.submitted_at ?? '—'}</div>
                                        <div>Verified: {p.verified_at ?? '—'}</div>
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
                {viewerUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewerUrl(null)}>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <img src={viewerUrl} alt="Payment Proof" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl" />
                            <button
                                onClick={() => setViewerUrl(null)}
                                className="absolute -top-3 -right-3 rounded-full border border-border bg-background/90 px-2 py-1 text-sm font-medium text-foreground shadow hover:bg-background"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
