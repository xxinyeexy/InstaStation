import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Check, CircleCheck, CircleX, Clock, DollarSign, Eye, X } from 'lucide-react';

type Summary = {
    pending: number;
    verified_today: number;
    total_revenue: number;
    success_rate: number;
};

type Row = {
    payment_id: number;
    tracking_no: string | null;
    student: string | null;
    student_matric: string | null;
    amount: number;
    method: string;
    status: 'pending' | 'verified';
    submitted_at: string | null;
};

export default function VerifyPayment({ summary, rows }: { summary: Summary; rows: Row[] }) {
    return (
        <AppLayout>
            <Head title="Payments" />
            <div className="space-y-6 p-6">
                <h1 className="text-xl font-semibold text-gray-900">Payment Verification</h1>
                <p className="text-sm text-gray-600">Review and verify student payment submissions</p>

                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Pending Payments</div>
                            <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{summary.pending}</div>
                    </div>
                    <div className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Verified Today</div>
                            <CircleCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{summary.verified_today}</div>
                    </div>
                    <div className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Total Revenue</div>
                            <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">RM{summary.total_revenue.toFixed(2)}</div>
                    </div>
                </div>

                <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-4">
                        <input
                            className="w-full max-w-xl rounded-md border px-3 py-2 text-sm"
                            placeholder="Search by tracking number, student name..."
                        />
                        <select className="ml-4 rounded-md border px-3 py-2 text-sm">
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Verified</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
                        <div className="col-span-3">Tracking Number</div>
                        <div className="col-span-4">Student</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {rows.map((r) => (
                        <div key={r.payment_id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                            <div className="col-span-3 font-medium">{r.tracking_no ?? '—'}</div>
                            <div className="col-span-4">
                                <div className="text-gray-900">{r.student ?? '—'}</div>
                                <div className="text-xs text-gray-500">{r.student_matric ?? ''}</div>
                            </div>
                            <div className="col-span-2 font-medium">RM{r.amount.toFixed(2)}</div>
                            <div className="col-span-2">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${r.status === 'verified' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-yellow-50 text-yellow-700 ring-yellow-200'}`}
                                >
                                    {r.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {r.status}
                                </span>
                            </div>
                            <div className="col-span-1 ml-auto flex items-center justify-end gap-4 text-gray-500">
                                {(r as any).proof_url ? (
                                    <a href={(r as any).proof_url} target="_blank" rel="noreferrer" className="hover:text-gray-700">
                                        <Eye className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <Eye className="h-4 w-4 opacity-30" />
                                )}
                                <button
                                    onClick={() => router.post(`/staff/payments/${r.payment_id}/approve`)}
                                    className="text-emerald-600 hover:text-emerald-700"
                                >
                                    <CircleCheck className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => router.post(`/staff/payments/${r.payment_id}/reject`)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <CircleX className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
