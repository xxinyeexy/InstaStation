import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, ChevronRight, Clock, HelpCircle, Mail, MapPin, Phone, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type FaqItem = {
    faq_id: number;
    faq_question: string;
    faq_answer: string;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
};

// Notification interface
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    parcel_code?: string;
    parcel_id?: number;
    created_at: string;
    read_at?: string | null;
}

export default function StudentFaq({
    faqs,
    categories,
    filters,
}: {
    faqs: FaqItem[];
    categories: string[];
    filters?: { q?: string; category?: string };
}) {
    const { t } = useLanguage();
    
    const breadcrumbs = [
        { title: t('faqs'), href: '/student/faq' },
    ];
    const pageProps: any = usePage<SharedData>().props;
    const serverNotifications: Notification[] = pageProps.notifications || [];

    const [searchQuery, setSearchQuery] = useState(filters?.q || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [notificationList, setNotificationList] = useState<Notification[]>(serverNotifications);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // Update notification list when props change, filtering out dismissed ones
    useEffect(() => {
        const filtered = (serverNotifications || []).filter((n) => !dismissedNotificationIds.has(n.id));
        setNotificationList(filtered);
    }, [serverNotifications, dismissedNotificationIds]);

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

        // Track as dismissed immediately so it won't reappear from props refresh
        setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

        // Optimistically remove from UI
        setNotificationList((prev) => prev.filter((n) => n.id !== notification.id));

        // Mark as read on the server
        if (notification.id) {
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
                    // If already read or minor error, keep UI updated
                    return;
                }

                await response.json().catch(() => ({}));
            } catch (e) {
                // Network error - keep UI updated
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

    const filteredFaqs = useMemo(() => {
        const needle = searchQuery.trim().toLowerCase();
        return faqs.filter((faq) => {
            const matchSearch = !needle || faq.faq_question.toLowerCase().includes(needle) || faq.faq_answer.toLowerCase().includes(needle);
            const matchCategory = !selectedCategory || faq.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [faqs, searchQuery, selectedCategory]);

    const categoryClasses = (cat?: string | null) => {
        const key = (cat || 'General').toLowerCase();
        if (key.includes('general')) return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
        if (key.includes('collect')) return 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400';
        if (key.includes('pay')) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
        if (key.includes('ship')) return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
        if (key.includes('tech')) return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
    };

    // Function to translate FAQ categories
    const getCategoryTranslation = (category: string): string => {
        const normalized = category?.toLowerCase();
        if (normalized.includes('general')) return t('general');
        if (normalized.includes('collect')) return t('collection');
        if (normalized.includes('pay')) return t('payment');
        return category; // Return original if no match
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        window.location.href = `/student/faq?${params.toString()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>

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
                                                    {notification.parcel_code && (
                                                        <p className="mt-1 text-xs text-muted-foreground">Parcel: {notification.parcel_code}</p>
                                                    )}
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

            <div className="min-h-screen bg-white dark:bg-background">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-foreground">{t('frequentlyAskedQuestions')}</h1>
                        <p className="text-lg text-gray-600 dark:text-muted-foreground">{t('findAnswersQuestions')}</p>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative mx-auto max-w-2xl">
                            <Search
                                className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={t('searchFAQs')}
                                className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="mb-8">
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    selectedCategory === ''
                                        ? 'bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-muted dark:text-muted-foreground dark:hover:bg-accent'
                                }`}
                            >
                                {t('allCategories')}
                            </button>

                            {categories.map((category) => {
                                const c = (category || '').toLowerCase();
                                let selectedClasses = 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
                                if (c.includes('collect')) selectedClasses = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
                                if (c.includes('pay'))
                                    selectedClasses = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                            selectedCategory === category
                                                ? selectedClasses
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-muted dark:text-muted-foreground dark:hover:bg-accent'
                                        }`}
                                    >
                                        {getCategoryTranslation(category)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAQ List */}
                    <div className="mb-12 space-y-4">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => (
                                <div
                                    key={faq.faq_id}
                                    className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-card"
                                    onClick={() => setExpandedFaq(expandedFaq === faq.faq_id ? null : faq.faq_id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${categoryClasses(faq.category)}`}>
                                                    {faq.category ? getCategoryTranslation(faq.category) : t('general')}
                                                </span>
                                            </div>
                                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-card-foreground">{faq.faq_question}</h3>
                                            {expandedFaq === faq.faq_id && (
                                                <div className="mt-4 leading-relaxed text-gray-700 dark:text-muted-foreground">{faq.faq_answer}</div>
                                            )}
                                        </div>
                                        <ChevronRight
                                            className={`text-gray-400 transition-transform dark:text-muted-foreground ${expandedFaq === faq.faq_id ? 'rotate-90' : ''}`}
                                            size={20}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center">
                                <HelpCircle className="mx-auto mb-4 text-gray-400 dark:text-muted-foreground" size={64} />
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-foreground">{t('noFAQsFound')}</h3>
                                <p className="text-gray-500 dark:text-muted-foreground">
                                    {searchQuery || selectedCategory
                                        ? t('noFAQsMatchingCriteria')
                                        : t('noFAQsAvailable')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Support Section */}
                    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-card-foreground">{t('stillNeedHelp')}</h2>
                        <p className="mb-8 text-gray-600 dark:text-muted-foreground">
                            {t('supportTeamContact')}
                        </p>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">{t('emailSupport')}</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">parcel-support@university.edu</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">{t('officeHours')}</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">{t('mondayFriday')}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Phone className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">{t('phoneSupport')}</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">+1 (555) 123-4567</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">{t('location')}</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">{t('studentServicesBuilding')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
