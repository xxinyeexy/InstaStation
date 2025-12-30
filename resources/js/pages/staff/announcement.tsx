import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { CircleCheck, Edit2, Eye, Plus, Search, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';


type AnnouncementRow = {
    announcement_id: number;
    announcement_title: string;
    announcement_content: string;
    announcement_type?: string | null;
    announcement_status?: 'Published' | 'Draft' | string;
    announcement_image?: string | null;
    publish_date?: string | null;
    expiry_date?: string | null;
    created_at?: string;
    updated_at?: string;
    // Back-compat (when data is coming from FAQs shape)
    faq_id?: number;
    faq_question?: string;
    faq_answer?: string;
    category?: string | null;
    faq_status?: 'Active' | 'Inactive';
};

export default function StaffAnnouncements(props: {
    rows?: AnnouncementRow[];
    summary?: any;
    categories?: string[];
    filters?: { q?: string; category?: string };
}) {
    const { t } = useLanguage();
    const { rows = [], summary: _summary = {}, categories = [], filters = {} } = props;
    const [list, setList] = useState<AnnouncementRow[]>(rows);
    const [q, setQ] = useState(filters?.q || '');
    const [category, setCategory] = useState(filters?.category || '');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState<AnnouncementRow | null>(null);
    const [viewing, setViewing] = useState<any | null>(null);
    const [validationError, setValidationError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const showValidationError = (message: string) => {
        setValidationError(message);
        setTimeout(() => setValidationError(''), 3000);
    };
    const showSuccessMessage = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editType, setEditType] = useState('');
    const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Inactive');
    const [editPublishDate, setEditPublishDate] = useState<string>('');
    const [editExpiryDate, setEditExpiryDate] = useState<string>('');
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

    // Auto-set status to Published when edit publish date is current or earlier
    useEffect(() => {
        if (editPublishDate) {
            const publishDateTime = new Date(editPublishDate);
            const currentTime = new Date();

            if (publishDateTime <= currentTime) {
                setEditStatus('Active'); // Set to Published
            }
        }
    }, [editPublishDate]);

    // Add modal state
    const [adding, setAdding] = useState(false);
    const [creating, setCreating] = useState(false);
    // New announcement form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [annType, setAnnType] = useState('General');
    const [annStatus, setAnnStatus] = useState<'Active' | 'Inactive'>('Inactive');
    const [publishDate, setPublishDate] = useState<string>('');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [selectedDeleteLabel, setSelectedDeleteLabel] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Auto-set status to Published when publish date is current or earlier
    useEffect(() => {
        if (publishDate) {
            const publishDateTime = new Date(publishDate);
            const currentTime = new Date();
            if (publishDateTime <= currentTime) {
                setAnnStatus('Active'); // Set to Published
            }
        }
    }, [publishDate]);

    // Keep session alive - ping every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/staff/announcements?keep-alive=1', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            }).catch(() => { });
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    const toDateInputValue = (value?: string | null) => {
        if (!value) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };

    const toDateTimeLocalValue = (value?: string | null) => {
        if (!value) return '';
        // Accept already yyyy-MM-ddTHH:mm
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const nowDateTimeLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const formatDateTime = (value?: string | null) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString();
    };

    const toIsoStringFromLocal = (value?: string) => {
        if (!value) return '';
        // datetime-local input gives us "YYYY-MM-DDTHH:mm" in local time
        // Parse it directly without timezone conversion
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
            const date = new Date(value);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const i = String(date.getMinutes()).padStart(2, '0');
            const s = String(date.getSeconds()).padStart(2, '0');
            return `${y}-${m}-${d} ${h}:${i}:${s}`;
        }
        return value;
    };
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return list.filter((f) => {
            const title = ((f as any).announcement_title || (f as any).faq_question || '').toLowerCase();
            const content = ((f as any).announcement_content || (f as any).faq_answer || '').toLowerCase();
            const typeOrCategory = (f.announcement_type || f.category || '') as string;
            const matchQ = !needle || title.includes(needle) || content.includes(needle);
            const matchC = !category || (typeOrCategory || '') === category;
            return matchQ && matchC;
        });
    }, [list, q, category]);

    const refreshFromServer = () => {
        // Simple client-side filter reflects UI immediately; full refresh on navigation
        window.location.href = `/staff/announcements?` + new URLSearchParams({ q, category }).toString();
    };

    const csrf = (typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') : '') || '';

    const publish = async (announcement_id: number, to: 'publish' | 'unpublish') => {
        const body = new FormData();
        const currentTimestamp = new Date().toISOString();

        if (to === 'publish') {
            body.append('publish_date', currentTimestamp);
        }

        await fetch(`/staff/announcements/${announcement_id}/${to}`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
            body: to === 'publish' ? body : undefined,
            credentials: 'include',
        });

        setList((prev) =>
            prev.map((r) =>
                ((r as any).announcement_id || r.faq_id) === announcement_id
                    ? {
                        ...r,
                        announcement_status: to === 'publish' ? 'Published' : 'Draft',
                        publish_date: to === 'publish' ? currentTimestamp : (r as any).publish_date,
                        faq_status: to === 'publish' ? 'Active' : 'Inactive',
                        updated_at: currentTimestamp,
                    }
                    : r,
            ),
        );
    };
    const remove = async (announcement_id: number) => {
        await fetch(`/staff/announcements/${announcement_id}`, {
            method: 'DELETE',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
            credentials: 'include',
        });
        setList((prev) => prev.filter((r) => ((r as any).announcement_id || r.faq_id) !== announcement_id));
    };

    // Delete confirmation handlers
    const handleDeleteClick = (id: number, title: string) => {
        setSelectedDeleteId(id);
        setSelectedDeleteLabel(title);
        setShowDeleteModal(true);
    };
    const handleDeleteConfirm = async () => {
        if (!selectedDeleteId) return;
        setIsDeleting(true);
        try {
            await remove(selectedDeleteId);
            showSuccessMessage('Announcement deleted successfully!');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setSelectedDeleteId(null);
            setSelectedDeleteLabel(null);
        }
    };
    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedDeleteId(null);
        setSelectedDeleteLabel(null);
    };

    const categoryClasses = (cat?: string | null) => {
        const key = (cat || 'General').toLowerCase();
        // General: purple; Collection: blue; Payment: green
        if (key.includes('general')) return 'bg-purple-100 text-purple-700';
        if (key.includes('holiday')) return 'bg-blue-100 text-blue-700';
        if (key.includes('maintenance')) return 'bg-orange-100 text-orange-700';
        if (key.includes('policy')) return 'bg-yellow-100 text-yellow-700';
        return 'bg-gray-100 text-gray-700';
    };
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('announcements'),
            href: '/student/announcements',
        },
    ];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('announcements')} />
            {validationError && (
                <div className="fixed top-8 left-1/2 z-[150] -translate-x-1/2">
                    <div className="flex min-w-[320px] items-center justify-center gap-2 rounded-2xl bg-[#fef2f2] px-5 py-2.5 text-[#991b1b] shadow-sm animate-in fade-in slide-in-from-top-4">
                        <XCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                            {validationError}
                        </span>
                    </div>
                </div>
            )}
            {successMessage && (
                <div className="fixed top-8 left-1/2 z-[150] -translate-x-1/2">
                    <div className="flex min-w-[320px] items-center justify-center gap-2 rounded-2xl bg-[#f0fdf4] px-5 py-2.5 text-[#065f46] shadow-sm animate-in fade-in slide-in-from-top-4">
                        <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                            {successMessage}
                        </span>
                    </div>
                </div>
            )}
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('announcements')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('manageAnnouncements')}</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalAnnouncements')}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{list.length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{t('allAnnouncements')}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('published')}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {list.filter((r) => (r as any).announcement_status === 'Published' || r.faq_status === 'Active').length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{t('visibleToStudents')}</div>
                    </div>
                </div>

                {/* Search and filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            ref={searchRef}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('searchAnnouncements')}
                            className="w-full rounded-md border border-gray-200 bg-white px-7 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                            onKeyDown={(e) => e.key === 'Enter' && refreshFromServer()}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex-1 sm:flex-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">{t('allCategories')}</option>
                            <option value="General">{t('general')}</option>
                            <option value="Holiday">{t('holiday')}</option>
                            <option value="Maintenance">{t('maintenance')}</option>
                            <option value="Policy">{t('policy')}</option>
                        </select>
                        <button
                            onClick={() => {
                                setAdding(true);
                                // Initialize with current time in datetime-local format
                                const now = new Date();
                                const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                setPublishDate(localDateTime);
                                setAnnStatus('Active'); // Set to Published by default when publish date is current
                            }}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 rounded-md bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700"
                        >
                            <Plus size={16} /> {t('newAnnouncement')}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.map((f) => (
                        <div key={f.announcement_id} className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-start justify-between p-4">
                                <div className="pr-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${categoryClasses((f as any).announcement_type || f.category)}`}>{t(((f as any).announcement_type || f.category || 'General').toLowerCase() as any)}</span>
                                        {((f as any).announcement_status || (f as any).faq_status) &&
                                            ((f as any).announcement_status === 'Draft' || (f as any).faq_status === 'Inactive') && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    {t('draft')}
                                                </span>
                                            )}
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white break-words line-clamp-1">
                                        {(f as any).announcement_title || (f as any).faq_question}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-all line-clamp-3">
                                        {(f as any).announcement_content || (f as any).faq_answer}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                                        {t('publishLabel')}: {formatDateTime((f as any).publish_date as string | undefined)}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        onClick={() => setViewing(f)}
                                        className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    {(f as any).announcement_status === 'Published' || (f as any).faq_status === 'Active' ? (
                                        <button
                                            onClick={() => publish(((f as any).announcement_id || f.faq_id) as number, 'unpublish')}
                                            className="text-sm text-gray-900 hover:bg-pink-50 hover:text-pink-600 hover:shadow-lg focus-visible:outline-none active:bg-gray-200 dark:text-white dark:hover:bg-pink-900/20 dark:hover:text-pink-400 dark:active:bg-gray-700"
                                        >
                                            {t('unpublish')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => publish(((f as any).announcement_id || f.faq_id) as number, 'publish')}
                                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 opacity-80 hover:opacity-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                                        >
                                            {t('publish')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setEditing(f);
                                            setEditTitle(((f as any).announcement_title || (f as any).faq_question) as string);
                                            setEditContent(((f as any).announcement_content || (f as any).faq_answer) as string);
                                            setEditType(((f as any).announcement_type || (f as any).category || '') as string);
                                            // Map announcement_status to UI status
                                            const isActive = (f as any).announcement_status === 'Published' || (f as any).faq_status === 'Active';
                                            setEditStatus(isActive ? 'Active' : 'Inactive');
                                            setEditPublishDate(toDateTimeLocalValue((f as any).publish_date as string | undefined));
                                            setEditExpiryDate(toDateTimeLocalValue((f as any).expiry_date as string | undefined));
                                            setEditImageFile(null);
                                            setEditImagePreview((f as any).announcement_image ? `/storage/${(f as any).announcement_image}` : null);
                                        }}
                                        className="rounded-2xl p-2 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-orange-50 hover:text-orange-500 hover:shadow-lg dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteClick(
                                                ((f as any).announcement_id || f.faq_id) as number,
                                                (((f as any).announcement_title || (f as any).faq_question) as string) || '',
                                            )
                                        }
                                        className="rounded-2xl p-2 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-600 hover:shadow-lg dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-end pr-4 pb-3 text-xs text-gray-400 dark:text-gray-500">
                                Updated: {f.updated_at ? new Date(f.updated_at).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="py-16 text-center text-gray-400 dark:text-gray-500">No results.</div>}
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={handleDeleteCancel} />
                    <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{t('deleteAnnouncement')}</h2>
                        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                            {t('areYouSureDeleteAnnouncement')}
                            {selectedDeleteLabel ? (
                                <>
                                    {' '}
                                    <span className="font-medium text-red-600">{selectedDeleteLabel}</span>
                                </>
                            ) : (
                                ` ${t('thisAnnouncement')}`
                            )}
                            ?
                        </p>
                        <div className="mb-6 rounded-md bg-red-50 p-3 dark:bg-red-500/10">
                            <p className="text-sm text-left text-red-800 dark:text-red-400">
                                {t('cannotBeUndone')}
                            </p>
                        </div>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? t('deleting') : t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('editAnnouncement')}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('updateAnnouncementDesc')}</div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                onClick={() => setEditing(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('title')}</div>
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('content')}</div>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="h-28 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('type')}</div>
                                    <select
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value)}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="General">{t('general')}</option>
                                        <option value="Holiday">{t('holiday')}</option>
                                        <option value="Maintenance">{t('maintenance')}</option>
                                        <option value="Policy">{t('policy')}</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('status')}</div>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as any)}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="Inactive">{t('draft')}</option>
                                        <option value="Active">{t('published')}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('image')}</div>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-20 w-32 overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                                        {editImagePreview ? (
                                            <img src={editImagePreview} alt="preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">{t('noImage')}</div>
                                        )}
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] || null;
                                                setEditImageFile(f);
                                                setEditImagePreview(f ? URL.createObjectURL(f) : editImagePreview);
                                            }}
                                            className="hidden"
                                        />
                                        {t('changeImage')}
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('publishDate')}</div>
                                    <input
                                        type="datetime-local"
                                        value={editPublishDate}
                                        onChange={(e) => setEditPublishDate(e.target.value)}
                                        min={nowDateTimeLocal}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('expiryDate')}</div>
                                    <input
                                        type="datetime-local"
                                        value={editExpiryDate}
                                        onChange={(e) => setEditExpiryDate(e.target.value)}
                                        min={editPublishDate || nowDateTimeLocal}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setEditing(null)}>
                                    {t('cancel')}
                                </button>
                                <button
                                    className="rounded-md bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600"
                                    onClick={async () => {
                                        if (!editing) return;

                                        // Validation
                                        if (!editTitle.trim()) {
                                            showValidationError('Please enter a title');
                                            return;
                                        }
                                        if (editTitle.trim().length < 5) {
                                            showValidationError('Title must be at least 5 characters long');
                                            return;
                                        }
                                        if (!editContent.trim()) {
                                            showValidationError('Please enter content');
                                            return;
                                        }
                                        if (editContent.trim().length < 20) {
                                            showValidationError('Content must be at least 20 characters long');
                                            return;
                                        }
                                        if (!editType) {
                                            showValidationError('Please select a type');
                                            return;
                                        }
                                        if (editExpiryDate && editPublishDate) {
                                            const publishDateTime = new Date(editPublishDate);
                                            const expiryDateTime = new Date(editExpiryDate);
                                            if (expiryDateTime <= publishDateTime) {
                                                showValidationError('Expiry date must be after publish date');
                                                return;
                                            }
                                        }
                                        const id = ((editing as any).announcement_id || (editing as any).faq_id) as number;
                                        const form = new FormData();
                                        form.append('_method', 'PUT'); // Spoof PUT method for file upload support
                                        form.append('title', editTitle);
                                        form.append('content', editContent);
                                        form.append('type', editType);
                                        form.append('status', editStatus);
                                        // Ensure we have a valid publish date, prevent clearing it unintentionally
                                        if (editPublishDate) {
                                            form.append('publish_date', toIsoStringFromLocal(editPublishDate));
                                        } else if (editStatus === 'Active') {
                                            // If setting to Active but no date, default to now
                                            form.append('publish_date', new Date().toISOString().slice(0, 19).replace('T', ' '));
                                        }

                                        if (editExpiryDate) form.append('expiry_date', toIsoStringFromLocal(editExpiryDate));
                                        if (editImageFile) form.append('image', editImageFile);

                                        let res = await fetch(`/staff/announcements/${id}`, {
                                            method: 'POST', // Use POST for FormData with files
                                            headers: {
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': csrf,
                                            },
                                            body: form,
                                            credentials: 'include',
                                        });

                                        if (res.status === 419) {
                                            try {
                                                // Refresh CSRF token
                                                const refreshRes = await fetch(window.location.href);
                                                const html = await refreshRes.text();
                                                const parser = new DOMParser();
                                                const doc = parser.parseFromString(html, 'text/html');
                                                const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                                                if (newToken) {
                                                    // Update meta tag for future requests
                                                    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', newToken);

                                                    // Retry request with new token
                                                    res = await fetch(`/staff/announcements/${id}`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                            'X-CSRF-TOKEN': newToken,
                                                        },
                                                        body: form,
                                                        credentials: 'include',
                                                    });
                                                }
                                            } catch (refreshError) {
                                                console.error('Session refresh failed:', refreshError);
                                            }
                                        }

                                        if (!res.ok) {
                                            const errorText = await res.text();
                                            console.error('Update announcement failed:', res.status, errorText);
                                            showValidationError(`Failed to update announcement: ${res.statusText}`);
                                            return;
                                        }

                                        const json = await res.json();
                                        if (json.success && json.announcement) {
                                            setList((prev) =>
                                                prev.map((r) =>
                                                    (((r as any).announcement_id || r.faq_id) as number) === id
                                                        ? json.announcement
                                                        : r,
                                                ),
                                            );
                                        }
                                        setEditing(null);
                                        showSuccessMessage('Announcement updated successfully!');
                                    }}
                                >
                                    {t('updateAnnouncement')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setViewing(null)} />
                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">Announcement Details</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 ${categoryClasses((viewing as any).announcement_type || (viewing as any).category)}`}
                                    >
                                        {t(((viewing as any).announcement_type || (viewing as any).category || 'General').toLowerCase() as any)}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                onClick={() => setViewing(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white break-words">{(viewing as any).announcement_title || (viewing as any).faq_question}</div>
                            {(viewing as any).announcement_image && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-100 dark:border-gray-700">
                                    <img
                                        src={`/storage/${(viewing as any).announcement_image}`}
                                        alt="announcement"
                                        className="h-full w-full object-contain bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                            )}
                            <div className="prose max-w-none text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                                {(viewing as any).announcement_content || (viewing as any).faq_answer}
                            </div>
                            <hr className="dark:border-gray-700" />
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <div className="font-medium">Created</div>
                                    <div>{(viewing as any).created_at ? new Date((viewing as any).created_at).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Publish Date</div>
                                    <div>{formatDateTime((viewing as any).publish_date)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Expiry Date</div>
                                    <div>{formatDateTime((viewing as any).expiry_date)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {adding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setAdding(false)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('createAnnouncement')}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('createAnnouncementDesc')}</div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                onClick={() => setAdding(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('title')}</div>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    placeholder={t('enterAnnouncementTitle')}
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('content')}</div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="h-28 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    placeholder={t('enterAnnouncementContent')}
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('image')} </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setImageFile(f);
                                        setImagePreview(f ? URL.createObjectURL(f) : null);
                                    }}
                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                                {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 h-28 w-full rounded-md object-cover" />}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('type')}</div>
                                    <select
                                        value={annType}
                                        onChange={(e) => setAnnType(e.target.value)}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="General">{t('general')}</option>
                                        <option value="Holiday">{t('holiday')}</option>
                                        <option value="Maintenance">{t('maintenance')}</option>
                                        <option value="Policy">{t('policy')}</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('status')}</div>
                                    <select
                                        value={annStatus}
                                        onChange={(e) => setAnnStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="Inactive">{t('draft')}</option>
                                        <option value="Active">{t('published')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('publishDate')}</div>
                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(publishDate)}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        min={nowDateTimeLocal}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t('expiryDate')}</div>
                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(expiryDate)}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={publishDate ? toDateTimeLocalValue(publishDate) || nowDateTimeLocal : nowDateTimeLocal}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setAdding(false)}>
                                    {t('cancel')}
                                </button>
                                <button
                                    className="rounded-md bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 disabled:opacity-50"
                                    disabled={creating}
                                    aria-busy={creating}
                                    onClick={async () => {
                                        if (creating) return;
                                        // Validation
                                        if (!title.trim()) {
                                            showValidationError('Title is required.');
                                            return;
                                        }
                                        if (title.trim().length < 5) {
                                            showValidationError('Title must be at least 5 characters long.');
                                            return;
                                        }
                                        if (!content.trim()) {
                                            showValidationError('Content is required.');
                                            return;
                                        }
                                        if (content.trim().length < 20) {
                                            showValidationError('Content must be at least 20 characters long.');
                                            return;
                                        }
                                        if (!annType.trim()) {
                                            showValidationError('Type is required.');
                                            return;
                                        }
                                        if (!publishDate.trim()) {
                                            showValidationError('Publish date is required.');
                                            return;
                                        }
                                        if (expiryDate && publishDate) {
                                            const publishDateTime = new Date(publishDate);
                                            const expiryDateTime = new Date(expiryDate);
                                            if (expiryDateTime <= publishDateTime) {
                                                showValidationError('Expiry date must be after publish date.');
                                                return;
                                            }
                                        }
                                        setCreating(true);
                                        try {
                                            const form = new FormData();
                                            form.append('title', title);
                                            form.append('content', content);
                                            form.append('type', annType);
                                            form.append('status', annStatus);
                                            if (publishDate) form.append('publish_date', toIsoStringFromLocal(publishDate));
                                            if (expiryDate) form.append('expiry_date', toIsoStringFromLocal(expiryDate));
                                            if (imageFile) form.append('image', imageFile);
                                            let res = await fetch('/staff/announcements', {
                                                method: 'POST',
                                                headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
                                                body: form,
                                                credentials: 'include', // Ensure cookies are sent
                                            });

                                            if (res.status === 419) {
                                                try {
                                                    // Refresh CSRF token
                                                    const refreshRes = await fetch(window.location.href);
                                                    const html = await refreshRes.text();
                                                    const parser = new DOMParser();
                                                    const doc = parser.parseFromString(html, 'text/html');
                                                    const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                                                    if (newToken) {
                                                        // Update meta tag for future requests
                                                        document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', newToken);

                                                        // Retry request with new token
                                                        res = await fetch('/staff/announcements', {
                                                            method: 'POST',
                                                            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': newToken },
                                                            body: form,
                                                            credentials: 'include',
                                                        });
                                                    }
                                                } catch (refreshError) {
                                                    console.error('Session refresh failed:', refreshError);
                                                }
                                            }

                                            if (!res.ok) {
                                                const errorText = await res.text();
                                                let errorMessage = res.statusText || 'Unknown error';
                                                try {
                                                    const json = JSON.parse(errorText);
                                                    if (json.message) errorMessage = json.message;
                                                } catch (e) {
                                                    // Not JSON
                                                }
                                                console.error('Create announcement failed:', res.status, errorText);
                                                showValidationError(`Failed to create announcement: ${errorMessage}`);
                                                return;
                                            }
                                            const json = await res.json();
                                            if (json?.success && json.announcement) {
                                                setList((prev) => [json.announcement, ...prev]);
                                                setAdding(false);
                                                setTitle('');
                                                setContent('');
                                                setAnnType('General');
                                                setAnnStatus('Inactive');
                                                setPublishDate('');
                                                setExpiryDate('');
                                                setImageFile(null);
                                                setImagePreview(null);
                                                showSuccessMessage('Announcement created successfully!');
                                            } else {
                                                console.error('Unexpected response:', json);
                                                showValidationError('Failed to create announcement');
                                            }
                                        } catch (error) {
                                            console.error('Error creating announcement:', error);
                                            showValidationError('An error occurred while creating the announcement');
                                        } finally {
                                            setCreating(false);
                                        }
                                    }}
                                >
                                    {creating ? 'Creating…' : t('createAnnouncement')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </AppLayout >
    );
}
