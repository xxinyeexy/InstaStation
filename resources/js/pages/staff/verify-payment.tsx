import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CircleCheck, CircleX, Clock, DollarSign, Download, Eye, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    submitted_at_date: string | null;
    created_at?: string;
};

export default function VerifyPayment({ summary, rows, filters }: { summary: Summary; rows: Row[]; filters?: { q?: string; status?: string } }) {
    const { t } = useLanguage();
    const { props } = usePage();
    const flashSuccessFromServer = (props as any).flash?.success ?? null;
    const [detail, setDetail] = useState<Row | null>(null);
    const [list, setList] = useState<Row[]>(rows);
    const [searchTerm, setSearchTerm] = useState(filters?.q || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [processingPayments, setProcessingPayments] = useState<Set<number>>(new Set());
    const [rejectModalPaymentId, setRejectModalPaymentId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    // Toast state for approve/reject success notifications
    const [showSuccessToast, setShowSuccessToast] = useState<{ show: boolean; message: string; id: number }>({ show: false, message: '', id: 0 });
    const toastTimerRef = useRef<number | null>(null);

    const triggerSuccessToast = (message: string) => {
        // Always show the toast, using unique ID to force re-render and restart animation
        setShowSuccessToast({ show: true, message, id: Date.now() });

        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = window.setTimeout(() => {
            setShowSuccessToast({ show: false, message: '', id: 0 });
            toastTimerRef.current = null;
        }, 3000);
    };

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    // Also watch for flash success messages from server redirects/refreshes
    useEffect(() => {
        if (flashSuccessFromServer) {
            triggerSuccessToast(flashSuccessFromServer);
        }
    }, [flashSuccessFromServer]);

    // When navigating with filters, ensure local list syncs with server data
    useEffect(() => {
        setList(rows);
    }, [rows]);

    // Client-side filtering similar to parcel page
    const filteredList = list.filter((payment) => {
        // Status filter
        const matchesStatus = statusFilter === '' || payment.status === statusFilter;

        // Search filter - check multiple fields
        const matchesSearch =
            searchTerm === '' ||
            payment.tracking_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.student_matric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.amount.toString().includes(searchTerm) ||
            payment.method?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

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
                    onSuccess: (page) => {
                        const flashMessage = (page.props as any).flash?.success;
                        triggerSuccessToast(flashMessage || 'Payment approved successfully');
                    },
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

        const originalList = [...list];
        setProcessingPayments((prev) => new Set(prev).add(paymentId));

        // Optimistically remove from list
        setList((prev) => prev.filter((x) => x.payment_id !== paymentId));
        if (detail && detail.payment_id === paymentId) {
            setDetail(null);
        }

        try {
            // Make API call
            await router.post(
                `/staff/payments/${paymentId}/reject`,
                { reason: rejectionReason },
                {
                    onSuccess: (page) => {
                        setRejectModalPaymentId(null); // Close modal
                        const flashMessage = (page.props as any).flash?.success;
                        triggerSuccessToast(flashMessage || 'Payment rejected successfully');
                    },
                    onError: (errors) => {
                        console.error('Reject payment error:', errors);
                        // Revert optimistic update on error
                        setList(originalList);
                    },
                },
            );
        } catch (error) {
            console.error('Reject payment error:', error);
            // Revert optimistic update on error
            setList(originalList);
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
        setRejectionReason(''); // Reset reason
    };

    // Confirm rejection
    const confirmReject = () => {
        if (rejectModalPaymentId !== null) {
            handleRejectPayment(rejectModalPaymentId);
        }
    };

    // Function to translate status values
    const getTranslatedStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'pending':
                return t('pending');
            case 'verified':
                return t('verified');
            default:
                return status;
        }
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
            title: t('payment'),
            href: '/student/verify-payment',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment" />


            {/* Local Toast for immediate feedback */}
            {showSuccessToast.show && (
                <div key={showSuccessToast.id} className="fixed top-8 left-1/2 z-[250] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-[#f0fdf4] px-5 py-2.5 shadow-sm border border-emerald-100 flex items-center gap-2.5">
                    <CircleCheck className="h-4 w-4 text-[#065f46]" strokeWidth={2.5} />
                    <span className="text-[14px] font-medium text-[#065f46] tracking-tight">{showSuccessToast.message}</span>
                </div>
            )}
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-foreground">{t('paymentVerification')}</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground">{t('reviewVerifyPayments')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('pendingPayments')}</div>
                            <Clock className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.pending}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('verifiedToday')}</div>
                            <CircleCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{summary.verified_today}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">{t('totalRevenue')}</div>
                            <DollarSign className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">RM{summary.total_revenue.toFixed(2)}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-3 sm:p-4 gap-3 sm:gap-0">
                        <div className="relative w-full max-w-xl">
                            {/* Search input */}
                            <input
                                className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                                placeholder={t('searchParcels')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400">
                                <Search className="h-4 w-4" />
                            </div>
                        </div>
                        <select
                            className="ml-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('allStatus')}</option>
                            <option value="pending">{t('pending')}</option>
                            <option value="verified">{t('verified')}</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                                <div className="col-span-3">{t('parcelID')}</div>
                                <div className="col-span-4">{t('student')}</div>
                                <div className="col-span-2">{t('amount')}</div>
                                <div className="col-span-2">{t('status')}</div>
                                <div className="col-span-1 text-right">{t('actions')}</div>
                            </div>

                            {filteredList.map((r) => (
                                <div key={r.payment_id} className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3">
                                    <div className="col-span-3 font-medium text-foreground">{r.tracking_no ?? '—'}</div>
                                    <div className="col-span-4">
                                        <div className="text-foreground">{r.student ?? '—'}</div>
                                        <div className="text-xs text-muted-foreground">{r.student_matric ?? ''}</div>
                                    </div>
                                    <div className="col-span-2 font-medium text-foreground">RM{r.amount.toFixed(2)}</div>
                                    <div className="col-span-2">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${r.status === 'verified' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/50' : 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-500/50'}`}
                                        >
                                            {r.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                            {getTranslatedStatus(r.status)}
                                        </span>
                                    </div>
                                    <div className="col-span-1 ml-auto flex items-center justify-end gap-4 text-muted-foreground">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetail(r as any);
                                            }}
                                            className="rounded p-1 hover:bg-gray-100 hover:text-foreground dark:hover:bg-accent"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {r.status !== 'verified' && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApprovePayment(r.payment_id);
                                                    }}
                                                    disabled={processingPayments.has(r.payment_id)}
                                                    className={`rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/20 ${processingPayments.has(r.payment_id) ? 'cursor-not-allowed opacity-50' : ''
                                                        }`}
                                                >
                                                    <CircleCheck className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openRejectModal(r.payment_id);
                                                    }}
                                                    title={t('rejectPaymentButton')}
                                                    aria-label={t('rejectPaymentButton')}
                                                    disabled={processingPayments.has(r.payment_id)}
                                                    className={`rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 ${processingPayments.has(r.payment_id) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
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
                    </div>
                </div>
                {detail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-card">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">{t('paymentInformation')}</h2>
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">{t('reviewVerifyPayments')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(detail as any)?.proof_url && (
                                        <button
                                            onClick={handleDownloadImage}
                                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                                        >
                                            <Download className="h-4 w-4" /> {t('download')}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                                <div>
                                    <div className="text-gray-500 dark:text-muted-foreground">{t('trackingNumber')}</div>
                                    <div className="font-medium text-foreground">{detail.tracking_no}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">{t('amount')}</div>
                                    <div className="font-medium text-foreground">RM{detail.amount.toFixed(2)}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">{t('status')}</div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${detail.status === 'verified' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/50' : 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-500/50'}`}
                                    >
                                        {detail.status === 'verified' ? <CircleCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                        {getTranslatedStatus(detail.status)}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-gray-500 dark:text-muted-foreground">{t('name')}</div>
                                    <div className="font-medium text-foreground">{detail.student ?? '—'}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">{t('studentID')}</div>
                                    <div className="font-medium text-foreground">{detail.student_matric ?? '—'}</div>
                                    <div className="mt-2 text-gray-500 dark:text-muted-foreground">{t('submitted')}</div>
                                    <div className="font-medium text-foreground">
                                        {detail.submitted_at_date || '—'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-sm font-medium text-gray-900 dark:text-card-foreground">{t('paymentProof')}</div>
                                <div className="mt-2 overflow-hidden rounded-lg ring-1 ring-gray-200">
                                    {(detail as any).proof_url ? (
                                        <img src={(detail as any).proof_url} className="max-h-[60vh] w-full object-contain" />
                                    ) : (
                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-muted-foreground">{t('noProofUploaded')}</div>
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
                                    The payment will be rejected. The student will be notified and asked to resubmit.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    rows={3}
                                    placeholder="e.g. Reference number missing, wrong amount, blurry photo..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    required
                                ></textarea>
                                {rejectionReason.length === 0 && (
                                    <p className="mt-1 text-xs text-red-500">Please provide a reason for the student.</p>
                                )}
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
                                    disabled={processingPayments.has(rejectModalPaymentId) || !rejectionReason.trim()}
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
