import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileText, IdCard, MapPin, Package, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type Student = {
    id?: number;
    name?: string;
    email?: string;
    matric?: string;
};

type Payment = {
    amount?: number;
    status?: string;
    verified_by?: number | null;
};

type Parcel = {
    parcel_id: number;
    parcel_code?: string;
    tracking_no?: string;
    created_at?: string;
    schedule?: string | null;
    parcel_status?: string;
    location?: string | null;
    sender?: string | null;
    size?: string | null;
    fee?: number | null;
};

export default function Report({ parcel, student, payment }: { parcel: Parcel; student?: Student; payment?: Payment }) {
    const { t } = useLanguage();
    const parcelId = parcel.parcel_id;

    const download = () => {
        window.location.href = `/parcels/${parcelId}/export/download`;
    };

    const goBack = () => {
        // Use Inertia's router to go back
        router.visit('/student/history');
    };

    const breadcrumbs = [
        { title: t('history'), href: '/student/history' },
        { title: t('parcelReport'), href: `/parcels/${parcelId}/export` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <div className="mx-auto max-w-3xl rounded-xl border bg-white shadow-sm">
                    <div className="flex items-start justify-between border-b p-5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={goBack}
                                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <ArrowLeft size={16} />
                                {t('back')}
                            </button>
                            <div>
                                <div className="font-semibold">{t('parcelReport')} - {parcel.parcel_code || parcel.parcel_id}</div>
                                <div className="text-xs text-gray-500">{t('detailedReportFor')} {parcel.parcel_code || parcel.parcel_id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        <div className="rounded-lg border p-4">
                            <div className="mb-3 font-semibold">{t('parcelInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('parcelID')}:</span>
                                    <span className="ml-1 font-medium">{parcel.parcel_code || parcel.parcel_id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserRound size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('recipient')}:</span>
                                    <span className="ml-1 font-medium">{student?.name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IdCard size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('trackingID')}:</span>
                                    <span className="ml-1 font-medium">{parcel.tracking_no || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IdCard size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('matricID')}:</span>
                                    <span className="ml-1 font-medium">{student?.matric || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('arrivalDate')}:</span>
                                    <span className="ml-1 font-medium">
                                        {parcel.created_at ? new Date(parcel.created_at).toISOString().slice(0, 10) : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-600" />
                                    <span className="text-gray-600">{t('location')}:</span>
                                    <span className="ml-1 font-medium">{parcel.location || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="mb-3 font-semibold">{t('packageDetails')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600">{t('sender')}:</div>
                                    <div className="font-medium">{parcel.sender || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">{t('size')}:</div>
                                    <div className="font-medium">{parcel.size || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="mb-3 font-semibold">{t('paymentInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600">{t('paymentStatus')}:</div>
                                    <div className="font-medium">{payment && payment.verified_by ? t('approved') : t('pendingUnverified')}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">{t('amount')}:</div>
                                    <div className="font-medium">RM{(parcel.fee ?? 1).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="mb-3 font-semibold">{t('collectionInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600">{t('collectionDate')}:</div>
                                    <div className="font-medium">{parcel.schedule ? new Date(parcel.schedule).toISOString().slice(0, 10) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">{t('collectionStatus')}:</div>
                                    <div className="font-medium">{parcel.parcel_status || t('collected')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div>{t('reportGeneratedOn')} {new Date().toLocaleString()}</div>
                            <button
                                onClick={download}
                                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                            >
                                <FileText size={16} /> {t('downloadReport')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
