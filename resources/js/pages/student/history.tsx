import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, Calendar, FileText, Search, SlidersHorizontal, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Types for props from backend
interface Parcel {
    id: number;
    tracking_no: string;
    parcel_code: string;
    collected_at: string;
    fee: number;
    status: string;
}

interface HistoryProps {
    total_collections: number;
    collections_this_year: number;
    total_fees: number;
    parcels: Parcel[];
}

// Notification interface
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    parcel_code?: string;
    parcel_id?: number;
    reason?: string | null;
    created_at: string;
    read_at?: string | null;
}

export default function History({ total_collections, collections_this_year, total_fees, parcels }: HistoryProps) {
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('collectionHistory'),
            href: '/student/history',
        },
    ];
    const pageProps: any = usePage<SharedData>().props;
    const serverNotifications: Notification[] = pageProps.notifications || [];

    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [notificationList, setNotificationList] = useState<Notification[]>(serverNotifications);
    // Load dismissed IDs from localStorage on mount
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('dismissedNotificationIds');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // Update notification list when props change, filtering out dismissed ones
    useEffect(() => {
        const filtered = (serverNotifications || []).filter((n) => !dismissedNotificationIds.has(n.id));
        setNotificationList(filtered);
    }, [serverNotifications, dismissedNotificationIds]);

    // Save dismissed IDs to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('dismissedNotificationIds', JSON.stringify(Array.from(dismissedNotificationIds)));
        } catch (error) {
            console.error('Failed to save dismissed notifications:', error);
        }
    }, [dismissedNotificationIds]);

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

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        setShowNotificationDropdown(false);

        // Keep payment_rejected visible until resubmission; others can be dismissed immediately
        const isStickyRejection = notification.type === 'payment_rejected';
        if (!isStickyRejection) {
            // Track as dismissed so props refresh won't re-add it
            setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

            // Optimistically remove from UI immediately
            setNotificationList((prev) => prev.filter((n) => n.id !== notification.id));
        }

        // Mark as read on the server unless it is sticky (payment_rejected)
        if (notification.id && !isStickyRejection) {
            try {
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

                if (!response.ok) {
                    return;
                }

                await response.json();
            } catch (e) {
            }
        }

        // Handle different notification types
        const title = notification.title?.toLowerCase() || '';
        const message = notification.message?.toLowerCase() || '';

        // Check if it's a "Parcel Collected" notification - just mark as read and don't navigate
        if (title.includes('parcel collected') || message.includes('successfully collected')) {
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

    const filteredParcels = parcels
        .filter(
            (p) => {
                const formattedDate = p.collected_at ? new Date(p.collected_at).toLocaleDateString('en-CA') : '';
                return (
                    (p.parcel_code && p.parcel_code.toLowerCase().includes(search.toLowerCase())) ||
                    (formattedDate && formattedDate.includes(search))
                );
            }
        )
        .sort((a, b) => {
            if (sortOrder === 'recent') {
                return new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime();
            } else {
                return new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime();
            }
        });

    const headerAction = (
        <div className="relative">
            <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="notification-bell relative rounded-full border border-gray-200 bg-white p-2.5 shadow-sm hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800"
            >
                <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
                {notificationList.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {notificationList.length}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
                <div className="notification-dropdown absolute top-12 right-0 z-50 w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 p-5">
                        <h3 className="text-lg font-bold text-slate-800">{t('notifications')}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">Stay updated with your parcels</p>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                        {notificationList.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <Bell className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">{t('noNotifications')}</p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notificationList.map((notification) => {
                                const title = notification.title?.toLowerCase() || '';
                                const isCollected = title.includes('parcel collected') || title.includes('collected');
                                const isRejected = title.includes('rejected');
                                const isVerified = title.includes('verified');

                                return (
                                    <div
                                        key={notification.id}
                                        className="cursor-pointer border-b border-slate-100 p-4 hover:bg-slate-50 transition-all duration-200"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon based on notification type */}
                                            <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCollected
                                                ? 'bg-green-100'
                                                : isRejected
                                                    ? 'bg-red-100'
                                                    : isVerified
                                                        ? 'bg-blue-100'
                                                        : 'bg-orange-100'
                                                }`}>
                                                {isCollected ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600" strokeWidth={2.5} />
                                                ) : isRejected ? (
                                                    <XCircle className="h-5 w-5 text-red-600" strokeWidth={2.5} />
                                                ) : isVerified ? (
                                                    <CheckCircle className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-orange-600" strokeWidth={2.5} />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800">{notification.title}</h4>
                                                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{notification.message}</p>

                                                {notification.reason && (
                                                    <div className="mt-3 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-3.5 transition-all hover:shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-red-700">{t('staffFeedback')}</span>
                                                        </div>
                                                        <p className="pl-3.5 text-xs italic leading-relaxed text-red-700">
                                                            "{notification.reason}"
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="mt-2 text-xs font-medium text-slate-400">
                                                    {new Date(notification.created_at).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerAction={headerAction}>
            <Head title={t('collectionHistory')} />

            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        <span>{t('collectedParcels')}</span>
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('historyCollectedParcels')}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                        <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalCollections')}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{total_collections}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{t('allTime')}</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                        <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('thisYear')}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{collections_this_year}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{t('yearCollections')}</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                        <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalFees')}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500">RM{total_fees.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{t('allCollections')}</div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Search className="text-gray-400 dark:text-gray-500" size={20} />
                            </div>
                            <input
                                type="text"
                                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pr-4 pl-12 text-sm font-medium transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder:text-gray-600 dark:hover:border-gray-700"
                                placeholder={t('searchByParcelCode')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-xl border-2 px-5 font-medium shadow-sm transition ${showFilters
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                                }`}
                        >
                            <SlidersHorizontal size={18} />
                            <span className="text-sm">{t('filters')}</span>
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm dark:from-gray-900 dark:to-gray-900 dark:border-gray-800">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <SlidersHorizontal size={16} />
                                <span>Filter Options</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Sort Order */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Sort By Date</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSortOrder('recent')}
                                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${sortOrder === 'recent'
                                                ? 'border-green-600 bg-green-600 text-white shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Calendar size={16} />
                                            Most Recent
                                        </button>
                                        <button
                                            onClick={() => setSortOrder('oldest')}
                                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${sortOrder === 'oldest'
                                                ? 'border-green-600 bg-green-600 text-white shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <TrendingDown size={16} />
                                            Oldest First
                                        </button>
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 dark:bg-gray-900 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredParcels.length}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Results Found</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Collection History */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
                    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4 dark:from-gray-900 dark:to-gray-900 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('collectionHistory')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('viewExportRecords')}</p>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                        {filteredParcels.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="mb-3 text-gray-300 dark:text-gray-700" size={48} />
                                <p className="text-gray-400 dark:text-gray-600">No collections found.</p>
                            </div>
                        )}
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredParcels.map((parcel) => (
                                <div key={parcel.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 gap-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                            <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">{t('package')}</span>
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                    {parcel.parcel_code}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {t('collectedOn')} {parcel.collected_at ? new Date(parcel.collected_at).toLocaleDateString('en-CA') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <button
                                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                                            onClick={() => {
                                                window.open(`/parcels/${parcel.id}/export`, '_blank');
                                            }}
                                        >
                                            <FileText size={16} />
                                            {t('export')}
                                        </button>
                                        <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                            {t('completed')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout >
    );
}
