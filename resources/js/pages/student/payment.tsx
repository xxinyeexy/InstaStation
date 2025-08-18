import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

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

export default function Payment({ summary, rows }: { summary: Summary; rows: Row[] }) {
    const badge = (state: Row['payment_state']) => {
        if (state === 'Overdue') return 'text-red-600 bg-red-50 border-red-200';
        if (state === 'Verified') return 'text-green-700 bg-green-50 border-green-200';
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    };

    return (
        <AppLayout>
            <Head title="Payment Centre" />
            <div className="space-y-6 p-6">
                <h1 className="text-xl font-semibold text-gray-900">Payment Centre</h1>
                <p className="text-sm text-gray-600">Manage your parcel payments</p>

                {/* Tiles */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Overdue</div>
                        <div className="mt-2 text-2xl font-bold">{summary.overdue}</div>
                        <div className="mt-1 text-xs text-gray-500">Delay payments</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Pending Items</div>
                        <div className="mt-2 text-2xl font-bold">{summary.pending}</div>
                        <div className="mt-1 text-xs text-gray-500">Awaiting payments</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Verified</div>
                        <div className="mt-2 text-2xl font-bold">{summary.verified}</div>
                        <div className="mt-1 text-xs text-gray-500">Successfully verified</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Total Paid</div>
                        <div className="mt-2 text-2xl font-bold">RM {summary.total_paid.toFixed(2)}</div>
                        <div className="mt-1 text-xs text-gray-500">Received payments</div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <div className="border-b p-4 text-lg font-semibold">Payments Required</div>
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
                                <div className="font-semibold">$ {r.amount.toFixed(2)}</div>
                                <div className="text-gray-700">{r.arrival}</div>
                                <div>
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badge(r.payment_state)}`}>
                                        {r.payment_state}
                                    </span>
                                </div>
                                <div>
                                    {r.payment_state !== 'Verified' ? (
                                        <Link
                                            href={`/student/payment?parcel=${r.parcel_id}`}
                                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                        >
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
            </div>
        </AppLayout>
    );
}
