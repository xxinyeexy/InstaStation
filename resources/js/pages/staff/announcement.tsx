import AppLayout from '@/layouts/app-layout';
import { Edit2, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    const { rows = [], summary: _summary = {}, categories = [], filters = {} } = props;
    const [list, setList] = useState<AnnouncementRow[]>(rows);
    const [q, setQ] = useState(filters?.q || '');
    const [category, setCategory] = useState(filters?.category || '');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState<AnnouncementRow | null>(null);
    const [viewing, setViewing] = useState<any | null>(null);
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
        // We need to convert this to ISO string WITHOUT timezone adjustment
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        
        // Get the local datetime components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Return ISO format with 'Z' to indicate UTC (but treat as local time)
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
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
        window.location.href = `/staff/manage-faq?` + new URLSearchParams({ q, category }).toString();
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
        });
        setList((prev) => prev.filter((r) => ((r as any).announcement_id || r.faq_id) !== announcement_id));
    };

    const categoryClasses = (cat?: string | null) => {
        const key = (cat || 'General').toLowerCase();
        // General: purple; Collection: blue; Payment: green
        if (key.includes('general')) return 'bg-purple-100 text-purple-700';
        if (key.includes('collect')) return 'bg-blue-100 text-blue-700';
        if (key.includes('pay')) return 'bg-emerald-100 text-emerald-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">Manage announcements and notifications for students</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="text-sm text-gray-600 dark:text-muted-foreground">Total Announcements</div>
                        <div className="text-2xl font-bold text-foreground">{list.length}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">All announcements</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="text-sm text-gray-600 dark:text-muted-foreground">Published</div>
                        <div className="text-2xl font-bold text-foreground">
                            {list.filter((r) => (r as any).announcement_status === 'Published' || r.faq_status === 'Active').length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">Visible to students</div>
                    </div>
                </div>

                {/* Search and filter */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
                        <input
                            ref={searchRef}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search announcements..."
                            className="w-full rounded-md border border-border bg-background px-7 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => e.key === 'Enter' && refreshFromServer()}
                        />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="">All Categories</option>
                        {categories
                            .filter((c, index, arr) => arr.indexOf(c) === index)
                            .filter((c) => c && c.trim() !== '')
                            .map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
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
                        className="inline-flex items-center gap-2 rounded-md bg-pink-500 px-3 py-2 text-sm text-white dark:bg-gray-700"
                    >
                        <Plus size={16} /> New Announcement
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.map((f) => (
                        <div key={f.announcement_id} className="rounded-xl border border-border bg-card">
                            <div className="flex items-start justify-between p-4">
                                <div className="pr-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${categoryClasses((f as any).announcement_type || f.category)}`}
                                        >
                                            {(f as any).announcement_type || f.category || 'General'}
                                        </span>
                                        {((f as any).announcement_status || (f as any).faq_status) &&
                                            ((f as any).announcement_status === 'Draft' || (f as any).faq_status === 'Inactive') && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-muted dark:text-muted-foreground">
                                                    Draft
                                                </span>
                                            )}
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">
                                        {(f as any).announcement_title || (f as any).faq_question}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
                                        {(f as any).announcement_content || (f as any).faq_answer}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-400 dark:text-muted-foreground">
                                        Publish: {formatDateTime((f as any).publish_date as string | undefined)}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        onClick={() => setViewing(f)}
                                        className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    {(f as any).announcement_status === 'Published' || (f as any).faq_status === 'Active' ? (
                                        <button
                                            onClick={() => publish(((f as any).announcement_id || f.faq_id) as number, 'unpublish')}
                                            className="text-sm text-foreground hover:bg-accent hover:ring-border focus-visible:outline-none active:bg-accent"
                                        >
                                            Unpublish
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => publish(((f as any).announcement_id || f.faq_id) as number, 'publish')}
                                            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground opacity-80 hover:opacity-100"
                                        >
                                            Publish
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
                                        className="text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-foreground"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => remove(((f as any).announcement_id || f.faq_id) as number)}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-end pr-4 pb-3 text-xs text-gray-400 dark:text-muted-foreground">
                                Updated: {f.updated_at ? new Date(f.updated_at).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="py-16 text-center text-gray-400 dark:text-muted-foreground">No results.</div>}
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-card">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold">Edit Announcement</div>
                                <div className="text-xs text-gray-500 dark:text-muted-foreground">Update the announcement information</div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-foreground"
                                onClick={() => setEditing(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium text-foreground">Title</div>
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-foreground">Content</div>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Type</div>
                                    <select
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="">General</option>
                                        {categories
                                            .filter((c, index, arr) => arr.indexOf(c) === index)
                                            .filter((c) => c && c.trim() !== '')
                                            .map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Status</div>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="Inactive">Draft</option>
                                        <option value="Active">Published</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-foreground">Image</div>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-20 w-32 overflow-hidden rounded-md border bg-gray-50">
                                        {editImagePreview ? (
                                            <img src={editImagePreview} alt="preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                                        )}
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
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
                                        Change image
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Publish Date</div>
                                    <input
                                        type="datetime-local"
                                        value={editPublishDate} 
                                        onChange={(e) => setEditPublishDate(e.target.value)}
                                        min={nowDateTimeLocal}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Expiry Date</div>
                                    <input
                                        type="datetime-local"
                                        value={editExpiryDate}
                                        onChange={(e) => setEditExpiryDate(e.target.value)}
                                        min={editPublishDate || nowDateTimeLocal}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setEditing(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white dark:bg-gray-700"
                                    onClick={async () => {
                                        if (!editing) return;
                                        const id = ((editing as any).announcement_id || (editing as any).faq_id) as number;
                                        const form = new FormData();
                                        form.append('title', editTitle);
                                        form.append('content', editContent);
                                        form.append('type', editType);
                                        form.append('status', editStatus);
                                        if (editPublishDate) form.append('publish_date', toIsoStringFromLocal(editPublishDate));
                                        if (editExpiryDate) form.append('expiry_date', toIsoStringFromLocal(editExpiryDate));
                                        if (editImageFile) form.append('image', editImageFile);
                                        await fetch(`/staff/announcements/${id}`, {
                                            method: 'PUT',
                                            headers: {
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': csrf,
                                            },
                                            body: form,
                                        });
                                        setList((prev) =>
                                            prev.map((r) =>
                                                (((r as any).announcement_id || r.faq_id) as number) ===
                                                (((editing as any).announcement_id || (editing as any).faq_id) as number)
                                                    ? {
                                                          ...r,
                                                          announcement_title: editTitle,
                                                          announcement_content: editContent,
                                                          announcement_type: editType,
                                                          announcement_status: editStatus === 'Active' ? 'Published' : 'Draft',
                                                          publish_date: editPublishDate
                                                              ? toIsoStringFromLocal(editPublishDate)
                                                              : (r as any).publish_date,

                                                          expiry_date: editExpiryDate ? toIsoStringFromLocal(editExpiryDate) : (r as any).expiry_date,
                                                          category: editType,
                                                          updated_at: new Date().toISOString(),
                                                      }
                                                    : r,
                                            ),
                                        );
                                        setEditing(null);
                                    }}
                                >
                                    Update Announcement
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setViewing(null)} />
                    <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold">Announcement Details</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 ${categoryClasses((viewing as any).announcement_type || (viewing as any).category)}`}
                                    >
                                        {(viewing as any).announcement_type || (viewing as any).category || 'General'}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-foreground"
                                onClick={() => setViewing(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold">{(viewing as any).announcement_title || (viewing as any).faq_question}</div>
                            {(viewing as any).announcement_image && (
                                <img
                                    src={`/storage/${(viewing as any).announcement_image}`}
                                    alt="announcement"
                                    className="h-56 w-full rounded-md object-cover"
                                />
                            )}
                            <div className="prose max-w-none text-gray-700 dark:text-muted-foreground">
                                {(viewing as any).announcement_content || (viewing as any).faq_answer}
                            </div>
                            <hr />
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <div className="font-medium">Created</div>
                                    <div>{(viewing as any).created_at ? new Date((viewing as any).created_at).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Publish Date</div>
                                    <div>{formatDateTime((viewing as any).publish_date)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Expires</div>
                                    <div>{formatDateTime((viewing as any).expiry_date)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {adding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setAdding(false)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-card">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold">Create Announcement</div>
                                <div className="text-xs text-gray-500 dark:text-muted-foreground">Create a new announcement for students</div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-foreground"
                                onClick={() => setAdding(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium text-foreground">Title</div>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    placeholder="Enter announcement title..."
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium text-foreground">Content</div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    placeholder="Enter announcement content..."
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">Image </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setImageFile(f);
                                        setImagePreview(f ? URL.createObjectURL(f) : null);
                                    }}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                                {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 h-28 w-full rounded-md object-cover" />}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Type</div>
                                    <select
                                        value={annType}
                                        onChange={(e) => setAnnType(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="General">General</option>
                                        <option value="Holiday">Holiday</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Policy">Policy</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Status</div>
                                    <select
                                        value={annStatus}
                                        onChange={(e) => setAnnStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="Inactive">Draft</option>
                                        <option value="Active">Published</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Publish Date</div>
                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(publishDate)}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        min={nowDateTimeLocal}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium text-foreground">Expiry Date</div>
                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(expiryDate)}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={publishDate ? toDateTimeLocalValue(publishDate) || nowDateTimeLocal : nowDateTimeLocal}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAdding(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-gray-700"
                                    disabled={creating || !title.trim() || !content.trim()}
                                    aria-busy={creating}
                                    onClick={async () => {
                                        if (creating) return;
                                        if (!title.trim() || !content.trim()) return;
                                        // Prevent creating duplicate announcements with same title and content
                                        const exists = list.some(
                                            (r) =>
                                                ((r as any).announcement_title || (r as any).faq_question || '').trim().toLowerCase() ===
                                                    title.trim().toLowerCase() &&
                                                ((r as any).announcement_content || (r as any).faq_answer || '').trim() === content.trim(),
                                        );
                                        if (exists) {
                                            alert('An announcement with the same title and content already exists.');
                                            return;
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
                                            const res = await fetch('/staff/announcements', {
                                                method: 'POST',
                                                headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
                                                body: form,
                                            });
                                            const json = await res.json();
                                            if (json?.success && json.announcement) {
                                                setList((prev) => [json.announcement, ...prev]);
                                            }
                                            setAdding(false);
                                            setTitle('');
                                            setContent('');
                                            setAnnType('General');
                                            setAnnStatus('Inactive');
                                            setPublishDate('');
                                            setExpiryDate('');
                                            setImageFile(null);
                                            setImagePreview(null);
                                        } finally {
                                            setCreating(false);
                                        }
                                    }}
                                >
                                    {creating ? 'Creating…' : 'Create Announcement'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
