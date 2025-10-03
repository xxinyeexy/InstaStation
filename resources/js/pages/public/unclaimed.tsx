import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { CalendarDays, CheckCircle, LogIn, PackageSearch, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

type Parcel = {
    parcel_id: number;
    tracking_no: string;
    sender: string;
    size?: string | null;
    location?: string | null;
    parcel_status: string;
    days?: number | null;
    created_at?: string;
};

export default function Unclaimed({ parcels = [], stats = { unclaimed: 0, highPriority: 0, avgDays: 0 }, filters = { q: '' } }: { parcels: Parcel[]; stats: { unclaimed: number; highPriority: number; avgDays: number }; filters?: { q?: string } }) {
    const { auth } = usePage<SharedData>().props;
    const [q, setQ] = useState(filters.q || '');
    const { post, processing } = useForm({});

    const filtered = parcels;

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('public.unclaimed'), { q }, { preserveState: true, replace: true });
    };

    const claim = (parcel_id: number, redirect: 'login' | 'register') => {
        post(route('claim.start'), { preserveScroll: true, data: { parcel_id, redirect } });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Unclaimed Parcels" />
            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Unclaimed Parcels</h1>
                    <div className="text-sm text-gray-500">Total: {parcels.length} parcels</div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-red-50 p-4">
                        <div className="text-2xl font-bold text-red-600">{stats.unclaimed}</div>
                        <div className="text-sm text-red-700">Unclaimed Parcels</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4">
                        <div className="text-2xl font-bold text-amber-600">{stats.highPriority}</div>
                        <div className="text-sm text-amber-700">High Priority (7+ days)</div>
                    </div>
                    <div className="rounded-xl bg-violet-50 p-4">
                        <div className="text-2xl font-bold text-violet-600">{stats.avgDays}</div>
                        <div className="text-sm text-violet-700">Avg. Days Unclaimed</div>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={onSearch} className="mb-6 rounded-lg border border-dashed p-4">
                    <div className="mb-3 flex items-center gap-2 font-medium">
                        <PackageSearch className="h-4 w-4" /> Search Unclaimed Parcels
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Enter your name or tracking number..."
                            className="w-full rounded-lg border px-3 py-2"
                        />
                        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black">Search</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Tip: Search by your full name, tracking number, or package ID</div>
                </form>

                {/* Table */}
                {q === '' ? (
                    <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Enter your tracking number to search unclaimed parcels.</div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border bg-white p-8 text-center text-gray-500">No results found.</div>
                ) : (
                <div className="overflow-hidden rounded-xl border bg-white">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Tracking No</th>
                                <th className="px-4 py-3">Recipient</th>
                                <th className="px-4 py-3">Sender</th>
                                <th className="px-4 py-3">Arrived</th>
                                <th className="px-4 py-3">Days</th>
                                <th className="px-4 py-3">Size</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.parcel_id} className="border-t">
                                    <td className="px-4 py-3 font-mono">{p.tracking_no}</td>
                                    <td className="px-4 py-3 text-gray-500">—</td>
                                    <td className="px-4 py-3">{p.sender}</td>
                                    <td className="px-4 py-3 flex items-center gap-1 text-gray-600">
                                        <CalendarDays className="h-4 w-4" /> {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-600">{p.days ?? '—'}d</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{p.size ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">{p.location ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">unclaimed</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                disabled={processing}
                                                onClick={() => claim(p.parcel_id, 'login')}
                                                className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-black disabled:opacity-50"
                                            >
                                                <LogIn className="h-4 w-4" /> Yes, it's mine
                                            </button>
                                            {!auth.user && (
                                                <button
                                                    disabled={processing}
                                                    onClick={() => claim(p.parcel_id, 'register')}
                                                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <UserPlus className="h-4 w-4" /> I'm new here
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td className="px-4 py-12 text-center text-gray-500" colSpan={9}>
                                        No unclaimed parcels match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* Helper cards */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                            <CheckCircle className="h-4 w-4 text-emerald-600" /> Easy Search
                        </div>
                        <div className="text-sm text-gray-600">Simply enter your name or tracking number to find your parcels.</div>
                    </div>
                    <div className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                            <LogIn className="h-4 w-4 text-indigo-600" /> Quick Claiming
                        </div>
                        <div className="text-sm text-gray-600">Found your parcel? Sign in or register to link it instantly.</div>
                    </div>
                    <div className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                            <CalendarDays className="h-4 w-4 text-rose-600" /> Flexible Pickup
                        </div>
                        <div className="text-sm text-gray-600">Schedule a pickup time that works for you and get reminders.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}


