import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { DollarSign, Download, Search, Trash2, UsersRound, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';


type Summary = {
    total: number;
    active: number;
    avg_per_student: number;
    total_revenue: number;
};

type Row = {
    student_id: number;
    name: string;
    matric: string;
    email: string;
    phone?: string | null;
    parcels_total: number;
    parcels_pending: number;
    spent: number;
    status?: string | null;
    last_activity?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'users',
        href: '/student/manage-user',
    },
];


export default function ManageUser({ summary, rows, filters }: { summary: Summary; rows: Row[]; filters?: { q?: string; status?: string } }) {
    const { t } = useLanguage();
    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user;
    const [list, setList] = useState<Row[]>(rows);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const typingTimerRef = useRef<number | null>(null);
    useEffect(() => setList(rows), [rows]);

    const doSearch = () => {
        const q = searchRef.current?.value ?? '';
        const params = new URLSearchParams(window.location.search);
        params.set('q', q);
        params.set('status', filters?.status || '');
        router.get(`/staff/manage-user?${params.toString()}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users" />
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-foreground">{t('userManagement')}</h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground">{t('manageStudents')}</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('totalStudents')}</div>
                            <UsersRound className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.total}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{t('registeredUsers')}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('activeStudents')}</div>
                            <UsersRound className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.active}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{t('currentlyActive')}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('avgParcels')}</div>
                            <UsersRound className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.avg_per_student}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{t('perStudent')}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('totalRevenue')}</div>
                            <DollarSign className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">RM{summary.total_revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{t('fromAllStudents')}</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-3 sm:p-4 gap-3 sm:gap-0">
                        <div className="relative w-full sm:max-w-xl">
                            <input
                                ref={searchRef}
                                className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                                placeholder={t('searchPlaceholder')}
                                defaultValue={filters?.q || ''}
                                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                                onChange={() => {
                                    if (typingTimerRef.current) {
                                        window.clearTimeout(typingTimerRef.current);
                                    }
                                    typingTimerRef.current = window.setTimeout(() => {
                                        doSearch();
                                    }, 300);
                                }}
                            />
                            <button
                                type="button"
                                onClick={doSearch}
                                className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:text-muted-foreground dark:hover:text-foreground"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-4">
                            <select
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                defaultValue={filters?.status || ''}
                                onChange={(e) => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('q', searchRef.current?.value || '');
                                    params.set('status', e.target.value);
                                    router.get(`/staff/manage-user?${params.toString()}`);
                                }}
                            >
                                <option value="">{t('allStatus')}</option>
                                <option value="active">{t('active')}</option>
                                <option value="inactive">{t('inactive')}</option>
                            </select>
                            <button
                                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                                onClick={() => {
                                    // Export as CSV
                                    const csvRows = [
                                        [
                                            'Student ID',
                                            'Name',
                                            'Matric',
                                            'Email',
                                            'Phone',
                                            'Parcels Total',
                                            'Parcels Pending',
                                            'Spent',
                                            'Status',
                                            'Last Activity',
                                        ],
                                        ...list.map((r) => [
                                            r.student_id,
                                            r.name,
                                            r.matric,
                                            r.email,
                                            r.phone || '',
                                            r.parcels_total,
                                            r.parcels_pending,
                                            r.spent,
                                            r.status || '-',
                                            r.last_activity || '—',
                                        ]),
                                    ];
                                    const csvContent = csvRows
                                        .map((e) =>
                                            e
                                                .map(String)
                                                .map((s) => '"' + s.replace(/"/g, '""') + '"')
                                                .join(','),
                                        )
                                        .join('\n');
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'user_report.csv';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                <Download className="h-4 w-4" /> {t('exportReport')}
                            </button>

                            {/* Cleanup Old Records Button - Only for Operations/Admin */}
                            {(currentUser?.department?.trim() === 'Operations' ||
                                currentUser?.department?.trim() === 'Operations - Admin' ||
                                currentUser?.department?.trim() === 'Admin' ||
                                currentUser?.type === 'admin') && (
                                    <button
                                        onClick={() => setShowCleanupModal(true)}
                                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg active:scale-95"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>{t('cleanupOldRecords')}</span>
                                    </button>
                                )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                                <div className="col-span-3">{t('student')}</div>
                                <div className="col-span-3">{t('contact')}</div>
                                <div className="col-span-2">{t('parcels')}</div>
                                <div className="col-span-1">{t('spent')}</div>
                                <div className="col-span-1">{t('status')}</div>
                                <div className="col-span-2">{t('lastActivity')}</div>
                            </div>

                            {/* Rows */}
                            {list.map((r) => (
                                <div key={r.student_id} className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3">
                                    <div className="col-span-3">
                                        <div className="font-medium text-foreground">{r.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{r.matric}</div>
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        <div>{r.email}</div>
                                        {r.phone && <div className="text-xs text-gray-500 dark:text-muted-foreground">{r.phone}</div>}
                                    </div>
                                    <div className="col-span-2 text-sm">
                                        <div className="font-medium text-foreground">{r.parcels_total} {t('total')}</div>
                                        <div className="text-xs text-orange-500 dark:text-orange-400">{r.parcels_pending} {t('pending')}</div>
                                    </div>
                                    <div className="col-span-1 font-medium text-foreground">RM{r.spent.toFixed(2)}</div>
                                    <div className="col-span-1">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ring-1 ${r.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/50' : 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-muted dark:text-foreground dark:ring-border'}`}
                                        >
                                            {r.status || '-'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">{r.last_activity ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cleanup Confirmation Modal */}
            {showCleanupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative mx-4 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/50 dark:bg-gray-900">
                            {/* Icon */}
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
                            </div>

                            {/* Content */}
                            <div className="mt-4 text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Delete Old Records?
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    Are you sure you want to delete all student collection history (parcels) older than{' '}
                                    <span className="font-semibold text-red-600 dark:text-red-500">10 days</span>?
                                    <br />
                                    <span className="mt-2 inline-block font-medium text-red-700 dark:text-red-400">
                                        This action cannot be undone.
                                    </span>
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowCleanupModal(false)}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCleanupModal(false);
                                        router.post('/staff/parcels/cleanup-old', {}, {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                router.reload();
                                            },
                                        });
                                    }}
                                    className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg active:scale-95"
                                >
                                    Delete Records
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

