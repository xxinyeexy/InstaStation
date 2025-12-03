import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeData: {
        qr_code: string;
        collection_code: string;
        tracking_no: string;
        qr_code_image: string;
    } | null;
    isLoading?: boolean;
}

const QRCodeModal = ({ isOpen, onClose, qrCodeData, isLoading = false }: QRCodeModalProps) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-card-foreground">{t('collectionQRCode')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t('showThisQRCode')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    <div className="space-y-6">
                        {/* QR Code Display */}
                        <div className="flex justify-center">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                {isLoading ? (
                                    <div className="flex h-48 w-48 items-center justify-center">
                                        <div className="text-center">
                                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-500"></div>
                                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Generating QR Code...</p>
                                        </div>
                                    </div>
                                ) : qrCodeData ? (
                                    <img src={qrCodeData.qr_code_image} alt="QR Code" className="h-48 w-48 rounded-lg bg-white" />
                                ) : (
                                    <div className="flex h-48 w-48 items-center justify-center">
                                        <div className="text-center">
                                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-500"></div>
                                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading QR Code...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collection Details */}
                        {qrCodeData && !isLoading && (
                            <div className="space-y-3 text-center">
                                <div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{qrCodeData.qr_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {t('collectionCode')}:{' '}
                                        <span className="font-['Consolas'] font-bold text-gray-900 dark:text-white">{qrCodeData.collection_code}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
