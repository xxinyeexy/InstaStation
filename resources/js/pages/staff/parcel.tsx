import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BellRing, CircleCheck, Edit, Eye, Trash2, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'parcels',
        href: '/staff/parcel',
    },
];

// Define the Parcel interface based on your database structure
interface Parcel {
    parcel_id: number;
    parcel_code: string; // Unique code for the parcel
    collection_code?: string | null;
    student_id: number | null;
    tracking_no: string;
    parcel_status: string;
    days: number;
    sender: string;
    size: string;
    location: string;
    qr_code: string;
    schedule: string;
    time_slot?: string;
    recipient_name?: string | null;
    recipient_matric?: string | null;
    created_by:
    | number
    | {
        id: number;
        name: string;
        email: string;
    };
    last_edited_by:
    | number
    | {
        id: number;
        name: string;
        email: string;
    };
    report_at: string;
    created_at: string;
    updated_at: string;
    // Add relationship data
    student_user?: {
        id: number;
        name: string;
        matric: string;
        email: string;
    };
}

// Extended interface for detailed parcel view
interface ParcelDetails extends Parcel {
    weight?: string;
    dimensions?: string;
    description?: string;
    sender_address?: string;
    fee?: number;
}

// Props interface for the component
interface DashboardProps {
    parcels?: Parcel[];
}

type TabType = 'All Parcels' | 'Pending Payment' | 'Ready For Collection' | 'Collected' | 'Unclaimed';

// Notification interface
interface Notification {
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
}

// Extended interface for editing parcel
interface EditParcelForm {
    tracking_no: string;
    parcel_status: string;
    recipient_name: string;
    email: string;
    student_id: string; // This is matric ID
    student_user_id?: number | null; // This is user ID
    fee: number;
    sender_name: string;
    sender_address: string;
    weight: string;
    dimensions: string;
    description: string;
}

export default function Dashboard({ parcels = [] }: DashboardProps) {
    const { t } = useLanguage();
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;

    // Helper function to handle CSRF token refresh on 419 errors
    const fetchWithCSRF = async (url: string, options: RequestInit = {}) => {
        let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            ...(options.headers || {}),
        } as any;

        // Default content type to json if body is present and not FormData
        if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        let res = await fetch(url, { ...options, headers, credentials: 'same-origin' });

        if (res.status === 419) {
            console.warn('CSRF token expired. Refreshing...');
            try {
                const refreshRes = await fetch(window.location.href);
                const html = await refreshRes.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                if (newToken) {
                    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', newToken);
                    headers['X-CSRF-TOKEN'] = newToken;
                    res = await fetch(url, { ...options, headers, credentials: 'same-origin' });
                }
            } catch (e) {
                console.error('Failed to refresh CSRF token', e);
            }
        }
        return res;
    };


    const [activeTab, setActiveTab] = useState<TabType>('All Parcels');
    const [searchTerm, setSearchTerm] = useState('');
    // Use state for parcel list and initialize it with the parcels prop
    const [parcelList, setParcelList] = useState<Parcel[]>(parcels);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
    const [selectedTrackingNo, setSelectedTrackingNo] = useState<string | null>(null);


    // Parcel details modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [parcelDetails, setParcelDetails] = useState<ParcelDetails | null>(null);
    // Remove isLoadingDetails

    // Edit parcel modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);
    const [editForm, setEditForm] = useState<EditParcelForm>({
        tracking_no: '',
        parcel_status: '',
        recipient_name: '',
        email: '',
        student_id: '',
        student_user_id: null,
        fee: 1.0,
        sender_name: '',
        sender_address: '',
        weight: '',
        dimensions: '',
        description: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [editValidationError, setEditValidationError] = useState<string>('');

    const showEditValidationError = (message: string) => {
        setEditValidationError(message);
        setTimeout(() => setEditValidationError(''), 3000);
    };

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Collecting state - track which parcels are being collected
    const [collectingParcels, setCollectingParcels] = useState<Set<number>>(new Set());

    // Reminding state - track which parcels are being reminded
    const [sendingReminders, setSendingReminders] = useState<Set<number>>(new Set());

    // QR Scan modal state
    const [showScanModal, setShowScanModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const html5Ref = useRef<Html5Qrcode | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const scanContainerId = 'qr-scan-region';

    const openScanModal = () => {
        setShowScanModal(true);
    };
    const closeScanModal = async () => {
        setShowScanModal(false);
        try {
            if (scannerRef.current) {
                await scannerRef.current.clear().catch(() => { });
            }
            if (html5Ref.current) {
                await html5Ref.current.stop().catch(() => { });
                try {
                    await html5Ref.current.clear();
                } catch { }
            }
        } catch { }
        scannerRef.current = null;
        html5Ref.current = null;
    };

    const onDecodeSuccess = useCallback(async (decodedText: string) => {
        try {
            const code = decodedText.trim();
            const resp = await fetch(`/staff/parcel/by-code/${encodeURIComponent(code)}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!resp.ok) {
                addNotification('error', t('scanFailed'), `${t('parcelNotFound')} ${code}`);
                return;
            }
            const data = await resp.json();
            if (!data?.success || !data?.parcel) {
                addNotification('error', t('scanFailed'), t('noParcelData'));
                return;
            }
            setParcelDetails(data.parcel as ParcelDetails);
            setShowDetailsModal(true);
            await closeScanModal();
        } catch {
            addNotification('error', t('scanError'), t('couldNotProcessQR'));
        }
    }, []);

    useEffect(() => {
        if (!showScanModal) return;
        (async () => {
            setCameraError(null);
            setIsScanning(true);
            try {
                // Enumerate cameras
                const cams = await Html5Qrcode.getCameras();
                const list = (cams || []).map((c: any) => ({ id: c.id, label: c.label || 'Camera' }));
                setAvailableCameras(list);
                const preferredId = list.find((c) => /back|rear|environment/i.test(c.label))?.id || list[0]?.id || null;
                setSelectedCameraId(preferredId);

                const html5 = new Html5Qrcode(scanContainerId);
                html5Ref.current = html5;

                const cameraConfig = preferredId ? { deviceId: { exact: preferredId } } : { facingMode: { ideal: 'environment' } };

                const scanConfig: any = {
                    fps: 24,
                    qrbox: { width: 340, height: 340 },
                    disableFlip: true,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                    videoConstraints: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                };

                await html5.start(cameraConfig as any, scanConfig as any, onDecodeSuccess, () => { });
                // Hint autofocus after start (typed as any to avoid TS lib gaps)
                try {
                    await (html5Ref.current as any)?.applyVideoConstraints?.({ advanced: [{ focusMode: 'continuous' }] });
                } catch { }
            } catch (e: any) {
                setCameraError('Camera could not start. Use HTTPS or localhost, allow camera permissions, and ensure a camera is connected.');
            } finally {
                setIsScanning(false);
            }
        })();
    }, [showScanModal, onDecodeSuccess]);

    // Restart scanner when switching camera
    useEffect(() => {
        if (!showScanModal) return;
        if (!html5Ref.current) return;
        if (!selectedCameraId) return;
        (async () => {
            try {
                await html5Ref.current!.stop().catch(() => { });
                const switchConfig: any = {
                    fps: 24,
                    qrbox: { width: 340, height: 340 },
                    disableFlip: true,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                    videoConstraints: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                };

                await html5Ref.current!.start({ deviceId: { exact: selectedCameraId } } as any, switchConfig as any, onDecodeSuccess, () => { });
                try {
                    await (html5Ref.current as any)?.applyVideoConstraints?.({ advanced: [{ focusMode: 'continuous' }] });
                } catch { }
            } catch (e) {
                setCameraError('Failed to switch camera');
            }
        })();
    }, [selectedCameraId, showScanModal, onDecodeSuccess]);

    // Add notification function
    const addNotification = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now().toString();
        const newNotification: Notification = { id, type, title, message };
        setNotifications((prev) => [...prev, newNotification]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    // Remove notification function
    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    // Refactored: Use local data for instant modal
    const handleViewParcel = (parcelId: number) => {
        const parcel = parcelList.find((p) => p.parcel_id === parcelId);
        if (parcel) {
            setParcelDetails(parcel as ParcelDetails);
            setShowDetailsModal(true);
        } else {
            addNotification('error', t('error'), t('parcelNotFoundLocal'));
        }
    };

    // Close details modal
    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setParcelDetails(null);
    };

    // Handle edit parcel - fetch fresh data from database
    const handleEditParcel = async (parcel: Parcel) => {
        try {
            console.log('Fetching fresh parcel data for ID:', parcel.parcel_id);

            // Fetch the latest parcel data from the database
            const response = await fetch(`/staff/parcel/${parcel.parcel_id}/details`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Fresh parcel data received:', data);

            if (!data.success || !data.parcel) {
                throw new Error('Failed to fetch parcel details');
            }

            const freshParcel = data.parcel;
            console.log('Setting edit form with status:', freshParcel.parcel_status);
            setEditingParcel(freshParcel);
            setEditForm({
                tracking_no: freshParcel.tracking_no || '',
                parcel_status: freshParcel.parcel_status || '',
                recipient_name: freshParcel.student_user?.name || freshParcel.recipient_name || '',
                email: freshParcel.student_user?.email || '',
                student_id: freshParcel.student_user?.matric || freshParcel.recipient_matric || freshParcel.student_id?.toString() || '',
                student_user_id: freshParcel.student_user?.id || freshParcel.student_id || null,
                fee: 1.0, // Default fee
                sender_name: freshParcel.sender || '',
                sender_address: 'N/A', // Not in database
                weight: 'N/A', // Not in database
                dimensions: freshParcel.size || '',
                description: 'N/A', // Not in database
            });
            setShowEditModal(true);
        } catch (error) {
            console.error('Failed to fetch parcel details:', error);
            addNotification('error', t('error'), t('failedToLoadDetails'));
        }
    };

    // Debounce timer for student lookup
    const lookupTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Lookup student by name or matric ID
    const lookupStudent = async (query: string) => {
        if (!query || query.length < 2) return;

        try {
            const response = await fetch(`/api/students/search?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const students = await response.json();
                // If we find an exact match or a very close match (first result)
                // we'll update the form. For now, let's take the first result if it exists.
                if (students && students.length > 0) {
                    const student = students[0];
                    setEditForm((prev) => ({
                        ...prev,
                        recipient_name: student.student_name,
                        student_id: student.matric_id,
                        email: student.email,
                        parcel_status: 'Pending Payment', // Auto update status as requested
                        // Also update linked student ID if the data structure has it
                        student_user_id: student.student_id,
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to lookup student:', error);
        }
    };

    // Handle form input changes
    const handleEditFormChange = (field: keyof EditParcelForm, value: string | number) => {
        // Auto-capitalize sender name and student (matric) ID
        let finalValue = value;
        if (typeof value === 'string' && (field === 'sender_name' || field === 'student_id')) {
            finalValue = value.toUpperCase();
        }

        setEditForm((prev) => ({
            ...prev,
            [field]: finalValue,
        }));

        // If updating student_id or recipient_name, trigger lookup
        if (field === 'student_id' || field === 'recipient_name') {
            if (lookupTimerRef.current) {
                clearTimeout(lookupTimerRef.current);
            }
            lookupTimerRef.current = setTimeout(() => {
                lookupStudent(value.toString());
            }, 500);
        }
    };

    // Handle form submission
    const handleUpdateParcel = async () => {
        if (!editingParcel) return;

        // Comprehensive validation
        if (!editForm.tracking_no.trim()) {
            showEditValidationError('Please enter a tracking number');
            return;
        }

        if (editForm.tracking_no.trim().length < 5) {
            showEditValidationError('Tracking number must be at least 5 characters long');
            return;
        }

        if (!editForm.parcel_status) {
            showEditValidationError('Please select a parcel status');
            return;
        }

        if (!editForm.sender_name.trim()) {
            showEditValidationError('Please enter sender information');
            return;
        }

        if (editForm.sender_name.trim().length < 3) {
            showEditValidationError('Sender name must be at least 3 characters long');
            return;
        }

        if (!editForm.dimensions.trim()) {
            showEditValidationError('Please enter parcel dimensions/size');
            return;
        }

        if (!editingParcel.location || !editingParcel.location.trim()) {
            showEditValidationError('Please enter storage location');
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetchWithCSRF(`/staff/parcel/${editingParcel.parcel_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    tracking_no: editForm.tracking_no,
                    parcel_status: editForm.parcel_status,
                    sender_name: editForm.sender_name,
                    sender_address: editForm.sender_address,
                    dimensions: editForm.dimensions,
                    weight: editForm.weight,
                    fee: editForm.fee,
                    description: editForm.description,
                    location: editingParcel.location,
                    recipient_name: editForm.recipient_name,
                    recipient_matric: editForm.student_id,
                    student_id: editForm.student_user_id,
                }),
            });

            if (response.ok) {
                const result = await response.json();

                // Update local state with the fresh data from server
                setParcelList((prev) =>
                    prev.map((parcel) => (parcel.parcel_id === editingParcel.parcel_id ? { ...parcel, ...result.parcel } : parcel)),
                );

                setShowEditModal(false);
                setEditingParcel(null);
                addNotification('success', 'Success!', 'Parcel updated successfully!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(message);
            }
        } catch (error) {
            console.error('Failed to update parcel:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update parcel. Please try again.';
            addNotification('error', 'Error!', errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    // Close edit modal
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingParcel(null);
        setEditForm({
            tracking_no: '',
            parcel_status: '',
            recipient_name: '',
            email: '',
            student_id: '',
            fee: 1.0,
            sender_name: '',
            sender_address: '',
            weight: '',
            dimensions: '',
            description: '',
        });
    };

    // Debug: Log parcels data
    console.log('Parcels received:', parcelList);
    console.log('Parcels length:', parcelList.length);
    if (parcelList.length > 0) {
        console.log('First parcel:', parcelList[0]);
        console.log(
            'All statuses:',
            parcelList.map((p) => p.parcel_status),
        );
    }

    // Filter parcels based on active tab and search term - USE parcelList instead of parcels
    const filteredParcels = parcelList.filter((parcel) => {
        // Normalize status for easier comparison
        const status = parcel.parcel_status?.toLowerCase();

        // Skip all 'Approved' parcels entirely
        if (status === 'approved') return false;

        // Tabs filtering
        const matchesTab =
            activeTab === 'All Parcels'
                ? ['pending payment', 'ready for collection', 'collected', 'unclaimed'].includes(status)
                : activeTab === 'Pending Payment'
                    ? ['pending payment'].includes(status)
                    : activeTab === 'Ready For Collection'
                        ? ['ready for collection', 'ready to collect'].includes(status)
                        : activeTab === 'Collected'
                            ? status === 'collected'
                            : activeTab === 'Unclaimed'
                                ? status === 'unclaimed'
                                : true;

        const matchesSearch =
            searchTerm === '' ||
            parcel.parcel_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.collection_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (parcel.student_id !== null && parcel.student_id?.toString().includes(searchTerm)) ||
            parcel.student_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.student_user?.matric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.recipient_matric?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    // Sort parcels for "Ready For Collection" tab by days (highest stored days first)
    const sortedParcels = useMemo(() => {
        if (activeTab === 'Ready For Collection') {
            return [...filteredParcels].sort((a, b) => {
                const daysA = Math.abs(a.days || 0);
                const daysB = Math.abs(b.days || 0);
                return daysB - daysA; // Descending order by absolute value (highest stored days first)
            });
        }
        return filteredParcels;
    }, [filteredParcels, activeTab]);

    // Get exact counts for each tab from actual database data - USE parcelList instead of parcels
    const getCounts = useCallback(() => {
        return {
            'All Parcels': parcelList.filter((p) => !['approved'].includes(p.parcel_status?.toLowerCase())).length,
            'Pending Payment': parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'pending payment').length,
            'Ready For Collection': parcelList.filter((p) => ['ready for collection'].includes(p.parcel_status?.toLowerCase())).length,
            Collected: parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'collected').length,
            Unclaimed: parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'unclaimed').length,
        };
    }, [parcelList]);

    const counts = getCounts();

    // Calculate actual stats from parcel data - USE parcelList instead of parcels
    const getActualStats = useCallback(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        const todayParcels = parcelList.filter((p) => {
            if (!p.created_at) return false;
            const createdDate = new Date(p.created_at).toISOString().split('T')[0];
            return createdDate === todayStr;
        });

        const pendingPayments = parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'pending payment');
        const readyToCollect = parcelList.filter((p) => ['ready for collection'].includes(p.parcel_status?.toLowerCase()));

        const todayCollected = parcelList.filter((p) => {
            if (p.parcel_status?.toLowerCase() !== 'collected') return false;
            if (!p.updated_at) return false;
            const updatedDate = new Date(p.updated_at).toISOString().split('T')[0];
            return updatedDate === todayStr;
        });

        const approved = parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'approved');

        // Calculate revenue based on collected parcels (RM1 per parcel)
        const collectedParcels = parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'collected');
        const totalRevenue = collectedParcels.length * 1;

        return {
            newlyArrived: todayParcels.length,
            pendingPayments: pendingPayments.length,
            readyForCollection: readyToCollect.length,
            todayCollection: todayCollected.length,
            totalRevenue: totalRevenue,
            paymentVerified: approved.length,
        };
    }, [parcelList]);

    const stats = getActualStats();

    // Calculate percentage changes (mock calculation for demo purposes)
    const getPercentageChange = (current: number, mockPrevious?: number) => {
        if (current === 0) return 0;
        const previous = mockPrevious || Math.max(1, current - Math.floor(Math.random() * 3) - 1);
        const change = ((current - previous) / Math.max(previous, 1)) * 100;
        return Math.round(Math.max(change, 0)); // Ensure positive for demo
    };

    const getStatusStyles = (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        switch (normalizedStatus) {
            case 'pending payment':
                return 'border-orange-200 bg-orange-100 text-orange-600';
            case 'ready for collection':
                return 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200';
            case 'collected':
                return 'border-emerald-200 bg-emerald-100 text-emerald-700';
            case 'unclaimed':
                return 'bg-[#C5C5CF] text-black border-gray-300';
            case 'approved':
                return 'border-green-200 bg-green-100 text-green-700';
            default:
                return 'border-gray-200 dark:border-border bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground';
        }
    };

    const getTabStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        // Active and hover colors should match for each tab
        switch (tab) {
            case 'All Parcels':
                return isActive
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20';
            case 'Pending Payment':
                return isActive
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20';
            case 'Ready For Collection':
                return isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200'
                    : 'bg-white dark:bg-gray-900 text-[#5B21B6] dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-[#EDE9FE] dark:hover:bg-purple-900/20';
            case 'Collected':
                return isActive
                    ? 'bg-[#DCFCE7] text-[#166534] border-green-200'
                    : 'bg-white dark:bg-gray-900 text-[#166534] dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-[#DCFCE7] dark:hover:bg-green-900/20';
            case 'Unclaimed':
                return isActive
                    ? 'bg-[#C5C5CF] text-black border-gray-300'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-[#C5C5CF] dark:hover:bg-gray-800 hover:text-black dark:hover:text-white';
            default:
                return 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white';
        }
    };

    // Function to get badge styles for each tab
    const getBadgeStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        switch (tab) {
            case 'All Parcels':
                return isActive
                    ? 'bg-blue-200 text-blue-700 dark:bg-blue-600 dark:text-white'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Pending Payment':
                return isActive
                    ? 'bg-orange-200 text-orange-700 dark:bg-orange-600 dark:text-white'
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300';
            case 'Ready For Collection':
                return isActive
                    ? 'bg-purple-200 text-purple-700 dark:bg-purple-600 dark:text-white'
                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300';
            case 'Collected':
                return isActive
                    ? 'bg-green-200 text-green-700 dark:bg-green-600 dark:text-white'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300';
            case 'Unclaimed':
                return isActive
                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white'
                    : 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground';
            default:
                return 'bg-gray-100 dark:bg-muted text-white dark:text-foreground';
        }
    };

    // Function to translate tab names
    const getTranslatedTabName = (tab: TabType): string => {
        switch (tab) {
            case 'All Parcels':
                return t('allParcels');
            case 'Pending Payment':
                return t('pendingPayment');
            case 'Ready For Collection':
                return t('readyForCollection');
            case 'Collected':
                return t('collected');
            case 'Unclaimed':
                return t('unclaimed');
            default:
                return tab;
        }
    };

    // Function to translate status values
    const getTranslatedStatus = (status: string): string => {
        const normalizedStatus = status?.toLowerCase();
        switch (normalizedStatus) {
            case 'pending payment':
                return t('pendingPayment');
            case 'ready for collection':
            case 'ready to collect':
                return t('readyForCollection');
            case 'collected':
                return t('collected');
            case 'unclaimed':
                return t('unclaimed');
            case 'approved':
                return t('approved');
            default:
                return status;
        }
    };

    // Optimized handleMarkAsCollected - instant UI update with optimistic rendering
    const handleMarkAsCollected = async (parcelId: number) => {
        // Prevent multiple simultaneous requests for the same parcel
        if (collectingParcels.has(parcelId)) {
            return;
        }

        // Instant UI feedback - update local state immediately (optimistic update)
        setParcelList((prev) =>
            prev.map((p) =>
                p.parcel_id === parcelId ? { ...p, parcel_status: 'Collected' } : p
            )
        );

        // Switch to Collected tab immediately for smooth UX
        setActiveTab('Collected');

        // Show success notification immediately
        addNotification('success', t('success'), t('parcelCollectedSuccess'));

        // Add parcel to collecting set
        setCollectingParcels((prev) => new Set(prev).add(parcelId));

        // Background sync with server
        router.patch(
            `/staff/parcel/${parcelId}/collect`,
            {},
            {
                preserveScroll: true,
                preserveState: false,
                onError: () => {
                    // Revert optimistic update on error
                    router.reload({ only: ['parcels'] });
                    addNotification('error', t('error'), t('failedToMarkCollected'));
                },
                onFinish: () => {
                    // Remove parcel from collecting set
                    setCollectingParcels((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(parcelId);
                        return newSet;
                    });
                }
            }
        );
    };    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-MY');
        } catch {
            return 'N/A';
        }
    };

    // Format date and time for display
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-MY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'N/A';
        }
    };

    // Format scheduled date for display
    const formatScheduledDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    };

    // Get status bar color for the top indicator
    const getStatusBarColor = (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        switch (normalizedStatus) {
            case 'pending payment':
                return 'bg-gradient-to-r from-orange-400 to-orange-500';
            case 'ready for collection':
                return 'bg-gradient-to-r from-purple-400 to-purple-500';
            case 'collected':
                return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
            case 'unclaimed':
                return 'bg-gradient-to-r from-gray-400 to-gray-500';
            case 'approved':
                return 'bg-gradient-to-r from-green-400 to-green-500';
            default:
                return 'bg-gradient-to-r from-gray-400 to-gray-500';
        }
    };

    // Handle delete parcel with modal
    const handleDeleteClick = (parcelId: number, trackingNo: string) => {
        setSelectedParcelId(parcelId);
        setSelectedTrackingNo(trackingNo);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedParcelId) return;

        // Capture required data before clearing state
        const parcelIdToDelete = selectedParcelId;
        const trackingNoToDelete = selectedTrackingNo;

        // 1. Instant UI Feedback: Close modal and remove from list immediately
        setShowDeleteModal(false);
        setParcelList((prev) => prev.filter((parcel) => parcel.parcel_id !== parcelIdToDelete));

        // 2. Optimistic success notification
        addNotification('success', t('parcelDeleted'), `The parcel ${trackingNoToDelete} has been successfully deleted`);

        try {
            // 3. Background deletion request
            const response = await fetch(`/staff/parcel/${parcelIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                // If the response failed, we need to throw to hit the catch block
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to delete parcel:', error);

            // 4. Revert: If deletion failed on server, reload the list to restore the item
            router.reload({ only: ['parcels'] });

            // Overwrite success notification with error
            addNotification('error', t('deleteFailed'), `${t('failedToDelete').replace('. Please try again.', '')} ${trackingNoToDelete}.`);
        } finally {
            setSelectedParcelId(null);
            setSelectedTrackingNo(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedParcelId(null);
        setSelectedTrackingNo(null);
    };

    // Send reminder for a single parcel (fire-and-forget with no loading state)
    const sendReminder = async (parcelId: number) => {
        // Prevent multiple simultaneous requests
        if (sendingReminders.has(parcelId)) return;

        setSendingReminders((prev) => new Set(prev).add(parcelId));

        // Immediate feedback (Optimistic UI)
        addNotification('success', t('reminderProcessed'), t('reminderSent') || 'Reminder request has been sent.');

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };

            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            if (meta && meta.content) {
                headers['X-CSRF-TOKEN'] = meta.content;
            } else {
                const getCookie = (name: string) => {
                    const match = document.cookie.split('; ').find((row) => row && row.startsWith(name + '='));
                    if (!match) return '';
                    return match.split('=').slice(1).join('=');
                };
                const xsrfToken = getCookie('XSRF-TOKEN');
                if (xsrfToken) {
                    headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
                }
            }

            const response = await fetch('/staff/parcels/remind', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({ parcel_ids: [parcelId] }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const err = await response.json();
                    if (err?.message) errorMessage = err.message;
                } catch { }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!data?.success) {
                addNotification('error', t('reminderFailed'), data.message || t('failedToQueueReminder'));
            }
            // Success notification is handled optimistically above
        } catch (error: any) {
            console.error('Failed to send reminder:', error);
            addNotification('error', t('error'), error?.message || t('failedToSendReminder'));
        } finally {
            setSendingReminders((prev) => {
                const next = new Set(prev);
                next.delete(parcelId);
                return next;
            });
        }
    };

    // Calendar / date picker for collections
    const defaultDate = new Date().toISOString().split('T')[0];
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

    // Compare using local date components to avoid timezone shifts (so "tomorrow" doesn't show today)
    const isSameLocalDate = (dateStr: string | null | undefined, ymd: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return false;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === ymd;
    };

    const collectionsForSelectedDate = parcelList
        .filter((p) => {
            return isSameLocalDate(p.schedule, selectedDate);
        })
        .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));

    // Group collections by student and time slot so the same student in the same slot is merged
    const groupedCollections = useMemo(() => {
        const map = new Map<
            string,
            {
                key: string;
                time_slot: string | null | undefined;
                schedule: string | null | undefined;
                student_name: string;
                student_matric?: string | null;
                parcels: Parcel[];
            }
        >();

        for (const p of collectionsForSelectedDate) {
            const studentId = (p.student_user as any)?.id ?? p.student_id ?? p.recipient_matric ?? p.recipient_name ?? 'unknown';
            const slot = p.time_slot || '';
            const key = `${studentId}__${slot}`;
            const name = (p.student_user as any)?.name || p.recipient_name || 'Unknown Student';
            const matric = (p.student_user as any)?.matric || p.recipient_matric || null;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    time_slot: p.time_slot,
                    schedule: p.schedule,
                    student_name: name,
                    student_matric: matric,
                    parcels: [p],
                });
            } else {
                map.get(key)!.parcels.push(p);
            }
        }

        return Array.from(map.values()).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));
    }, [collectionsForSelectedDate]);

    const todaysCollections = groupedCollections;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parcels" />

            {/* Notification Container */}
            <div className="fixed top-8 left-1/2 z-[250] -translate-x-1/2 space-y-3">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`flex min-w-[320px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success'
                            ? 'bg-[#f0fdf4] text-[#065f46]'
                            : 'bg-[#fef2f2] text-[#991b1b]'
                            }`}
                    >
                        {notification.type === 'success' ? (
                            <CircleCheck className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                        ) : (
                            <XCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        )}
                        <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                            {notification.message}
                        </span>
                    </div>
                ))}
            </div>

            {/* Calendar Modal */}
            {calendarOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold dark:text-white">Collections for date</h3>
                            <button onClick={() => setCalendarOpen(false)} className="text-sm text-gray-500">
                                Close
                            </button>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Select date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="rounded-md border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">Found: {groupedCollections.length}</div>
                        </div>
                        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
                            {groupedCollections.length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400">No parcels scheduled on this date.</div>
                            ) : (
                                groupedCollections.map((g) => (
                                    <div key={g.key} className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 font-semibold text-purple-600">
                                                <span className="text-sm">{g.time_slot ? g.time_slot.split(' - ')[0] : ''}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.student_name}</p>
                                                    {g.student_matric && <p className="text-xs text-gray-500">({g.student_matric})</p>}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">Parcels: {g.parcels.length}</div>
                                                <div className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">
                                                    Codes:{' '}
                                                    <span className="font-mono">
                                                        {g.parcels.map((pp) => pp.parcel_code || pp.tracking_no).join(', ')}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Timeslot: {g.time_slot || formatScheduledDate(g.schedule || '')}
                                                </div>
                                                {(() => {
                                                    const statuses = Array.from(
                                                        new Set(g.parcels.map((pp) => (pp.parcel_status || '').toString())),
                                                    );
                                                    return (
                                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            Status:{' '}
                                                            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                                {statuses.length === 1 ? statuses[0] : 'Multiple'}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}



            {/* Parcel Details Modal */}
            {showDetailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('parcelDetails')}</h2>

                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('completeInformation')}</p>
                            </div>
                            <button
                                onClick={handleCloseDetailsModal}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="max-h-[65vh] overflow-y-auto p-6">
                            {parcelDetails ? (
                                <div className="space-y-6">
                                    {/* Top Section */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                {t('trackingInformation')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('trackingNumber')}
                                                    </label>
                                                    <p className="font-['Consolas'] text-lg font-bold text-gray-900 dark:text-white">
                                                        {parcelDetails.tracking_no}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('status')}
                                                    </label>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(parcelDetails.parcel_status)}`}
                                                    >
                                                        {getTranslatedStatus(parcelDetails.parcel_status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                {t('recipientInformation')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('studentID')}
                                                    </label>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {parcelDetails.student_user?.matric || parcelDetails.recipient_matric || parcelDetails.student_id || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('name')}</label>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {parcelDetails.student_user?.name || parcelDetails.recipient_name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('email')}</label>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {parcelDetails.student_user?.email || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sender Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('senderInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('sender')}</label>
                                                <p className="text-gray-900 dark:text-white">{parcelDetails.sender || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parcel Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('parcelInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('dimensions')}</label>
                                                <p className="text-gray-900 dark:text-white">{parcelDetails.dimensions || parcelDetails.size || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('fee')}</label>
                                                <p className="text-gray-900 dark:text-white">RM{parcelDetails.fee || '1.00'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('additionalInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('location')}</label>
                                                <p className="text-gray-900 dark:text-white">{parcelDetails.location || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('daysInStorage')}</label>
                                                <p className="text-gray-900 dark:text-white">{parcelDetails.days || 0} {t('days')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scheduled Pickup Information */}
                                    {(parcelDetails.parcel_status?.toLowerCase() === 'ready for collection' ||
                                        parcelDetails.parcel_status?.toLowerCase() === 'ready to collect') &&
                                        (parcelDetails.schedule || parcelDetails.time_slot) && (
                                            <div>
                                                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('scheduledPickupInfo')}</h3>
                                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">{t('scheduledDate')}</label>
                                                            <p className="font-medium text-purple-900 dark:text-purple-100">
                                                                {formatScheduledDate(parcelDetails.schedule) || t('notSet')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">{t('timeSlot')}</label>
                                                            <p className="font-medium text-purple-900 dark:text-purple-100">{parcelDetails.time_slot || t('notSet')}</p>
                                                        </div>
                                                    </div>
                                                    {formatScheduledDate(parcelDetails.schedule) && parcelDetails.time_slot && (
                                                        <div className="mt-3 border-t border-purple-200 pt-3 dark:border-purple-800">
                                                            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">{t('fullSchedule')}</label>
                                                            <p className="font-semibold text-purple-900 dark:text-purple-100">
                                                                {formatScheduledDate(parcelDetails.schedule)} • {parcelDetails.time_slot}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Timestamps */}
                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('timestamps')}</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('createdAt')}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDateTime(parcelDetails.created_at)}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('lastUpdated')}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDateTime(parcelDetails.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">{t('failedToLoadParcelDetails')}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {parcelDetails && (
                            <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
                                <button
                                    onClick={handleCloseDetailsModal}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    {t('close')}
                                </button>
                                {parcelDetails.parcel_status?.toLowerCase() === 'ready for collection' && (
                                    <button
                                        onClick={() => {
                                            handleMarkAsCollected(parcelDetails.parcel_id);
                                            handleCloseDetailsModal();
                                        }}
                                        disabled={collectingParcels.has(parcelDetails.parcel_id)}
                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-150 ${collectingParcels.has(parcelDetails.parcel_id)
                                            ? 'cursor-not-allowed bg-green-500 opacity-80'
                                            : 'bg-green-600 hover:scale-105 hover:bg-green-700 active:scale-95'
                                            }`}
                                    >
                                        <CircleCheck className="h-4 w-4" />
                                        <span>{t('markAsCollected')}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QR Scan Modal */}
            {showScanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scan Parcel QR Code</h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Point your camera at a parcel QR to find it instantly</p>
                            </div>
                            <button
                                onClick={closeScanModal}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div id={scanContainerId} className="w-full" />
                            {availableCameras.length > 1 && (
                                <div className="mt-3 flex items-center gap-2">
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Camera:</label>
                                    <select
                                        value={selectedCameraId ?? ''}
                                        onChange={(e) => setSelectedCameraId(e.target.value)}
                                        className="rounded border border-gray-300 px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {availableCameras.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.label || 'Camera'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {cameraError && <p className="mt-2 text-xs text-red-600">{cameraError}</p>}
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Ensure camera permission is granted.</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            // try re-init by closing and re-opening scanner
                                            if (scannerRef.current) {
                                                await scannerRef.current.clear().catch(() => { });
                                                scannerRef.current = null;
                                            }
                                            if (html5Ref.current) {
                                                try {
                                                    await html5Ref.current.stop();
                                                } catch { }
                                                try {
                                                    await html5Ref.current.clear();
                                                } catch { }
                                                html5Ref.current = null;
                                            }
                                            setTimeout(() => setShowScanModal((v) => v), 0);
                                        } catch { }
                                    }}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Retry camera
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Parcel Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
                        {/* Validation Error Toast */}
                        {editValidationError && (
                            <div className="absolute top-4 left-1/2 z-[100] -translate-x-1/2 animate-fade-in">
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm font-medium text-red-800">{editValidationError}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('editParcel')}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('updateParcelInfo')}</p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="max-h-[66vh] overflow-y-auto p-6">
                            {editingParcel ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdateParcel();
                                    }}
                                    className="space-y-6"
                                >
                                    {/* Top Section */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                {t('trackingInformation')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('trackingNumber')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.tracking_no}
                                                        onChange={(e) => handleEditFormChange('tracking_no', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('status')}
                                                    </label>
                                                    <select
                                                        value={editForm.parcel_status}
                                                        onChange={(e) => handleEditFormChange('parcel_status', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    >
                                                        <option value="Pending Payment">{t('pendingPayment')}</option>
                                                        <option value="Ready For Collection">{t('readyForCollection')}</option>
                                                        <option value="Collected">{t('collected')}</option>
                                                        <option value="Unclaimed">{t('unclaimed')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                {t('recipientInformation')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {t('studentID')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.student_id}
                                                        onChange={(e) => handleEditFormChange('student_id', e.target.value)}
                                                        className="mt-1 w-full uppercase rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('name')}</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.recipient_name}
                                                        onChange={(e) => handleEditFormChange('recipient_name', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('email')}</label>
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sender Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('senderInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('sender')}</label>
                                                <input
                                                    type="text"
                                                    value={editForm.sender_name}
                                                    onChange={(e) => handleEditFormChange('sender_name', e.target.value)}
                                                    className="mt-1 w-full uppercase rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parcel Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('parcelInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('dimensions')}</label>
                                                <input
                                                    type="text"
                                                    value={editForm.dimensions}
                                                    onChange={(e) => handleEditFormChange('dimensions', e.target.value)}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('fee')} (RM)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.fee}
                                                    onChange={(e) => handleEditFormChange('fee', parseFloat(e.target.value))}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('additionalInformation')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('location')}</label>
                                                <input
                                                    type="text"
                                                    value={editingParcel.location || ''}
                                                    onChange={(e) => {
                                                        // Update the editingParcel directly for location
                                                        setEditingParcel((prev) => (prev ? { ...prev, location: e.target.value } : null));
                                                    }}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={handleCloseEditModal}
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    {t('updating')}
                                                </>
                                            ) : (
                                                t('updateParcel')
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">{t('failedToLoadParcelForEditing')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>

                        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{t('deleteParcel')}</h2>
                        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                            {t('areYouSureDeleteParcel')} <span className="font-medium text-red-600 dark:text-red-400">{selectedTrackingNo}</span>?
                        </p>
                        <div className="mb-6 rounded-md bg-red-50 p-3 dark:bg-red-500/10">
                            <p className="text-sm text-red-800 dark:text-red-400">
                                {t('cannotBeUndoneParcel')}                                </p>
                        </div>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                {t('deleteParcel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background with gradient */}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4 sm:p-6 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/30">
                {/* Top Stats Grid - Enhanced with better gradients and shadows */}
                <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Newly Arrived - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-pink-100 bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-pink-200 hover:shadow-2xl dark:border-pink-900/50 dark:from-pink-900/40 dark:via-gray-800 dark:to-pink-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-pink-100 to-pink-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package-icon lucide-package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><polyline points="3.29 7 12 12 20.71 7" /><path d="m7.5 4.27 9 5.15" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('newlyArrived')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-800">{stats.newlyArrived}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-orange-200 hover:shadow-2xl dark:border-orange-900/50 dark:from-orange-900/40 dark:via-gray-800 dark:to-orange-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-orange-100 to-orange-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('pendingPayment')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800">{stats.pendingPayments}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Collection - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-purple-200 hover:shadow-2xl dark:border-purple-900/50 dark:from-purple-900/40 dark:via-gray-800 dark:to-purple-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-purple-100 to-purple-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package-open-icon lucide-package-open"><path d="M12 22v-9" /><path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" /><path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" /><path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('readyForCollection')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">{stats.readyForCollection}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row Stats - Enhanced design */}
                <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Total Collection - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-green-100 bg-gradient-to-br from-green-50 via-white to-green-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-green-200 hover:shadow-2xl dark:border-green-900/50 dark:from-green-900/40 dark:via-gray-800 dark:to-green-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-green-200 to-green-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-green-100 to-green-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('todayCollection')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">{stats.todayCollection}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-yellow-200 hover:shadow-2xl dark:border-yellow-900/50 dark:from-yellow-900/40 dark:via-gray-800 dark:to-yellow-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-yellow-100 to-yellow-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('totalRevenue')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-800">RM{stats.totalRevenue}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Verified - Enhanced design */}
                    <div className="group relative overflow-hidden rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-indigo-200 hover:shadow-2xl dark:border-indigo-900/50 dark:from-indigo-900/40 dark:via-gray-800 dark:to-indigo-900/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-300 opacity-40 blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-200 opacity-30 blur-xl"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet-cards-icon lucide-wallet-cards"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" /><path d="M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('paymentVerified')}</p>
                                </div>
                                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">{stats.paymentVerified}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Main Table Area - 3 columns */}
                    <div className="lg:col-span-3">
                        <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            {/* Search Bar */}
                            <div className="border-b border-gray-100 p-4 sm:p-6 dark:border-gray-700">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t('searchParcels')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 text-gray-700 placeholder-gray-400 focus:ring-3 focus:ring-pink-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Tabs - Updated with colored badges */}
                            <div className="border-b border-gray-100 p-4 sm:p-6 dark:border-gray-700">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {(['All Parcels', 'Pending Payment', 'Ready For Collection', 'Collected', 'Unclaimed'] as TabType[]).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{ boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.25)' }}
                                            className={`rounded-lg border px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${getTabStyles(tab)}`}
                                        >
                                            {getTranslatedTabName(tab)} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${getBadgeStyles(tab)}`}>{counts[tab]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table Content */}
                            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                                {filteredParcels.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                            {searchTerm ? `No parcels found matching "${searchTerm}"` : `No parcels in ${activeTab.toLowerCase()}`}
                                        </h3>
                                        <p className="text-gray-500">Try adjusting your search or filters</p>
                                    </div>
                                ) : (
                                    sortedParcels.map((parcel) => (
                                        <div
                                            key={parcel.parcel_id}
                                            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500/50"
                                        >
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                                                {/* Left side - Parcel info */}
                                                <div className="flex flex-1 items-start gap-3 sm:gap-6 w-full">
                                                    {/* Parcel icon */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-pink-300 shadow-lg">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-6 w-6 text-pink-500"
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                                                                <path d="M12 22V12" />
                                                                <polyline points="3.29 7 12 12 20.71 7" />
                                                                <path d="m7.5 4.27 9 5.15" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Parcel details */}
                                                    <div className="flex-1 space-y-2">
                                                        {/* Header row */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                            <h3 className="font-['Consolas'] text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                                                                {parcel.parcel_code || 'N/A'}
                                                            </h3>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(parcel.parcel_status)}`}
                                                            >
                                                                {getTranslatedStatus(parcel.parcel_status)}
                                                            </span>
                                                        </div>

                                                        {/* Collection code (display if present) */}
                                                        {parcel.collection_code && (
                                                            <div className="mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {t('collectionCode')}: <span className="font-['Consolas'] font-medium text-gray-900 dark:text-white">{parcel.collection_code}</span>
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Student info */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                                                <svg
                                                                    className="h-6 w-6 text-green-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {parcel.student_user?.name || parcel.recipient_name || 'N/A'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {parcel.student_user?.matric || parcel.recipient_matric || 'No Matric ID'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Compact Two-Line Layout */}
                                                        <div className="space-y-5">
                                                            {/* First line - Location and Days */}
                                                            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <svg
                                                                        className="h-4 w-4 text-gray-400"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        <span className="font-medium">{t('location')}:</span> {parcel.location || 'N/A'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <svg
                                                                        className="h-4 w-4 text-gray-400"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        <span className="font-medium">{t('days')}:</span> {parcel.days || 0} {t('days')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Scheduled pickup information for Ready For Collection parcels */}
                                                            {parcel.parcel_status?.toLowerCase() === 'ready for collection' &&
                                                                (parcel.schedule || parcel.time_slot) && (
                                                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-3 px-4 shadow-sm transition-colors dark:border-purple-800 dark:bg-purple-900/20">
                                                                        <svg
                                                                            className="h-4 w-4 text-purple-600"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                            />
                                                                        </svg>
                                                                        <div className="flex flex-col text-left leading-tight">
                                                                            <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">{t('scheduled')}</span>
                                                                            <span className="text-xs text-purple-700 dark:text-purple-300">
                                                                                {formatScheduledDate(parcel.schedule) && parcel.time_slot
                                                                                    ? `${formatScheduledDate(parcel.schedule)} • ${parcel.time_slot}`
                                                                                    : parcel.time_slot ||
                                                                                    formatScheduledDate(parcel.schedule) ||
                                                                                    t('noScheduleSet')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Second line - All staff and timestamp info in one line */}
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {t('createdBy')}:{' '}
                                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                            {typeof parcel.created_by === 'object' && parcel.created_by?.name
                                                                                ? parcel.created_by.name
                                                                                : `Staff ID: ${parcel.created_by}`}
                                                                        </span>
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {t('lastEditedBy')}:{' '}
                                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                            {typeof parcel.last_edited_by === 'object' && parcel.last_edited_by?.name
                                                                                ? parcel.last_edited_by.name
                                                                                : `Staff ID: ${parcel.last_edited_by}`}
                                                                        </span>
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                    <span>{t('added')}: {formatDateTime(parcel.created_at)}</span>
                                                                </div>

                                                                {parcel.updated_at !== parcel.created_at && (
                                                                    <div className="flex items-center gap-1">
                                                                        <svg
                                                                            className="h-3 w-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                            />
                                                                        </svg>
                                                                        <span>{t('updated')}: {formatDateTime(parcel.updated_at)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right side - Actions */}
                                                <div className="flex items-center gap-3">
                                                    {(parcel.parcel_status?.toLowerCase() === 'ready for collection' ||
                                                        parcel.parcel_status?.toLowerCase() === 'ready to collect') && (
                                                            <button
                                                                onClick={() => sendReminder(parcel.parcel_id)}
                                                                className="rounded-2xl p-3 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-yellow-50 hover:text-yellow-400 hover:shadow-lg"
                                                            >
                                                                <BellRing className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    <button
                                                        onClick={() => handleViewParcel(parcel.parcel_id)}
                                                        className="rounded-2xl p-3 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditParcel(parcel)}
                                                        className="rounded-2xl p-3 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-orange-50 hover:text-orange-500 hover:shadow-lg"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(parcel.parcel_id, parcel.parcel_code)}
                                                        className="rounded-2xl p-3 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-600 hover:shadow-lg"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                    {parcel.parcel_status?.toLowerCase() === 'ready for collection' && (
                                                        <button
                                                            onClick={() => handleMarkAsCollected(parcel.parcel_id)}
                                                            disabled={collectingParcels.has(parcel.parcel_id)}
                                                            className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-150 ${collectingParcels.has(parcel.parcel_id)
                                                                ? 'cursor-not-allowed bg-green-500 opacity-80'
                                                                : 'bg-green-600 hover:scale-105 hover:bg-green-700 hover:shadow-xl active:scale-95'
                                                                }`}
                                                        >
                                                            <CircleCheck className="h-4 w-4" />
                                                            <span>{t('markAsCollected')}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - 1 column */}
                    <div className="col-span-1 space-y-6">
                        {/* Quick Actions - Enhanced */}
                        <div className="relative overflow-hidden rounded-3xl border-2 border-gradient-to-br from-pink-100 to-purple-100 bg-white p-6 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 opacity-20 blur-3xl"></div>
                            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-tr from-blue-200 to-cyan-200 opacity-20 blur-2xl"></div>

                            <div className="relative mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 shadow-lg">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">{t('quickActions')}</h3>
                            </div>

                            <div className="relative space-y-4">
                                <Link
                                    href="/staff/add-parcel"
                                    className="group flex w-full items-center gap-4 rounded-2xl border-2 border-pink-100 bg-gradient-to-r from-pink-50 via-white to-pink-50 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:border-pink-300 hover:shadow-xl hover:from-pink-100 hover:to-pink-50 dark:border-pink-900/50 dark:from-pink-900/20 dark:via-gray-800 dark:to-pink-900/10"
                                >
                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-base font-bold text-gray-900 group-hover:text-pink-700 dark:text-gray-100 dark:group-hover:text-pink-400">{t('registerNewParcel')}</span>
                                        <p className="mt-1 text-xs text-gray-500 group-hover:text-pink-600 dark:text-gray-400 dark:group-hover:text-pink-300">{t('addNewParcelSystem')}</p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition-all duration-300 group-hover:bg-pink-600 group-hover:text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>

                                <button
                                    onClick={openScanModal}
                                    className="group flex w-full items-center gap-4 rounded-2xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 via-white to-purple-50 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:border-purple-300 hover:shadow-xl hover:from-purple-100 hover:to-purple-50 dark:border-purple-900/50 dark:from-purple-900/20 dark:via-gray-800 dark:to-purple-900/10"
                                >
                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-base font-bold text-gray-900 group-hover:text-purple-700 dark:text-gray-100 dark:group-hover:text-purple-400">{t('scanQRCode')}</span>
                                        <p className="mt-1 text-xs text-gray-500 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-300">{t('quickParcelIdentification')}</p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Today's Collections - Enhanced */}
                        <div className="relative overflow-hidden rounded-3xl border-2 border-gradient-to-br from-blue-100 to-cyan-100 bg-white p-6 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 opacity-20 blur-3xl"></div>
                            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-tr from-purple-200 to-pink-200 opacity-20 blur-2xl"></div>

                            <div className="relative mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 shadow-lg">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">{t('collections')}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatScheduledDate(selectedDate)}</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1 text-sm font-bold text-blue-700 shadow-sm">
                                        {todaysCollections.length}
                                    </span>
                                </div>
                            </div>

                            <div className="relative mb-4">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                                    aria-label="Select date"
                                />
                            </div>

                            <div className="relative max-h-[600px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {todaysCollections.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:bg-gray-900 dark:border-gray-700">
                                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">{t('noCollectionsScheduled')}</p>
                                        <p className="mt-1 text-xs text-gray-400">{t('forThisDate')}</p>
                                    </div>
                                ) : (
                                    todaysCollections.map((g) => (
                                        <div key={g.key} className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-sm transition-all group-hover:scale-105 group-hover:from-purple-200 group-hover:to-purple-300">
                                                    <span className="text-sm font-bold text-purple-700">{g.time_slot ? g.time_slot.split(' - ')[0].replace(/\s?(AM|PM)/, '') : ''}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{g.student_name}</p>
                                                            {g.student_matric && (
                                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                                    {g.student_matric}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                                                            <span className="font-semibold text-gray-500 dark:text-gray-400">Parcels:</span>
                                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                {g.parcels.map((pp) => (
                                                                    <span
                                                                        key={pp.parcel_code}
                                                                        className="inline-flex items-center rounded-lg border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-pink-100 px-2.5 py-1 font-mono text-[11px] font-bold text-pink-700 shadow-sm transition-all hover:scale-105 hover:shadow-md"
                                                                    >
                                                                        {pp.parcel_code}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            <span className="font-medium">{g.time_slot || formatScheduledDate(g.schedule || '')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
