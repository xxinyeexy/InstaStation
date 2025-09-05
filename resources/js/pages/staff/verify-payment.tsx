import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { CircleCheck, CircleX, Clock, DollarSign, Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function VerifyPayment({ summary, rows, filters }: { summary: Summary; rows: Row[]; filters?: { q?: string; status?: string } }) {
    const [detail, setDetail] = useState<Row | null>(null);
    const [list, setList] = useState<Row[]>(rows);
    const [processingPayments, setProcessingPayments] = useState<Set<number>>(new Set());

    // When navigating with filters, ensure local list syncs with server data
    useEffect(() => {
        setList(rows);
    }, [rows]);

    // Handle approve payment with error handling
    const handleApprovePayment = async (paymentId: number) => {
        if (processingPayments.has(paymentId)) return; // Prevent multiple clicks

        setProcessingPayments((prev) => new Set(prev).add(paymentId));

        try {
            // Update UI optimistically
            setList((prev) => prev.map((x) => (x.payment_id === paymentId ? { ...x, status: 'verified' } : x)));
            if (detail && detail.payment_id === paymentId) {
                setDetail((prev) => (prev ? { ...prev, status: 'verified' } : prev));
            }

            // Make API call
            await router.post(
                `/staff/payments/${paymentId}/approve`,
                {},
                {
                    onError: (errors) => {
                        console.error('Approve payment error:', errors);
                        // Revert optimistic update on error
                        setList((prev) => prev.map((x) => (x.payment_id === paymentId ? { ...x, status: 'pending' } : x)));
                        if (detail && detail.payment_id === paymentId) {
                            setDetail((prev) => (prev ? { ...prev, status: 'pending' } : prev));
                        }
                    },
                },
            );
        } catch (error) {
            console.error('Approve payment error:', error);
            // Revert optimistic update on error
            setList((prev) => prev.map((x) => (x.payment_id === paymentId ? { ...x, status: 'pending' } : x)));
            if (detail && detail.payment_id === paymentId) {
                setDetail((prev) => (prev ? { ...prev, status: 'pending' } : prev));
            }
        } finally {
            setProcessingPayments((prev) => {
                const newSet = new Set(prev);
                newSet.delete(paymentId);
                return newSet;
            });
        }
    };

    // Handle reject payment with error handling
    const handleRejectPayment = async (paymentId: number) => {
        if (processingPayments.has(paymentId)) return; // Prevent multiple clicks

        setProcessingPayments((prev) => new Set(prev).add(paymentId));

        try {
            // Make API call
            await router.post(
                `/staff/payments/${paymentId}/reject`,
                {},
                {
                    onSuccess: () => {
                        // Remove from list after successful rejection
                        setList((prev) => prev.filter((x) => x.payment_id !== paymentId));
                        if (detail && detail.payment_id === paymentId) {
                            setDetail(null);
                        }
                    },
                    onError: (errors) => {
                        console.error('Reject payment error:', errors);
                    },
                },
            );
        } catch (error) {
            console.error('Reject payment error:', error);
        } finally {
            setProcessingPayments((prev) => {
                const newSet = new Set(prev);
                newSet.delete(paymentId);
                return newSet;
            });
        }
    };
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
                            placeholder="Search by parcel code, student name..."
                            defaultValue={filters?.q || ''}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const input = e.currentTarget as HTMLInputElement;
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('q', input.value);
                                    params.set('status', filters?.status || '');
                                    router.get(`/staff/payments?${params.toString()}`);
                                }
                            }}
                        />
                        <select
                            className="ml-4 rounded-md border px-3 py-2 text-sm"
                            defaultValue={filters?.status || ''}
                            onChange={(e) => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('q', (document.querySelector('input[placeholder^=Search]') as HTMLInputElement)?.value || '');
                                params.set('status', e.target.value);
                                router.get(`/staff/payments?${params.toString()}`);
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
                        <div className="col-span-3">Tracking Number</div>
                        <div className="col-span-4">Student</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {list.map((r) => (
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
                                <button onClick={() => setDetail(r as any)} className="hover:text-gray-700">
                                    <Eye className="h-4 w-4" />
                                </button>
                                {r.status !== 'verified' && (
                                    <>
                                        <button
                                            onClick={() => handleApprovePayment(r.payment_id)}
                                            disabled={processingPayments.has(r.payment_id)}
                                            className={`text-emerald-600 hover:text-emerald-700 ${
                                                processingPayments.has(r.payment_id) ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                        >
                                            <CircleCheck className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRejectPayment(r.payment_id)}
                                            disabled={processingPayments.has(r.payment_id)}
                                            className={`text-red-500 hover:text-red-600 ${
                                                processingPayments.has(r.payment_id) ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                        >
                                            <CircleX className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {detail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                                    <p className="text-sm text-gray-600">Review payment information and proof</p>
                                </div>
                                <button
                                    onClick={() => setDetail(null)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <div className="text-gray-500">Tracking Number</div>
                                    <div className="font-medium">{detail.tracking_no}</div>
                                    <div className="mt-2 text-gray-500">Amount</div>
                                    <div className="font-medium">RM{detail.amount.toFixed(2)}</div>
                                    <div className="mt-2 text-gray-500">Status</div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${detail.status === 'verified' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-yellow-50 text-yellow-700 ring-yellow-200'}`}
                                    >
                                        {detail.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                        {detail.status}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-gray-500">Name</div>
                                    <div className="font-medium">{detail.student ?? '—'}</div>
                                    <div className="mt-2 text-gray-500">Student ID</div>
                                    <div className="font-medium">{detail.student_matric ?? '—'}</div>
                                    <div className="mt-2 text-gray-500">Submitted</div>
                                    <div className="font-medium">
                                        {(detail as any).created_at
                                            ? new Date((detail as any).created_at).toLocaleString()
                                            : (detail.submitted_at ?? '—')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-sm font-medium text-gray-900">Payment Proof</div>
                                <div className="mt-2 overflow-hidden rounded-lg ring-1 ring-gray-200">
                                    {(detail as any).proof_url ? (
                                        <img src={(detail as any).proof_url} className="max-h-[60vh] w-full object-contain" />
                                    ) : (
                                        <div className="p-6 text-center text-sm text-gray-500">No proof uploaded.</div>
                                    )}
                                </div>
                            </div>
                            {detail.status !== 'verified' && (
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => handleApprovePayment(detail.payment_id)}
                                        disabled={processingPayments.has(detail.payment_id)}
                                        className={`inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 ${
                                            processingPayments.has(detail.payment_id) ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                    >
                                        <CircleCheck className="h-4 w-4" />
                                        {processingPayments.has(detail.payment_id) ? 'Processing...' : 'Verify Payment'}
                                    </button>
                                    <button
                                        onClick={() => handleRejectPayment(detail.payment_id)}
                                        disabled={processingPayments.has(detail.payment_id)}
                                        className={`inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 ${
                                            processingPayments.has(detail.payment_id) ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                    >
                                        <CircleX className="h-4 w-4" />
                                        {processingPayments.has(detail.payment_id) ? 'Processing...' : 'Reject Payment'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
