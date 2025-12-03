import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, ArrowLeft, Camera, CircleCheck, QrCode, Search, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const ParcelRegistrationForm = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        trackingNumber: '',
        sender: '',
        size: '',
        location: '',
        studentName: '',
        matricId: '',
    });

    const Toast = ({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) => {
        const iconMap = {
            success: <CircleCheck className="h-5 w-5 text-green-600" />,
            error: <XCircle className="h-5 w-5 text-red-600" />,
            warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        };

        const bgMap = {
            success: 'bg-green-100 dark:bg-green-500/20 border-green-300 dark:border-green-500/50 text-green-800 dark:text-green-300',
            error: 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300',
            warning: 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-300 dark:border-yellow-500/50 text-yellow-800 dark:text-yellow-300',
        };

        return (
            <div
                className={`animate-fade-in fixed top-6 left-1/2 z-50 flex w-fit -translate-x-1/2 items-center gap-2 rounded-md border px-4 py-2 shadow-md ${bgMap[type]}`}
            >
                {iconMap[type]}
                <span className="text-sm font-medium">{message}</span>
            </div>
        );
    };
    const [errorToast, setErrorToast] = useState<{ show: boolean; message: string }>({
        show: false,
        message: '',
    });
    const showErrorToast = (message: string) => {
        setErrorToast({ show: true, message });
        setTimeout(() => setErrorToast({ show: false, message: '' }), 3000);
    };
    const [showRegisterToast, setShowRegisterToast] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isScanning, setIsScanning] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [highlightTracking, setHighlightTracking] = useState(false);

    type Student = {
        student_id: string;
        student_name: string;
        email: string;
        matric_id?: string;
    };

    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [isSelectingStudent, setIsSelectingStudent] = useState(false);
    const [highlightMatric, setHighlightMatric] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        if (field === 'studentName' && isSelectingStudent) {
            return; // 🔒 prevent overwrite after user selects a result
        }

        setFormData((prev) => ({ ...prev, [field]: value }));

        if (field === 'studentName') {
            // Cancel previous timeout
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            // Show search box immediately on any input
            setShowSearchResults(true);

            if (value.length >= 1) {
                searchTimeoutRef.current = setTimeout(() => {
                    handleSearch(value);
                }, 300);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
                setSearchError('');
            }
        }
    };

    const handleQRScan = () => {
        setIsScanning(true);
        // Simulate QR code scan
        setTimeout(() => {
            setFormData((prev) => ({
                ...prev,
                trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                sender: 'Express Delivery Co.',
                size: 'Medium',
            }));
            setIsScanning(false);
        }, 2000);
    };

    const handleSearch = async (query: string) => {
        if (!query || query.length < 1) {
            setSearchResults([]);
            setShowSearchResults(false);
            setSearchError('');
            return;
        }

        setIsSearching(true);
        setShowSearchResults(true);
        setSearchError('');

        try {
            const response = await fetch(`/api/students/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching students:', error);
            setSearchResults([]);
            setSearchError('Failed to search students. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleStudentSelect = (student: any) => {
        setIsSelectingStudent(true);

        setFormData((prev) => ({
            ...prev,
            studentName: student.student_name,
            matricId: student.matric_id || '',
        }));

        setShowSearchResults(false);
        setSearchResults([]);
        setHighlightMatric(true);

        setTimeout(() => setHighlightMatric(false), 1500);

        // Reset flag after a tiny delay (helps with debounce conflict)
        setTimeout(() => setIsSelectingStudent(false), 200);
    };

    const handleRegister = async () => {
        // Prevent double submission
        if (isSubmitting) return;

        // Comprehensive validation
        if (!formData.trackingNumber.trim()) {
            showErrorToast('Please enter a tracking number');
            return;
        }

        if (formData.trackingNumber.trim().length < 5) {
            showErrorToast('Tracking number must be at least 5 characters long');
            return;
        }

        if (!formData.sender.trim()) {
            showErrorToast('Please enter sender information');
            return;
        }

        if (formData.sender.trim().length < 3) {
            showErrorToast('Sender name must be at least 3 characters long');
            return;
        }

        if (!formData.size) {
            showErrorToast('Please select a parcel size');
            return;
        }

        if (!formData.location.trim()) {
            showErrorToast('Please enter storage location');
            return;
        }

        setIsSubmitting(true);

        // Transform the data to match Laravel controller expectations
        const requestData = {
            tracking_no: formData.trackingNumber.trim(),
            size: formData.size || null,
            sender: formData.sender.trim(),
            location: formData.location.trim() || null,
            student_id: formData.matricId.trim() || '',
            recipient_name: formData.studentName.trim() || null,
            recipient_matric: formData.matricId.trim() || null,
            qr_code: null,
        };

        // Use Axios for API request to handle JSON response and CSRF automatically
        axios.post('/parcels', requestData)
            .then((response) => {
                // Show success message
                setShowRegisterToast(true);
                setTimeout(() => setShowRegisterToast(false), 3000);

                // Clear form
                handleCancel();
            })
            .catch((error) => {
                console.error('Registration error:', error);

                if (error.response) {
                    // Handle server errors (422, 500, etc.)
                    const status = error.response.status;
                    const data = error.response.data;

                    if (status === 422 && data.errors) {
                        // Validation errors
                        const errorMessages = Object.entries(data.errors);
                        if (errorMessages.length > 0) {
                            errorMessages.forEach(([field, messages], index) => {
                                setTimeout(() => {
                                    const msg = Array.isArray(messages) ? messages[0] : messages;

                                    // Provide user-friendly messages for specific errors
                                    if (field === 'tracking_no' && typeof msg === 'string' && msg.includes('already been taken')) {
                                        showErrorToast('⚠️ This tracking number already exists in the system. Please use a different tracking number or check existing parcels.');
                                    } else {
                                        showErrorToast(msg as string);
                                    }
                                }, index * 500);
                            });
                        }
                    } else if (data.message) {
                        showErrorToast(data.message);
                    } else {
                        showErrorToast(`Error ${status}: ${error.response.statusText}`);
                    }
                } else if (error.request) {
                    // Network error
                    showErrorToast('Network error. Please check your connection.');
                } else {
                    showErrorToast('An unexpected error occurred.');
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleCancel = () => {
        setFormData({
            trackingNumber: '',
            sender: '',
            size: '',
            location: '',
            studentName: '',
            matricId: '',
        });
        setShowSearchResults(false);
        setSearchResults([]);
    };

    const html5QrCodeRef = useRef<any>(null);

    useEffect(() => {
        if (isScanning) {
            const qrRegionId = 'qr-reader';
            html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
            html5QrCodeRef.current
                .start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 300, height: 300 } },
                    (decodedText: string) => {
                        console.log('QR Code detected:', decodedText);
                        setFormData((prev) => ({
                            ...prev,
                            trackingNumber: decodedText,
                        }));
                        setShowToast(true);
                        setHighlightTracking(true);
                        setTimeout(() => setShowToast(false), 2500);
                        setTimeout(() => setHighlightTracking(false), 1500);
                        setIsScanning(false);
                        if (html5QrCodeRef.current) {
                            try {
                                html5QrCodeRef.current
                                    .stop()
                                    .then(() => {
                                        html5QrCodeRef.current?.clear();
                                    })
                                    .catch(() => {
                                        // Ignore errors if already stopped
                                    });
                            } catch (e) {
                                // Ignore synchronous errors
                            }
                        }
                    },
                    (errorMessage: string) => {
                        // Optionally handle scan errors
                    },
                )
                .catch((err: any) => {
                    alert('Unable to start the camera: ' + err);
                    setIsScanning(false);
                });
        }
        return () => {
            if (html5QrCodeRef.current) {
                try {
                    html5QrCodeRef.current
                        .stop()
                        .then(() => {
                            html5QrCodeRef.current?.clear();
                        })
                        .catch(() => {
                            // Ignore errors if already stopped
                        });
                } catch (e) {
                    // Ignore synchronous errors
                }
            }
        };
        // eslint-disable-next-line
    }, [isScanning]);

    // Handle clicking outside search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const breadcrumbs = [
        { title: t('parcels'), href: '/staff/parcel' },
        { title: t('addParcel'), href: '/staff/add-parcel' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {showRegisterToast && <Toast type="success" message=" Parcel registered successfully!" />}
            {errorToast.show && <Toast type="error" message={errorToast.message} />}

            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-background">
                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(-100px); }
                        100% { transform: translateY(100px); }
                    }
                    @keyframes indeterminate-bar {
                        0% { margin-left: 0%; width: 40%; }
                        50% { margin-left: 60%; width: 40%; }
                        100% { margin-left: 0%; width: 40%; }
                    }
                    .animate-indeterminate-bar {
                        animation: indeterminate-bar 1.5s infinite cubic-bezier(0.4,0,0.2,1);
                    }
                `}</style>
                <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white shadow-sm dark:bg-card">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-border p-4 sm:p-6">
                        <button
                            onClick={() => (window.history.length > 1 ? window.history.back() : router.visit('/parcels'))}
                            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">{t('back')}</span>
                        </button>
                    </div>

                    {/* Title */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4">
                        <h1 className="mb-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-card-foreground">📦 {t('registerNewParcel')}</h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground">{t('scanQRToAutoFill')}</p>
                    </div>

                    {/* QR Scanner Area */}
                    <div className="mb-4 sm:mb-6 px-4 sm:px-6">
                        {/* Toast Notification */}
                        {showToast && <Toast type="success" message={t('trackingNumberFilled')} />}

                        {/* Pink Modern QR Scanner Section */}
                        <div className="flex justify-center">
                            <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl border-4 border-pink-500 bg-pink-50 dark:border-pink-400 dark:bg-pink-500/20">
                                {/* Grid Overlay */}
                                <div
                                    className="pointer-events-none absolute inset-0 z-0"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                                        backgroundSize: '32px 32px',
                                    }}
                                />
                                {/* Cancel Button */}
                                {isScanning && (
                                    <button
                                        className="absolute top-4 right-4 z-20 rounded-full bg-white/20 p-2 text-pink-500 transition-colors hover:bg-white/40 dark:bg-black/20 dark:text-pink-400 dark:hover:bg-black/40"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsScanning(false);
                                        }}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                )}
                                {/* Scanner Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {/* Corner Brackets */}
                                    <div className="pointer-events-none absolute inset-0 z-10">
                                        <div className="absolute top-6 left-6 h-10 w-10 rounded-tl-xl border-t-4 border-l-4 border-pink-300 dark:border-pink-400"></div>
                                        <div className="absolute top-6 right-6 h-10 w-10 rounded-tr-xl border-t-4 border-r-4 border-pink-300 dark:border-pink-400"></div>
                                        <div className="absolute bottom-6 left-6 h-10 w-10 rounded-bl-xl border-b-4 border-l-4 border-pink-300 dark:border-pink-400"></div>
                                        <div className="absolute right-6 bottom-6 h-10 w-10 rounded-br-xl border-r-4 border-b-4 border-pink-300 dark:border-pink-400"></div>
                                    </div>
                                    {/* Animated Scan Line */}
                                    {isScanning && (
                                        <div
                                            className="animate-horizontal-scan absolute right-10 left-10 z-20 h-1 rounded-full bg-gradient-to-r from-transparent via-pink-300 to-transparent dark:via-pink-400"
                                            style={{ top: 80 }}
                                        />
                                    )}
                                    {/* Camera Preview */}
                                    {isScanning && <div id="qr-reader" className="absolute inset-0 z-10 h-full w-full overflow-hidden rounded-3xl" />}
                                    {/* Indeterminate Progress Bar */}
                                    {isScanning && (
                                        <>
                                            <div className="absolute right-0 bottom-0 left-0 z-30 px-8 pb-8">
                                                <div className="h-3 overflow-hidden rounded-full bg-pink-200/40 dark:bg-pink-500/40">
                                                    <div
                                                        className="animate-indeterminate-bar h-full bg-pink-400 dark:bg-pink-300"
                                                        style={{ width: '40%' }}
                                                    /></div>
                                                <div className="mt-2 text-center text-lg font-semibold tracking-wide text-pink-500 dark:text-pink-400">
                                                    {t('scanning')}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {/* Tap to Scan State */}
                                    {!isScanning && (
                                        <div className="flex h-full flex-col items-center justify-center">
                                            <div className="mb-8">
                                                <div className="rounded-full bg-pink-100 p-8 dark:bg-pink-500/20">
                                                    <QrCode className="h-20 w-20 text-pink-500 dark:text-pink-400" />
                                                </div>
                                            </div>
                                            <h3 className="mb-2 text-3xl font-extrabold text-pink-600 dark:text-pink-400">{t('tapToScanQRCode')}</h3>
                                            <p className="mb-4 text-lg text-pink-400 dark:text-pink-300">
                                                {t('pointCameraAtParcel')}
                                            </p>
                                            <div className="flex items-center gap-2 text-base font-medium text-pink-400 dark:text-pink-300">
                                                <Camera className="h-5 w-5" />
                                                <span>{t('aiPoweredDetection')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Animations */}
                                <style>{`
                                    @keyframes horizontal-scan {
                                        0% { top: 80px; }
                                        100% { top: 340px; }
                                    }
                                    .animate-horizontal-scan {
                                        animation: horizontal-scan 2s linear infinite alternate;
                                    }
                                `}</style>
                                {/* Click to start scanning */}
                                {!isScanning && (
                                    <button
                                        className="absolute inset-0 z-30 h-full w-full cursor-pointer"
                                        onClick={() => setIsScanning(true)}
                                        aria-label="Start scanning"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Parcel Information */}
                    <div className="mb-4 sm:mb-6 px-4 sm:px-6">
                        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-medium text-gray-900 dark:text-card-foreground">{t('parcelInformation')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('trackingNumber')} *</label>
                                <input
                                    type="text"
                                    placeholder={t('enterTrackingNumber')}
                                    value={formData.trackingNumber}
                                    onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                                    className={`w-full rounded-md border border-border bg-background px-3 py-2 text-foreground transition-colors focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none ${highlightTracking ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-300 dark:border-border'}`}
                                    readOnly={isScanning}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('size')}</label>
                                <select
                                    value={formData.size}
                                    onChange={(e) => handleInputChange('size', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-border"
                                >
                                    <option value="">{t('selectSize')}</option>
                                    <option value="Small">{t('small')}</option>
                                    <option value="Medium">{t('medium')}</option>
                                    <option value="Large">{t('large')}</option>
                                    <option value="Extra Large">{t('extraLarge')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('sender')} *</label>
                                <input
                                    type="text"
                                    placeholder={t('senderName')}
                                    value={formData.sender}
                                    onChange={(e) => handleInputChange('sender', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-border"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('location')}</label>
                                <input
                                    type="text"
                                    placeholder={t('storageLocation')}
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-border"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Student Information */}
                    <div className="mb-4 sm:mb-6 px-4 sm:px-6">
                        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-medium text-gray-900 dark:text-card-foreground">{t('studentInformation')}</h2>
                        <p className="mb-3 text-xs sm:text-sm text-gray-600 dark:text-muted-foreground">{t('searchRecipientDatabase')}</p>

                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('studentName')}</label>
                            <div className="flex gap-2" ref={searchContainerRef}>
                                <input
                                    type="text"
                                    placeholder={t('enterRecipientFullName')}
                                    value={formData.studentName}
                                    onChange={(e) => handleInputChange('studentName', e.target.value)}
                                    className="flex-1 rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-border"
                                />
                                <button
                                    onClick={() => handleSearch(formData.studentName)}
                                    className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-muted dark:text-foreground dark:hover:bg-accent"
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-pink-200"></div>
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    {isSearching ? t('searching') : t('search')}
                                </button>
                            </div>

                            {showSearchResults && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-border dark:bg-card">
                                    {searchResults.length > 0 ? (
                                        <ul className="divide-y divide-gray-200 dark:divide-border">
                                            {searchResults.map((student) => (
                                                <li
                                                    key={student.student_id}
                                                    className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-pink-50 dark:hover:bg-pink-500/20"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleStudentSelect(student);
                                                    }}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-card-foreground">
                                                            {student.student_name}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-muted-foreground">{student.email}</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                                                        {student.matric_id || t('noMatricID')}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-3 text-center text-gray-500 dark:text-muted-foreground">
                                            {isSearching ? t('searching') : searchError || t('noStudentsFound')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-card-foreground">{t('matricID')}</label>
                            <input
                                type="text"
                                placeholder={t('idNumber')}
                                value={formData.matricId}
                                onChange={(e) => handleInputChange('matricId', e.target.value)}
                                className={`w-full rounded-md border border-border bg-background px-3 py-2 text-foreground transition-colors focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none ${highlightMatric ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-300 dark:border-border'}`}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="rounded-b-lg border-t border-border bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 dark:bg-muted">
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                            <button
                                onClick={handleCancel}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                disabled={isSubmitting}
                            >
                                {t('cancel')}
                            </button>

                            <button
                                onClick={handleRegister}
                                disabled={!formData.trackingNumber || !formData.sender || isSubmitting}
                                className="flex items-center gap-2 rounded-md bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700"
                            >
                                {isSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                                {isSubmitting ? t('registering') : t('registerParcel')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default ParcelRegistrationForm;
