import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Calendar, Info, Maximize2, Sparkles, Upload, X } from 'lucide-react';

type Parcel = {
    parcel_id: number;
    parcel_code: string;
    tracking_no: string;
    sender: string;
    arrival: string;
    fee: number;
};

type ExistingPayment = {
    proof_url: string;
    submitted_at: string;
    rejection_reason?: string | null;
};

export default function PaymentSubmit({ parcel, existing_payment }: { parcel: Parcel; existing_payment?: ExistingPayment }) {
    const { t } = useLanguage();
    const { data, setData, post, processing, errors } = useForm<{ proof: File | null }>({ proof: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState<string>('');

    useEffect(() => {
        if (!data.proof) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(data.proof);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [data.proof]);

    const validateFile = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload an image file (PNG, JPG, JPEG, GIF, or WEBP).';
        }
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return 'File size exceeds 10MB. Please upload a smaller file.';
        }
        return null;
    };

    const handleFileSelect = (file: File | null) => {
        if (!file) {
            setData('proof', null);
            setValidationError('');
            return;
        }
        const error = validateFile(file);
        if (error) {
            setValidationError(error);
            setData('proof', null);
            return;
        }
        setValidationError('');
        setData('proof', file);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.proof) {
            setValidationError('Please upload a payment proof before submitting.');
            return;
        }
        post(`/student/payment/submit/${parcel.parcel_id}`, {
            forceFormData: true,
            onSuccess: () => {
                router.visit('/student/payment');
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payment', href: '/student/payment' },
        { title: 'Submit Payment', href: `/student/payment/submit/${parcel.parcel_id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Submit Payment - ${parcel.parcel_code}`} />

            <div className="flex min-h-[calc(100vh-200px)] items-start justify-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">

                    {/* Header Section from Photo */}
                    <div className="flex items-center justify-between p-8 sm:p-10 border-b border-slate-100 dark:border-zinc-800/50">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {t('paymentFor')} <span className="text-green-500">{parcel.parcel_code}</span>
                        </h1>
                        <Link
                            href="/student/payment"
                            className="text-2xl text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </Link>
                    </div>

                    <div className="p-8 sm:p-10 space-y-10">
                        {/* Information Grid from Photo */}
                        <div className="grid grid-cols-2 gap-y-6">
                            <div className="space-y-1">
                                <div className="text-xs text-slate-400 font-medium">{t('trackingID')}:</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{parcel.tracking_no}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-slate-400 font-medium">{t('sender')}:</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{parcel.sender}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-slate-400 font-medium">{t('arrivalDate')}:</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{parcel.arrival}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-slate-400 font-medium">{t('collectionFee')}:</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">RM {parcel.fee.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-zinc-800" />

                        {/* QR Payment Header from Photo */}
                      

                       
                          <div className="w-full py-2.5 rounded-lg border border-slate-200 flex items-center justify-center dark:bg-zinc-800/50 dark:border-zinc-800">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('qrPayment')}</span>
                        </div>

                        <div className="flex flex-col items-center gap-6 mt-6">
                            <div className="w-full text-left space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('scanToPay')}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('scanQRWithBankingApp')}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <img src="/images/qrpayment.png" alt="DuitNow QR" className="h-44 w-44 object-contain" />
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Amount: RM {parcel.fee.toFixed(2)}</div>
                            </div>
                        </div>
                         {/* Rejection Feedback (If resubmitting) */}
                        {existing_payment && !previewUrl && (
                            <div className="overflow-hidden rounded-[2rem] border border-red-200/50 bg-white shadow-xl dark:border-red-500/10 dark:bg-zinc-900/40 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-gradient-to-r from-red-50/80 via-white to-red-50/80 px-6 py-4 dark:from-red-950/20 dark:via-zinc-900/40 dark:to-red-950/20 border-b border-red-50 dark:border-red-900/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200 dark:shadow-red-900/20">
                                            <AlertCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-black tracking-tight text-red-900 dark:text-red-300 uppercase">{t('attentionRequired')}</h3>
                                            <p className="text-[11px] font-medium text-red-600/70 dark:text-red-400/50">{t('previousSubmissionDeclined')}</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-red-100/50 px-3 py-1 dark:bg-red-900/30">
                                        <Calendar className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                        <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">{t('previousSubmission')}: {existing_payment.submitted_at}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                                        {existing_payment.proof_url && (
                                            <div className="relative shrink-0 mx-auto sm:mx-0">
                                                <div className="group relative overflow-hidden rounded-[1.5rem] bg-slate-100 p-2 ring-1 ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700">
                                                    <img src={existing_payment.proof_url} className="h-32 w-28 object-cover rounded-[1rem]" alt="Rejected proof" />
                                                    <div className="absolute top-4 right-4">
                                                        <div className="rounded-full bg-red-500 px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">{t('rejected')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-4">
                                            <div className="relative group overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-red-50/40 to-white p-5 dark:from-red-950/10 dark:to-transparent border border-red-100/50 dark:border-red-900/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-800 dark:text-red-400">{t('officialStaffFeedback')}</span>
                                                </div>
                                                <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 font-medium italic">
                                                    "{existing_payment.rejection_reason || t('noSpecificReasonProvided')}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Upload Section Improved */}
                        <form onSubmit={onSubmit} className="space-y-6 pt-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                    <Upload className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('uploadPaymentProof')}</h3>
                            </div>

                            <label
                                className={`group relative flex flex-col items-center justify-center h-56 w-full cursor-pointer rounded-[2.5rem] border-2 border-dashed transition-all duration-300 ${isDragging
                                    ? 'border-green-500 bg-green-50/50'
                                    : validationError || errors.proof
                                        ? 'border-red-400 bg-red-50/50'
                                        : 'border-slate-200 bg-slate-50/50 hover:border-green-400 hover:bg-white dark:border-zinc-800 dark:hover:border-green-500/50'
                                    }`}
                                onDragEnter={() => setIsDragging(true)}
                                onDragLeave={() => setIsDragging(false)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                                }}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                                />
                                {previewUrl ? (
                                    <div className="relative h-full w-full p-4">
                                        <img src={previewUrl} className="h-full w-full object-contain rounded-2xl" alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleFileSelect(null); }}
                                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-green-500 transition-colors">
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center ring-1 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-700">
                                            <Upload className="h-7 w-7 transition-transform group-hover:-translate-y-1" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase tracking-widest">{t('clickToUpload')}</p>
                                            <p className="text-[10px] font-bold mt-1 uppercase opacity-60">PNG, JPG or WebP (Max 10MB)</p>
                                        </div>
                                    </div>
                                )}
                            </label>

                            {(validationError || errors.proof) && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest px-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{validationError || errors.proof}</span>
                                </div>
                            )}

                            <div className="flex gap-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10">
                                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-400/80 font-medium">
                                    <span className="font-black uppercase tracking-[0.2em] mr-2">{t('important')}:</span>
                                    {t('makeSureReceiptClear')}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <Link
                                    href="/student/payment"
                                    className="flex-1 flex items-center justify-center px-8 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 uppercase tracking-widest transition-all hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-slate-400 dark:hover:bg-zinc-800"
                                >
                                    {t('cancel')}
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-[2] relative group overflow-hidden px-8 py-4 rounded-2xl bg-slate-900 text-sm font-black text-white uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {processing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : t('submitPayment')}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
