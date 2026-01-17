import { type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle, LogIn, Package, PackageSearch, UserPlus, X, XCircle, Clock, MapPin as MapPinIcon } from 'lucide-react';
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
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4">
                    <div
                        className={`max-w-96 min-w-80 rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md ${toast.type === 'success'
                            ? 'border-emerald-300 bg-emerald-50/95 text-emerald-900'
                            : 'border-red-300 bg-red-50/95 text-red-900'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                {toast.type === 'success' ? (
                                    <div className="rounded-full bg-emerald-200 p-1">
                                        <CheckCircle className="h-5 w-5 text-emerald-700" />
                                    </div>
                                ) : (
                                    <div className="rounded-full bg-red-200 p-1">
                                        <XCircle className="h-5 w-5 text-red-700" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold">
                                    {toast.type === 'success' ? '✓ Success' : '✗ Error'}
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
                                className="flex-shrink-0 rounded-full p-1.5 transition-all hover:bg-black/10 hover:scale-110"
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
                <div className="flex h-11 w-11 items-center justify-center">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </div>
                <span className="max-w-0 overflow-hidden text-sm font-medium transition-all duration-300 group-hover:max-w-xs">Back To Home</span>
            </Link>

            <div className="mx-auto max-w-7xl p-6 pt-20 md:pt-6">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm">
                        <Package className="h-5 w-5 text-pink-00" />
                        <span className="text-sm font-semibold text-gray-700">Total: {totalUnclaimed}  unknown parcels</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 md:text-5xl">Unclaimed Parcels</h1>
                    <p className="mt-2 text-lg text-gray-600">Find and claim your packages easily</p>
                </div>

                {/* Stats */}
                {/* <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                </div> */}

                {/* Search */}
                <form onSubmit={onSearch} className="mb-8 overflow-hidden rounded-3xl border-2 border-pink-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-pink-200/50 dark:bg-white/90">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-full bg-pink-100 p-2 dark:bg-pink-100">
                            <PackageSearch className="h-5 w-5 text-pink-600 dark:text-pink-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900">Search Unclaimed Parcels</h2>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Enter your name, tracking number, or matric ID..."
                            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-100 dark:border-gray-200 dark:bg-white dark:text-gray-900 dark:placeholder:text-gray-400 dark:focus:border-pink-400 dark:focus:ring-pink-100"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:from-purple-600 dark:to-pink-600"
                        >
                            Search
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <div className="h-1 w-1 rounded-full bg-purple-400 dark:bg-purple-400"></div>
                        <span>Tip: Search by your name, tracking number, or matric ID</span>
                    </div>
                </form>

                {/* Table / Cards */}
                {q === '' ? (
                    <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-12 text-center backdrop-blur-sm">
                        <div className="mx-auto mb-4 inline-flex rounded-full bg-gray-100 p-4">
                            <PackageSearch className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600">Enter your tracking number to search unclaimed parcels</p>
                        <p className="mt-2 text-sm text-gray-500">Start typing in the search box above</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-12 text-center backdrop-blur-sm">
                        <div className="mx-auto mb-4 inline-flex rounded-full bg-gray-100 p-4">
                            <XCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600">No results found</p>
                        <p className="mt-2 text-sm text-gray-500">Try a different search term</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {filtered.map((p) => (
                                <div key={p.parcel_id} className="group overflow-hidden rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <div className="mb-1 font-mono text-lg font-bold text-gray-900">{p.tracking_no}</div>
                                            <div className="text-sm font-medium text-gray-600">From: {p.sender}</div>
                                        </div>
                                        <span className="rounded-full bg-gray-500 px-3 py-1 text-xs font-bold text-white shadow-md">unclaimed</span>
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500">Student</span>
                                            <span className="font-bold text-gray-900">{p.recipient_name || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500">Matric ID</span>
                                            <span className="font-bold text-gray-900">{p.recipient_matric || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500">Location</span>
                                            <span className="font-bold text-gray-900">{p.location || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500">Size</span>
                                            <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                                {p.size || '—'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-xs font-semibold text-gray-500">Arrived</span>
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                                {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '—'}
                                                <span className="text-gray-400">•</span>
                                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{p.days ?? '—'} days ago</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {!(p.recipient_matric && !p.recipient_name) && (
                                            <button
                                                disabled={processing}
                                                onClick={() => claim(p.parcel_id, 'login')}
                                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                                            >
                                                <LogIn className="h-4 w-4" /> Yes, it's mine
                                            </button>
                                        )}
                                        <button
                                            disabled={processing}
                                            onClick={() => claim(p.parcel_id, 'register')}
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
                                        >
                                            <UserPlus className="h-4 w-4" /> I'm new here
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden overflow-hidden rounded-3xl border-2 border-purple-100 bg-white shadow-lg md:block">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Tracking No</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Student</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Matric ID</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Sender</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Arrived</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Days</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Size</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Location</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((p) => (
                                        <tr key={p.parcel_id} className="transition-colors hover:bg-purple-50/50">
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900">{p.tracking_no}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{p.recipient_name || '—'}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{p.recipient_matric || '—'}</td>
                                            <td className="px-6 py-4 text-gray-600">{p.sender || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{p.days ?? '—'}d</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{p.size || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{p.location || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">unclaimed</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {!(p.recipient_matric && !p.recipient_name) && (
                                                        <button
                                                            disabled={processing}
                                                            onClick={() => claim(p.parcel_id, 'login')}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
                                                        >
                                                            <LogIn className="h-3.5 w-3.5" /> Yes, it's mine
                                                        </button>
                                                    )}
                                                    <button
                                                        disabled={processing}
                                                        onClick={() => claim(p.parcel_id, 'register')}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-purple-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" /> I'm new here
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td className="px-6 py-12 text-center text-gray-500" colSpan={10}>
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
                    <div className="group overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl">
                        <div className="mb-3 inline-flex rounded-full bg-emerald-100 p-3">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900">Easy Search</h3>
                        <p className="text-sm leading-relaxed text-gray-600">Simply enter your name or tracking number to find your parcels instantly.</p>
                    </div>
                    <div className="group overflow-hidden rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl">
                        <div className="mb-3 inline-flex rounded-full bg-indigo-100 p-3">
                            <LogIn className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900">Quick Claiming</h3>
                        <p className="text-sm leading-relaxed text-gray-600">Found your parcel? Sign in or register to link it to your account instantly.</p>
                    </div>
                    <div className="group overflow-hidden rounded-3xl border-2 border-rose-100 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl">
                        <div className="mb-3 inline-flex rounded-full bg-rose-100 p-3">
                            <CalendarDays className="h-6 w-6 text-rose-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900">Flexible Pickup</h3>
                        <p className="text-sm leading-relaxed text-gray-600">Schedule a pickup time that works for you and receive timely reminders.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
