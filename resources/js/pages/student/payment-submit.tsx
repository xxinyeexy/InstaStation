import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';

type Parcel = {
    parcel_id: number;
    parcel_code: string;
    tracking_no: string;
    sender: string;
    arrival: string;
    fee: number;
};
   

export default function PaymentSubmit({ parcel }: { parcel: Parcel }) {
    const { data, setData, post, processing, errors } = useForm<{ proof: File | null }>({ proof: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!data.proof) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(data.proof);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [data.proof]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        { title: 'Payment', href: '/student/payment' },
        { title: 'Submit Payment', href: `/student/payment/submit/${parcel.parcel_id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment for ${parcel.parcel_code}`} />
            <div className="p-6">
                <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">
                            Payment for <span className="text-green-600">{parcel.parcel_code}</span>
                        </h1>
                        <Link href={route('student.payment')} className="text-sm text-gray-400 hover:text-gray-600">
                            ×
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
                        <div>
                            <div className="text-gray-500">Tracking ID:</div>
                            <div className="font-medium">{parcel.tracking_no}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Sender:</div>
                            <div className="font-medium">{parcel.sender}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Arrival Date:</div>
                            <div className="font-medium">{parcel.arrival}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Collection Fee:</div>
                            <div className="font-medium">RM {parcel.fee.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="my-4 h-px w-full bg-gray-200" />

                    <button className="mb-4 w-full rounded-md border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700">
                        QR Payment
                    </button>

                    <div className="mb-2 text-sm font-semibold text-gray-800">Scan to Pay</div>
                    <p className="mb-3 text-xs text-gray-500">Scan the QR code with your banking app</p>
                    <div className="mb-6 flex justify-center">
                        <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 p-2">
                            <img src="/images/qrpayment.png" alt="DuitNow QR" className="h-40 w-40 object-contain" />
                        </div>
                    </div>
                    <div className="mb-6 text-center text-xs text-gray-600">Amount: RM {parcel.fee.toFixed(2)}</div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 text-sm font-semibold text-gray-800">Upload Payment Proof</div>
                            <p className="mb-3 text-xs text-gray-500">Upload a screenshot or photo of your payment confirmation</p>
                            <label className="group relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-white text-center text-xs text-gray-500 hover:bg-gray-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setData('proof', e.target.files?.[0] ?? null)}
                                />
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Payment Proof Preview" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <span>Click to upload or drag and drop (PNG, JPG up to 10MB)</span>
                                )}
                            </label>
                            {errors.proof && <div className="mt-1 text-xs text-red-600">{errors.proof}</div>}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Link href={route('student.payment')} className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <button
                                disabled={processing}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Submit Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
