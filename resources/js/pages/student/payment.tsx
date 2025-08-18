import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { CircleAlert, CircleCheck, CreditCard, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';

type Summary = {
    overdue: number;
    pending: number;
    verified: number;
    total_paid: number;
};

type Row = {
    parcel_id: number;
    parcel_code: string;
    sender: string;
    amount: number;
    arrival: string;
    payment_state: 'Pending' | 'Overdue' | 'Verified';
};

type PaymentRow = {
    payment_id: number;
    parcel_code: string | null;
    amount: number;
    status: 'Verified' | 'Pending';
    submitted_at: string | null;
    verified_at: string | null;
    proof_url: string | null;
};

export default function Payment({ summary, rows, payments }: { summary: Summary; rows: Row[]; payments: PaymentRow[] }) {
    const badge = (state: Row['payment_state']) => {
        if (state === 'Overdue') return 'text-red-600 bg-red-50 border-red-200';
        if (state === 'Verified') return 'text-green-700 bg-green-50 border-green-200';
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    };

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setViewerUrl(null);
        };
        window.addEventListener('keydown', onKey as any);
        return () => window.removeEventListener('keydown', onKey as any);
    }, []);

    return (
        <AppLayout>
            <Head title="Payment Centre" />
            <div className="space-y-6 p-6">
                <h1 className="text-xl font-semibold text-gray-900">Payment Centre</h1>
                <p className="text-sm text-gray-600">Manage your parcel payments</p>

                {/* Tiles */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-start justify-between rounded-xl border p-4">
                        <div>
                            <div className="text-sm text-gray-600">Overdue</div>
                            <div className="mt-2 text-2xl font-bold">{summary.overdue}</div>
                            <div className="mt-1 text-xs text-gray-500">Delay payments</div>
                        </div>
                        <div className="rounded-full bg-red-100 p-2 text-red-600">
                            <CircleAlert className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border p-4">
                        <div>
                            <div className="text-sm text-gray-600">Pending Items</div>
                            <div className="mt-2 text-2xl font-bold">{summary.pending}</div>
                            <div className="mt-1 text-xs text-gray-500">Awaiting payments</div>
                        </div>
                        <div className="rounded-full bg-yellow-100 p-2 text-yellow-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border p-4">
                        <div>
                            <div className="text-sm text-gray-600">Verified</div>
                            <div className="mt-2 text-2xl font-bold">{summary.verified}</div>
                            <div className="mt-1 text-xs text-gray-500">Successfully verified</div>
                        </div>
                        <div className="rounded-full bg-green-100 p-2 text-green-600">
                            <CircleCheck className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleCheck>
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-xl border p-4">
                        <div>
                            <div className="text-sm text-gray-600">Total Paid</div>
                            <div className="mt-2 text-2xl font-bold">RM {summary.total_paid.toFixed(2)}</div>
                            <div className="mt-1 text-xs text-gray-500">Received payments</div>
                        </div>
                        <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                            <WalletCards className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></WalletCards>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <div className="flex items-center gap-2 border-b p-4 text-lg font-semibold">
                        <span className="rounded-full bg-red-100 p-1 text-red-600">
                            <CircleAlert className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleAlert>
                        </span>
                        Payments Required
                    </div>
                    <div className="divide-y">
                        <div className="grid grid-cols-6 gap-2 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
                            <div>Parcel ID</div>
                            <div>Sender</div>
                            <div>Amount</div>
                            <div>Arrival Date</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>
                        {rows.map((r) => (
                            <div
                                key={r.parcel_id}
                                className={`grid grid-cols-6 gap-2 px-4 py-3 ${r.payment_state === 'Overdue' ? 'bg-red-50/40' : ''}`}
                            >
                                <div className="font-semibold">{r.parcel_code}</div>
                                <div className="text-gray-700">{r.sender || '—'}</div>
                                <div className="font-semibold">RM{r.amount.toFixed(2)}</div>
                                <div className="text-gray-700">{r.arrival}</div>
                                <div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${badge(r.payment_state)}`}
                                    >
                                        {r.payment_state === 'Overdue' && (
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                                                />
                                            </svg>
                                        )}
                                        {r.payment_state === 'Pending' && (
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        )}
                                        {r.payment_state === 'Verified' && (
                                            <CircleCheck className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"></CircleCheck>
                                        )}
                                        {r.payment_state}
                                    </span>
                                </div>
                                <div>
                                    {r.payment_state !== 'Verified' ? (
                                        <Link
                                            href={`/student/payment/submit/${r.parcel_id}`}
                                            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Pay Now
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-gray-500">Paid</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment History */}
                <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                            <p className="text-sm text-gray-600">View and manage your payment submissions</p>
                        </div>
                    </div>
                    {payments.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">No payments submitted yet.</div>
                    ) : (
                        <ul className="divide-y">
                            {payments.map((p) => (
                                <li key={p.payment_id} className="flex items-center justify-between gap-4 p-4">
                                    {/* Left: code + status */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full p-1 ${p.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            {p.status === 'Verified' ? (
                                                <CircleCheck className="h-4 w-4" />
                                            ) : (
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="font-medium text-gray-900">{p.parcel_code ?? '—'}</span>
                                        <span
                                            className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${p.status === 'Verified' ? 'border-green-200 bg-green-50 text-green-700' : 'border-yellow-200 bg-yellow-50 text-yellow-700'}`}
                                        >
                                            {p.status === 'Verified' ? (
                                                <CircleCheck className="h-3 w-3" />
                                            ) : (
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                            {p.status}
                                        </span>
                                    </div>
                                    {/* Middle: dates */}
                                    <div className="ml-auto text-right text-xs text-gray-600">
                                        <div>Submitted: {p.submitted_at ?? '—'}</div>
                                        <div>Verified: {p.verified_at ?? '—'}</div>
                                    </div>
                                    {/* Right: proof thumbnail */}
                                    <div className="ml-4">
                                        {p.proof_url ? (
                                            <button onClick={() => setViewerUrl(p.proof_url)} className="block focus:outline-none">
                                                <img
                                                    src={p.proof_url}
                                                    alt="Payment Proof"
                                                    className="h-12 w-16 rounded-md object-cover ring-1 ring-gray-200"
                                                />
                                            </button>
                                        ) : (
                                            <div className="flex h-12 w-16 items-center justify-center rounded-md bg-gray-50 text-gray-400 ring-1 ring-gray-200">
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M3 5h18M3 19h18M3 5l7 7-7 7m18-14l-7 7 7 7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {viewerUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewerUrl(null)}>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <img src={viewerUrl} alt="Payment Proof" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl" />
                            <button
                                onClick={() => setViewerUrl(null)}
                                className="absolute -top-3 -right-3 rounded-full bg-white/90 px-2 py-1 text-sm font-medium text-gray-700 shadow hover:bg-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
