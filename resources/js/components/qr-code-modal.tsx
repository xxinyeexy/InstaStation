import { X } from 'lucide-react';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeData: {
        qr_code: string;
        collection_code: string;
        tracking_no: string;
        qr_code_image: string;
    } | null;
}

const QRCodeModal = ({ isOpen, onClose, qrCodeData }: QRCodeModalProps) => {
    if (!isOpen || !qrCodeData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Collection QR Code</h2>
                        <p className="mt-1 text-sm text-gray-600">Show this QR code to collect your parcel</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    <div className="space-y-6">
                        {/* QR Code Display */}
                        <div className="flex justify-center">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <img src={qrCodeData.qr_code_image} alt="QR Code" className="h-64 w-64" />
                            </div>
                        </div>

                        {/* Collection Details */}
                        <div className="space-y-3 text-center">
                            <div>
                                <p className="text-lg font-bold text-gray-900">{qrCodeData.qr_code}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Collection Code: <span className="font-['Consolas'] font-bold text-gray-900">{qrCodeData.collection_code}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
