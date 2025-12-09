import { type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle, LogIn, PackageSearch, UserPlus, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Parcel = {
    parcel_id: number;
    tracking_no: string;
    sender: string;
    size?: string | null;
    location?: string | null;
    parcel_status: string;
    days?: number | null;
    created_at?: string;
    recipient_name?: string | null;
    recipient_matric?: string | null;
};

export default function Unclaimed({
    parcels = [],
    stats = { unclaimed: 0, highPriority: 0, avgDays: 0 },
    filters = { q: '' },
    totalUnclaimed = 0,
}: {
    parcels: Parcel[];
    stats: { unclaimed: number; highPriority: number; avgDays: number };
    filters?: { q?: string };
    totalUnclaimed?: number;
}) {
    const { auth } = usePage<SharedData>().props;
    const pageProps = usePage().props as any;
    const pageErrors = pageProps.errors || {};
    // Check for flash messages (status is used by backend, success/error are standard)
    const flashStatus = (pageProps.flash?.status || pageProps.flash?.success || null) as string | null;
    const flashError = (pageProps.flash?.error || null) as string | null;
    const [q, setQ] = useState(filters.q || '');
    const { post, processing } = useForm({});

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'error',
    });
    const toastTimerRef = useRef<number | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'error') => {
        setToast({ show: true, message, type });

        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = window.setTimeout(() => {
            setToast({ show: false, message: '', type: 'error' });
            toastTimerRef.current = null;
        }, 5000);
    };

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    // Handle errors and success messages from page props (e.g., from redirect with errors)
    useEffect(() => {
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            const firstError = Object.values(pageErrors)[0];
            if (firstError) {
                showToast(Array.isArray(firstError) ? firstError[0] : String(firstError), 'error');
            }
        }

        // Handle error flash messages (e.g., from backend redirect with error)
        if (flashError) {
            showToast(String(flashError), 'error');
        }

        // Handle success flash messages
        if (flashStatus) {
            showToast(String(flashStatus), 'success');
        }
    }, [pageErrors, flashError, flashStatus]);

    const filtered = parcels;

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('public.unclaimed'), { q }, { preserveState: true, replace: true });
    };

    const claim = (parcel_id: number, redirect: 'login' | 'register') => {
        console.log('🔵 Claim button clicked:', { parcel_id, redirect });

        // Always navigate to login/register first, even if user is logged in
        // This ensures the error message appears after login, not before
        // The claim.start method always redirects, so no error handling needed here
        const data: Record<string, any> = { parcel_id, redirect };

        if (redirect === 'register') {
            data.allow_new = true; // Include allow_new for "I'm new here" flow
        }

        console.log('🔵 Sending POST to claim.start:', data);

        router.post(
            route('claim.start'),
            data,
            {
                preserveScroll: true,
                onBefore: () => {
                    console.log('🟢 Request starting...');
                },
                onSuccess: (page) => {
                    console.log('🟢 Request successful:', page);
                },
                onError: (errors) => {
                    console.error('🔴 Request failed:', errors);
                },
                onFinish: () => {
                    console.log('🟡 Request finished');
                },
            },
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Unclaimed Parcels" />

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <div
                        className={`max-w-96 min-w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${toast.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                            : 'border-red-200 bg-red-50/95 text-red-800'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                {toast.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold">
                                    {toast.type === 'success' ? 'Success' : 'Error'}
                                </h4>
                                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setToast({ show: false, message: '', type: 'error' });
                                    if (toastTimerRef.current) {
                                        window.clearTimeout(toastTimerRef.current);
                                        toastTimerRef.current = null;
                                    }
                                }}
                                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Link
                href="/"
                className="group m-4 inline-flex items-center gap-0 overflow-hidden rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:gap-2 hover:pr-5 hover:shadow-xl dark:bg-gray-700 md:absolute md:top-4 md:left-4 md:m-0"
            >
                <div className="flex h-10 w-10 items-center justify-center">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </div>
                <span className="max-w-0 overflow-hidden text-sm font-medium transition-all duration-300 group-hover:max-w-xs">Back</span>
            </Link>
            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Unclaimed Parcels</h1>
                    <div className="text-sm text-gray-500">Total: {totalUnclaimed} parcels</div>
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
                            placeholder="Search your parcels..."
                            className="w-full rounded-lg border-border border px-3 py-2"
                        />
                        <button type="submit" className="rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-black">
                            Search
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Tip: Search by your name, tracking number, or matric ID</div>
                </form>

                {/* Table / Cards */}
                {q === '' ? (
                    <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                        Enter your tracking number to search unclaimed parcels.
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border bg-white p-8 text-center text-gray-500">No results found.</div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {filtered.map((p) => (
                                <div key={p.parcel_id} className="rounded-xl border bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div>
                                            <div className="font-mono font-bold text-gray-900">{p.tracking_no}</div>
                                            <div className="text-sm text-gray-500">{p.sender}</div>
                                        </div>
                                        <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">unclaimed</span>
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-y-3 text-sm">
                                        <div>
                                            <span className="block text-xs text-gray-500">Student</span>
                                            <span className="font-medium text-gray-900">{p.recipient_name ?? '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-500">Matric ID</span>
                                            <span className="font-medium text-gray-900">{p.recipient_matric ?? '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-500">Location</span>
                                            <span className="text-gray-900">{p.location ?? '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-500">Size</span>
                                            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                                {p.size ?? '—'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-xs text-gray-500">Arrived</span>
                                            <div className="flex items-center gap-1 text-gray-700">
                                                <CalendarDays className="h-3 w-3 text-gray-400" />
                                                {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '—'}
                                                <span className="mx-1 text-gray-400">•</span>
                                                <span className="text-orange-600">{p.days ?? '—'} days ago</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-3">
                                        <div className="flex gap-2">
                                            {(p.recipient_name || p.recipient_matric) && (
                                                <button
                                                    disabled={processing}
                                                    onClick={() => claim(p.parcel_id, 'login')}
                                                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
                                                >
                                                    <LogIn className="h-4 w-4" /> Yes, it's mine
                                                </button>
                                            )}
                                            <button
                                                disabled={processing}
                                                onClick={() => claim(p.parcel_id, 'register')}
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <UserPlus className="h-4 w-4" /> I'm new here
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Tracking No</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Matric ID</th>
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
                                            <td className="px-4 py-3 text-gray-700">{p.recipient_name ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-700">{p.recipient_matric ?? '—'}</td>
                                            <td className="px-4 py-3">{p.sender}</td>
                                            <td className="flex items-center gap-1 px-4 py-3 text-gray-600">
                                                <CalendarDays className="h-4 w-4" />{' '}
                                                {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '—'}
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
                                                    {(p.recipient_name || p.recipient_matric) && (
                                                        <button
                                                            disabled={processing}
                                                            onClick={() => claim(p.parcel_id, 'login')}
                                                            className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-black disabled:opacity-50"
                                                        >
                                                            <LogIn className="h-4 w-4" /> Yes, it's mine
                                                        </button>
                                                    )}
                                                    <button
                                                        disabled={processing}
                                                        onClick={() => claim(p.parcel_id, 'register')}
                                                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        <UserPlus className="h-4 w-4" /> I'm new here
                                                    </button>
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
                    </>
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
