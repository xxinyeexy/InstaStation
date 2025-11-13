import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { DollarSign, Download, Search, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';


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
        title: 'Users',
        href: '/student/manage-user',
    },
];


export default function ManageUser({ summary, rows, filters }: { summary: Summary; rows: Row[]; filters?: { q?: string; status?: string } }) {
    const [list, setList] = useState<Row[]>(rows);
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
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">User Management</h1>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Manage student accounts and generate reports</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Total Students</div>
                            <UsersRound className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.total}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">Registered users</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Active Students</div>
                            <UsersRound className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.active}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">Currently active</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Avg Parcels/Student</div>
                            <UsersRound className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.avg_per_student}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">Per student</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Total Revenue</div>
                            <DollarSign className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">RM{summary.total_revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">From all students</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <div className="relative w-full max-w-xl">
                            <input
                                ref={searchRef}
                                className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                                placeholder="Search by name, student ID, or email..."
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
                        <div className="ml-4 flex items-center gap-2">
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
                                <option value="">All Status</option>
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
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
                                <Download className="h-4 w-4" /> Export Report
                            </button>
                        </div>
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                        <div className="col-span-3">Student</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-2">Parcels</div>
                        <div className="col-span-1">Spent</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Last Activity</div>
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
                                <div className="font-medium text-foreground">{r.parcels_total} total</div>
                                <div className="text-xs text-orange-500 dark:text-orange-400">{r.parcels_pending} pending</div>
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
        </AppLayout>
    );
}
