import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
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
    updated_at?: string;
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
            <Head title={t('parcelReport')} />
            <div className="p-6">
                <div className="mx-auto max-w-3xl rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start justify-between border-b dark:border-gray-700 p-5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={goBack}
                                className="inline-flex items-center gap-1 rounded-md border dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <ArrowLeft size={16} />
                                {t('back')}
                            </button>
                            <div>
                                <div className="font-semibold dark:text-white">{t('parcelReport')} - {parcel.parcel_code || parcel.parcel_id}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('detailedReportFor')} {parcel.parcel_code || parcel.parcel_id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        <div className="rounded-lg border dark:border-gray-700 p-4">
                            <div className="mb-3 font-semibold dark:text-white">{t('parcelInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('parcelID')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">{parcel.parcel_code || parcel.parcel_id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserRound size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('recipient')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">{student?.name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IdCard size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('trackingID')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">{parcel.tracking_no || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IdCard size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('matricID')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">{student?.matric || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('arrivalDate')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">
                                        {parcel.created_at ? new Date(parcel.created_at).toLocaleDateString('en-CA') : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('location')}:</span>
                                    <span className="ml-1 font-medium dark:text-white">{parcel.location || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border dark:border-gray-700 p-4">
                            <div className="mb-3 font-semibold dark:text-white">{t('packageDetails')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('sender')}:</div>
                                    <div className="font-medium dark:text-white">{parcel.sender || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('size')}:</div>
                                    <div className="font-medium dark:text-white">{parcel.size || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border dark:border-gray-700 p-4">
                            <div className="mb-3 font-semibold dark:text-white">{t('paymentInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('paymentStatus')}:</div>
                                    <div className="font-medium dark:text-white">{payment && payment.verified_by ? t('approved') : t('pendingUnverified')}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('amount')}:</div>
                                    <div className="font-medium dark:text-white">RM{(parcel.fee ?? 1).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border dark:border-gray-700 p-4">
                            <div className="mb-3 font-semibold dark:text-white">{t('collectionInformation')}</div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('collectionDate')}:</div>
                                    <div className="font-medium dark:text-white">
                                        {(parcel.parcel_status === 'Collected' && parcel.updated_at) || parcel.schedule
                                            ? new Date(
                                                parcel.parcel_status === 'Collected' && parcel.updated_at
                                                    ? parcel.updated_at
                                                    : parcel.schedule!,
                                            ).toLocaleDateString('en-CA')
                                            : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">{t('collectionStatus')}:</div>
                                    <div className="font-medium dark:text-white">{parcel.parcel_status || t('collected')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div>{t('reportGeneratedOn')} {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                            <button
                                onClick={download}
                                className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
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
