import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { CircleCheck, CircleX, Clock, DollarSign, Download, Eye, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';

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
    const [rejectModalPaymentId, setRejectModalPaymentId] = useState<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const typingTimerRef = useRef<number | null>(null);

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
                        setRejectModalPaymentId(null); // Close modal
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

    // Open reject confirmation modal
    const openRejectModal = (paymentId: number) => {
        setRejectModalPaymentId(paymentId);
    };

    // Confirm rejection
    const confirmReject = () => {
        if (rejectModalPaymentId !== null) {
            handleRejectPayment(rejectModalPaymentId);
        }
    };

    // Trigger search using current input value
    const performSearch = () => {
        const value = searchInputRef.current?.value ?? '';
        const params = new URLSearchParams(window.location.search);
        params.set('q', value);
        params.set('status', filters?.status || '');
        router.get(`/staff/payments?${params.toString()}`);
    };

    // Download proof image
    const handleDownloadImage = () => {
        if (!detail) return;
        const url = (detail as any).proof_url as string | null;
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        const filename = detail.tracking_no ? `${detail.tracking_no}.jpg` : 'payment-proof.jpg';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payment',
        href: '/student/verify-payment',
    },
];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Payment Verification</h1>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Review and verify student payment submissions</p>

                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Pending Payments</div>
                            <Clock className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.pending}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Verified Today</div>
                            <CircleCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.verified_today}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">Total Revenue</div>
                            <DollarSign className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">RM{summary.total_revenue.toFixed(2)}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <div className="relative w-full max-w-xl">
                            {/* Search input */}
                            <input
                                ref={searchInputRef}
                                className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                                placeholder="Search parcels..."
                                defaultValue={filters?.q || ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        performSearch();
                                    }
                                }}
                                onChange={() => {
                                    // Debounce live search while typing
                                    if (typingTimerRef.current) {
                                        window.clearTimeout(typingTimerRef.current);
                                    }
                                    typingTimerRef.current = window.setTimeout(() => {
                                        performSearch();
                                    }, 300);
                                }}
                            />
                            <button
                                type="button"
                                onClick={performSearch}
                                className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                                aria-label="Search"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </div>
                        <select
                            className="ml-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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

                    <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                        <div className="col-span-3">Tracking Number</div>
                        <div className="col-span-4">Student</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {list.map((r) => (
                        <div key={r.payment_id} className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3">
                            <div className="col-span-3 font-medium text-foreground">{r.tracking_no ?? '—'}</div>
                            <div className="col-span-4">
                                <div className="text-foreground">{r.student ?? '—'}</div>
                                <div className="text-xs text-muted-foreground">{r.student_matric ?? ''}</div>
                            </div>
                            <div className="col-span-2 font-medium text-foreground">RM{r.amount.toFixed(2)}</div>
                            <div className="col-span-2">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${r.status === 'verified' ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/20 dark:text-green-400 dark:ring-green-500/50' : 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-500/50'}`}
                                >
                                    {r.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {r.status}
                                </span>
                            </div>
                            <div className="col-span-1 ml-auto flex items-center justify-end gap-4 text-muted-foreground">
                                <button onClick={() => setDetail(r as any)} className="hover:text-foreground">
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
                                            onClick={() => openRejectModal(r.payment_id)}
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
                        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-card">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">Payment Details</h2>
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Review payment information and proof</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(detail as any)?.proof_url && (
                                        <button
                                            onClick={handleDownloadImage}
                                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                                        >
                                            <Download className="h-4 w-4" /> Download
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDetail(null)}
                                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <div className="text-gray-500 dark:text-muted-foreground">Tracking Number</div>
                                    <div className="font-medium text-foreground">{detail.tracking_no}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">Amount</div>
                                    <div className="font-medium text-foreground">RM{detail.amount.toFixed(2)}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">Status</div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${detail.status === 'verified' ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/20 dark:text-green-400 dark:ring-green-500/50' : 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-500/50'}`}
                                    >
                                        {detail.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                        {detail.status}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-gray-500 dark:text-muted-foreground">Name</div>
                                    <div className="font-medium text-foreground">{detail.student ?? '—'}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">Student ID</div>
                                    <div className="font-medium text-foreground">{detail.student_matric ?? '—'}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">Submitted</div>
                                    <div className="font-medium text-foreground">
                                        {(detail as any).created_at
                                            ? new Date((detail as any).created_at).toLocaleString()
                                            : (detail.submitted_at ?? '—')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-sm font-medium text-gray-900 dark:text-card-foreground">Payment Proof</div>
                                <div className="mt-2 overflow-hidden rounded-lg ring-1 ring-gray-200">
                                    {(detail as any).proof_url ? (
                                        <img src={(detail as any).proof_url} className="max-h-[60vh] w-full object-contain" />
                                    ) : (
                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-muted-foreground">No proof uploaded.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Confirmation Modal */}
                {rejectModalPaymentId !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-card">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                                    <CircleX className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">Reject Payment</h3>
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Are you sure you want to reject this payment?</p>
                                </div>
                            </div>

                            <div className="mb-6 rounded-md bg-red-50 p-3 dark:bg-red-500/10">
                                <p className="text-sm text-red-800 dark:text-red-400">
                                    This action cannot be undone. The payment will be permanently rejected and removed from the verification queue.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setRejectModalPaymentId(null)}
                                    disabled={processingPayments.has(rejectModalPaymentId)}
                                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={processingPayments.has(rejectModalPaymentId)}
                                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processingPayments.has(rejectModalPaymentId) ? 'Rejecting...' : 'Reject Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
