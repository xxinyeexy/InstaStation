import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, ChevronRight, Clock, HelpCircle, Mail, MapPin, Phone, Search, CheckCircle, XCircle } from 'lucide-react';
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
    reason?: string | null;
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
            // Track as dismissed immediately so it won't reappear from props refresh
            setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

            // Optimistically remove from UI
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
            <Head title={t('frequentlyAskedQuestions')} />

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
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === ''
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
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === category
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
                                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-card-foreground break-all">{faq.faq_question}</h3>
                                            {expandedFaq === faq.faq_id && (
                                                <div className="mt-4 leading-relaxed text-gray-700 dark:text-muted-foreground break-all">{faq.faq_answer}</div>
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
        </AppLayout >
    );
}
