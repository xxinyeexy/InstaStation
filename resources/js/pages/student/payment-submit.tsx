import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

type Parcel = {
    parcel_id: number;
    parcel_code: string;
    tracking_no: string;
    sender: string;
    arrival: string;
    fee: number;
};
   

export default function PaymentSubmit({ parcel }: { parcel: Parcel }) {
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
        // Check file type - must be image
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload an image file (PNG, JPG, JPEG, GIF, or WEBP).';
        }

        // Check file size - max 10MB
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            return 'File size exceeds 10MB. Please upload a smaller file.';
        }

        // Check if file is corrupted by trying to read it
        if (file.size === 0) {
            return 'The file appears to be empty or corrupted. Please upload a valid image.';
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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that a file is selected
        if (!data.proof) {
            setValidationError('Please upload a payment proof before submitting.');
            return;
        }

        // Double-check file validity before submission
        const error = validateFile(data.proof);
        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError('');
        
        // useForm already tracks `data`; just force FormData for file upload
        post(`/student/payment/submit/${parcel.parcel_id}`, {
            forceFormData: true,
            onSuccess: () => {
                // Navigate back to payment page with success indicator
                router.visit('/student/payment?payment_submitted=true', {
                    only: ['summary', 'rows', 'payments', 'notifications'],
                    preserveState: false,
                    preserveScroll: false,
                });
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'payment', href: '/student/payment' },
        { title: 'submitPayment', href: `/student/payment/submit/${parcel.parcel_id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment for ${parcel.parcel_code}`} />
            <div className="p-6">
                <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {t('paymentFor')} <span className="text-green-600">{parcel.parcel_code}</span>
                        </h1>
                        <Link href={route('student.payment')} className="text-sm text-gray-400 hover:text-gray-600">
                            ×
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
                        <div>
                            <div className="text-gray-500">{t('trackingID')}:</div>
                            <div className="font-medium">{parcel.tracking_no}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">{t('sender')}:</div>
                            <div className="font-medium">{parcel.sender}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">{t('arrivalDate')}:</div>
                            <div className="font-medium">{parcel.arrival}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">{t('collectionFee')}:</div>
                            <div className="font-medium">RM {parcel.fee.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="my-4 h-px w-full bg-gray-200" />

                    <button className="mb-4 w-full rounded-md border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700">
                        {t('qrPayment')}
                    </button>

                    <div className="mb-2 text-sm font-semibold text-gray-800">{t('scanToPay')}</div>
                    <p className="mb-3 text-xs text-gray-500">{t('scanQRWithBankingApp')}</p>
                    <div className="mb-6 flex justify-center">
                        <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 p-2">
                            <img src="/images/qrpayment.png" alt="DuitNow QR" className="h-40 w-40 object-contain" />
                        </div>
                    </div>
                    <div className="mb-6 text-center text-xs text-gray-600">{t('amount')}: RM {parcel.fee.toFixed(2)}</div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-800">{t('uploadPaymentProof')}</span>
                            </div>
                            <p className="mb-4 text-xs text-gray-500">{t('uploadScreenshotOrPhoto')}</p>
                            <label 
                                className={`group relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-all duration-200 ${
                                    isDragging 
                                        ? 'scale-[1.02] border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                                        : validationError || errors.proof
                                            ? 'border-red-400 bg-red-50/50'
                                            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-green-400 hover:shadow-md'
                                }`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                                />
                                {previewUrl ? (
                                    <div className="relative h-full w-full animate-in fade-in zoom-in duration-200">
                                        <img src={previewUrl} alt="Payment Proof Preview" className="h-full w-full object-contain p-3" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleFileSelect(null);
                                            }}
                                            className="absolute top-3 right-3 rounded-full bg-red-500 p-2 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                            aria-label="Remove file"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs font-medium text-gray-700 truncate">{data.proof?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`space-y-3 px-6 transition-all duration-200 ${isDragging ? 'scale-105 text-green-600' : 'text-gray-500 group-hover:text-green-600'}`}>
                                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 ${
                                            isDragging 
                                                ? 'bg-green-100 ring-4 ring-green-200' 
                                                : 'bg-gray-100 group-hover:bg-green-50 group-hover:ring-2 group-hover:ring-green-200'
                                        }`}>
                                            <svg className={`h-8 w-8 transition-transform duration-200 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                {isDragging ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="animate-pulse">Drop your file here</span>
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-green-600">Click to upload</span>
                                                        <span className="text-gray-500"> or drag and drop</span>
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">PNG, JPG, GIF or WEBP</p>
                                            <p className="text-xs text-gray-400 font-medium">(Maximum size: 10MB)</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                            {validationError && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 animate-in slide-in-from-top-2 duration-200">
                                    <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-red-700 font-medium">{validationError}</span>
                                </div>
                            )}
                            {errors.proof && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                                    <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-red-700 font-medium">{errors.proof}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Link href={route('student.payment')} className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                {t('cancel')}
                            </Link>
                            <button
                                disabled={processing}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {t('submitPayment')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
