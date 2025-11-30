import QRCodeModal from '@/components/qr-code-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, CheckCircle, MapPin, Package, Sparkles, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Define the Parcel interface based on your database structure
interface Parcel {
    parcel_id: number;
    parcel_code: string; // Unique code for the parcel
    student_id: number;
    tracking_no: string;
    parcel_status: string;
    days: number;
    sender: string;
    size: string;
    location: string;
    qr_code: string;
    schedule: string;
    time_slot?: string;
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
    payment_proof_url?: string | null;
    payment_verified?: boolean;
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

// Toast notification interface for local notifications
interface ToastNotification {
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
}

// Extended interface for editing parcel
interface EditParcelForm {
    parcel_code: string;
    parcel_status: string;
    recipient_name: string;
    email: string;
    student_id: string;
    fee: number;
    sender_name: string;
    sender_address: string;
    weight: string;
    dimensions: string;
    description: string;
}
const WelcomeHeader = ({ user, activeParcelCount, t }: { user: any; activeParcelCount: number; t: any }) => {
    // Get current time for greeting
    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('goodMorning');
        if (hour < 17) return t('goodAfternoon');
        return t('goodEvening');
    };

    // Format user display name
    const getDisplayName = () => {
        if (user?.name) {
            return user.name;
        }
        return 'John Doe';
    };

    // Get user identifier (matric for students, email for staff)
    const getUserIdentifier = () => {
        if (user?.matric) {
            return `${t('matricID')}: ${user.matric}`;
        }
        if (user?.email) {
            return `Email: ${user.email}`;
        }
        return `${t('matricID')}: A12345678`;
    };

    return (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-card dark:ring-border">
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                        <Sparkles className="h-3 w-3" />
                        {t('welcomeBackBadge')}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-card-foreground">
                            {getCurrentGreeting()}, {getDisplayName()}!
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">{getUserIdentifier()}</p>
                    </div>
                </div>

                {/* Right side - Active parcels count */}
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-600 shadow-lg">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-card-foreground">{activeParcelCount}</div>
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">{t('active')}</div>
                </div>
            </div>
        </div>
    );
};
export default function Dashboard({ parcels = [] }: DashboardProps) {
    const { t } = useLanguage();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('myParcels'),
            href: '/student/parcel',
        },
    ];

    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;
    const pageProps: any = usePage<SharedData>().props;
    const serverNotifications: any[] = pageProps.notifications || [];

    const [activeTab, setActiveTab] = useState<TabType>('All Parcels');
    const [searchTerm, setSearchTerm] = useState('');
    // Use state for parcel list and initialize it with the parcels prop
    const [parcelList, setParcelList] = useState<Parcel[]>(parcels);

    // Removed notification system from parcel.tsx
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
    const [selectedParcelCode, setSelectedParcelCode] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Parcel details modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [parcelDetails, setParcelDetails] = useState<ParcelDetails | null>(null);
    // Remove isLoadingDetails

    // Edit parcel modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);
    const [editForm, setEditForm] = useState<EditParcelForm>({
        parcel_code: '',
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
    const [isUpdating, setIsUpdating] = useState(false);

    // Toast notification state
    const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);

    // In-app server notifications (bell dropdown)
    const [notificationList, setNotificationList] = useState<any[]>(serverNotifications);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // Update notification list when server-sent notifications change, filtering out dismissed ones
    useEffect(() => {
        console.log('Parcel page - Server notifications changed:', serverNotifications);
        console.log('Dismissed IDs:', Array.from(dismissedNotificationIds));

        // Filter out any notifications that were manually dismissed
        const filteredNotifications = (serverNotifications || []).filter((n) => !dismissedNotificationIds.has(n.id));
        console.log('Filtered notifications:', filteredNotifications.length);
        setNotificationList(filteredNotifications);
    }, [serverNotifications, dismissedNotificationIds]);

    // Show ALL notifications (unified across all pages - payment, parcel, etc.)
    const visibleNotifications = notificationList;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.notification-dropdown') && !target.closest('.notification-bell')) {
                setShowNotificationDropdown(false);
            }
        };

        if (showNotificationDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotificationDropdown]);

    const handleNotificationClick = async (notification: any) => {
        console.log('=== NOTIFICATION CLICK START ===');
        console.log('Full notification object:', JSON.stringify(notification, null, 2));
        console.log('Notification ID:', notification.id);
        console.log('Notification title:', notification.title);
        console.log('Current notification list length:', notificationList.length);

        setShowNotificationDropdown(false);

        // If this is a payment_rejected notification, do NOT dismiss/read yet.
        // Student must resubmit proof; keep it visible.
        const isStickyRejection = notification.type === 'payment_rejected';
        if (!isStickyRejection) {
            // Add to dismissed list so it won't come back even if props refresh
            setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

            // Optimistically remove from UI immediately for better UX
            console.log('Optimistically removing notification from list');
            setNotificationList((prev) => {
                const filtered = prev.filter((n) => n.id !== notification.id);
                console.log('New list length:', filtered.length);
                return filtered;
            });
        } else {
            console.log('Sticky payment_rejected notification - keeping visible until resubmission.');
        }

        // Mark as read on the server ONLY if not sticky
        if (notification.id && !isStickyRejection) {
            try {
                console.log('Sending POST to:', `/student/notifications/${notification.id}/mark-read`);

                const response = await fetch(`/student/notifications/${notification.id}/mark-read`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    credentials: 'same-origin',
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (!response.ok) {
                    console.log('Server returned non-OK status (notification may already be read):', response.status);
                    // Don't throw error - the notification is removed from UI which is what matters
                    return;
                }

                const result = await response.json();
                console.log('Response JSON:', result);
            } catch (e) {
                console.log('Network error marking notification as read (UI already updated):', e);
                // Don't restore notification to list - better UX to keep it removed
            }
        } else {
            console.error('No notification ID found!');
        }

        // Handle different notification types
        const title = notification.title?.toLowerCase() || '';
        const message = notification.message?.toLowerCase() || '';

        console.log('Checking notification type...');
        console.log('Title includes "parcel collected"?', title.includes('parcel collected'));
        console.log('Message includes "successfully collected"?', message.includes('successfully collected'));

        // Check if it's a "Parcel Collected" notification - just mark as read and don't navigate
        if (title.includes('parcel collected') || message.includes('successfully collected')) {
            console.log('This is a Parcel Collected notification - not navigating');
            // Just remove from list, no navigation
            return;
        }

        console.log('Not a parcel collected notification - checking navigation...');

        // For other notifications, navigate as usual
        if (notification.type === 'payment_rejected' && notification.parcel_id) {
            console.log('Navigating to payment submit page (sticky notification retained)');
            router.visit(`/student/payment/submit/${notification.parcel_id}`);
        } else if (notification.parcel_id) {
            console.log('Navigating to parcel detail page');
            router.visit(`/student/parcel/${notification.parcel_id}`);
        } else if (notification.type === 'payment_verified') {
            console.log('Navigating to payment page');
            router.visit('/student/payment');
        }

        console.log('=== NOTIFICATION CLICK END ===');
    };

    // QR Code Modal state
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<{
        qr_code: string;
        collection_code: string;
        tracking_no: string;
        qr_code_image: string;
    } | null>(null);
    const [loadingQRParcels, setLoadingQRParcels] = useState<Set<number>>(new Set());
    const [showPayModal, setShowPayModal] = useState(false);
    const [payParcelId, setPayParcelId] = useState<number | null>(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const proofInputRef = useRef<HTMLInputElement | null>(null);

    // Removed notification dropdown state and handlers

    // Add toast notification function
    const addToastNotification = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now().toString();
        const newToastNotification: ToastNotification = { id, type, title, message };
        setToastNotifications((prev) => [...prev, newToastNotification]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToastNotification(id);
        }, 5000);
    };

    // Remove toast notification function
    const removeToastNotification = (id: string) => {
        setToastNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    // ========= Locations Quick Action =========
    type Hub = {
        name: string;
        operating: { start: string; end: string }; // 24h format 'HH:MM'
        addressQuery: string; // used for Google Maps search
    };

    const hubs: Hub[] = [
        {
            name: 'Postal Hub, Universiti Malaysia Pahang Al-Sultan Abdullah, Gambang Campus',
            operating: { start: '09:00', end: '18:00' },
            addressQuery: 'Universiti Malaysia Pahang Al-Sultan Abdullah Gambang Campus',
        },
        {
            name: 'Postal Hub, Universiti Malaysia Pahang Al-Sultan Abdullah, Pekan Campus',
            operating: { start: '08:00', end: '22:00' },
            addressQuery: 'Universiti Malaysia Pahang Al-Sultan Abdullah Pekan Campus',
        },
    ];

    const isHubOpenNow = (hub: Hub) => {
        try {
            const now = new Date();
            const [sh, sm] = hub.operating.start.split(':').map(Number);
            const [eh, em] = hub.operating.end.split(':').map(Number);
            const start = new Date(now);
            start.setHours(sh, sm, 0, 0);
            const end = new Date(now);
            end.setHours(eh, em, 0, 0);
            // Handle ranges that pass midnight: treat end < start as next day
            if (end <= start) end.setDate(end.getDate() + 1);
            return now >= start && now <= end;
        } catch {
            return false;
        }
    };

    const [showLocations, setShowLocations] = useState(false);
    const [selectedHub, setSelectedHub] = useState<Hub | null>(null);

    const openMaps = (query: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    };

    // Format HH:MM (24h) to h:mma/p format (e.g., 22:00 -> 10:00 PM)
    const toAmPm = (hhmm: string) => {
        const [hRaw, mRaw] = hhmm.split(':');
        const h = Number(hRaw);
        const m = Number(mRaw);
        if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = ((h + 11) % 12) + 1;
        return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    };

    // Removed notification click handler

    // Navigate to view-parcel page
    const handleViewParcel = (parcelId: number) => {
        router.visit(`/student/parcel/${parcelId}`);
    };

    // Handle QR code generation
    const handleShowQRCode = async (parcelId: number) => {
        setLoadingQRParcels((prev) => new Set(prev).add(parcelId));

        // Show modal immediately for instant feedback
        setShowQRModal(true);
        setQrCodeData(null); // Clear previous data

        try {
            const response = await fetch(`/student/parcel/${parcelId}/qr-code`, {
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
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    const errorText = await response.text();
                    errorMessage += `\n\nResponse: ${errorText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.qr_code_image) {
                throw new Error('QR code image not generated properly');
            }

            setQrCodeData(data);
        } catch (error) {
            console.error('QR code generation error:', error);
            if (error instanceof Error) {
                addToastNotification('error', t('qrCodeError'), error.message);
            } else {
                addToastNotification('error', t('qrCodeError'), t('failedToGenerateQR'));
            }
            // Close modal on error
            setShowQRModal(false);
        } finally {
            setLoadingQRParcels((prev) => {
                const newSet = new Set(prev);
                newSet.delete(parcelId);
                return newSet;
            });
        }
    };

    // Close QR modal
    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setQrCodeData(null);
    };

    // Close details modal
    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setParcelDetails(null);
    };

    // Handle edit parcel
    const handleEditParcel = (parcel: Parcel) => {
        setEditingParcel(parcel);
        setEditForm({
            parcel_code: parcel.parcel_code || '',
            parcel_status: parcel.parcel_status || '',
            recipient_name: parcel.student_user?.name || '',
            email: parcel.student_user?.email || '',
            student_id: parcel.student_user?.matric || parcel.student_id?.toString() || '',
            fee: 1.0, // Default fee
            sender_name: parcel.sender || '',
            sender_address: 'N/A', // Not in database
            weight: 'N/A', // Not in database
            dimensions: parcel.size || '',
            description: 'N/A', // Not in database
        });
        setShowEditModal(true);
    };

    // Handle form input changes
    const handleEditFormChange = (field: keyof EditParcelForm, value: string | number) => {
        setEditForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle form submission
    const handleUpdateParcel = async () => {
        if (!editingParcel) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/staff/parcel/${editingParcel.parcel_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    parcel_code: editForm.parcel_code,
                    parcel_status: editForm.parcel_status,
                    sender_name: editForm.sender_name,
                    sender_address: editForm.sender_address,
                    dimensions: editForm.dimensions,
                    weight: editForm.weight,
                    fee: editForm.fee,
                    description: editForm.description,
                    location: editingParcel.location,
                }),
            });

            if (response.ok) {
                const result = await response.json();

                // Update local state
                setParcelList((prev) =>
                    prev.map((parcel) => (parcel.parcel_id === editingParcel.parcel_id ? { ...parcel, ...result.parcel } : parcel)),
                );

                setShowEditModal(false);
                setEditingParcel(null);
                addToastNotification('success', t('success'), t('parcelUpdatedSuccess'));
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to update parcel:', error);
            addToastNotification('error', t('error'), t('failedToUpdateParcel'));
        } finally {
            setIsUpdating(false);
        }
    };

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

    // Tile counts for the dashboard header cards
    const tileCounts = {
        myParcels: parcelList.filter((p) => p.parcel_status?.toLowerCase() !== 'collected').length,
        pendingPayment: parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'pending payment').length,
        approved: parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'approved').length,
        readyForCollection: parcelList.filter((p) => ['ready for collection', 'ready to collect'].includes(p.parcel_status?.toLowerCase())).length,
        collected: parcelList.filter((p) => p.parcel_status?.toLowerCase() === 'collected').length,
    };

    // Active parcels count for Welcome header (non-collected)
    const activeParcelCount = tileCounts.myParcels;

    // Simple search-based filtering for the card grid (no tabs in redesigned UI)
    const displayParcels = parcelList.filter((parcel) => {
        // Show all parcels except 'collected' status for students
        const status = parcel.parcel_status?.toLowerCase();
        if (status === 'collected') return false;

        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            parcel.parcel_code?.toLowerCase().includes(q) ||
            parcel.sender?.toLowerCase().includes(q) ||
            parcel.location?.toLowerCase().includes(q) ||
            parcel.student_id?.toString().includes(searchTerm) ||
            parcel.student_user?.name?.toLowerCase().includes(q) ||
            parcel.student_user?.matric?.toLowerCase().includes(q)
        );
    });

    const handlePayNow = (parcelId: number) => {
        setPayParcelId(parcelId);
        setShowPayModal(true);
    };

    const handleProofSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || payParcelId == null) return;
        setIsUploadingProof(true);

        // Use Inertia router to post FormData with proper CSRF/session handling to avoid 419
        router.post(
            `/student/payment/submit/${payParcelId}`,
            { proof: file },
            {
                forceFormData: true,
                onSuccess: () => {
                    // Close modal and show success notification
                    setShowPayModal(false);
                    setPayParcelId(null);
                    addToastNotification('success', t('paymentUploaded'), t('paymentProofUploaded'));

                    // Reload only parcels and notifications data
                    router.reload({
                        only: ['parcels', 'notifications'],
                    });
                },
                onError: (errors) => {
                    const firstError = typeof errors === 'object' ? Object.values(errors)[0] : null;
                    addToastNotification('error', t('uploadFailed'), (firstError as string) || t('failedToUploadProof'));
                },
                onFinish: () => {
                    setIsUploadingProof(false);
                    if (proofInputRef.current) proofInputRef.current.value = '';
                },
            },
        );
    };

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
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ready for collection':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'collected':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'unclaimed':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'approved':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getTabStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        // Active and hover colors should match for each tab
        switch (tab) {
            case 'All Parcels':
                return isActive
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200';
            case 'Pending Payment':
                return isActive
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200';
            case 'Ready For Collection':
                return isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#EDE9FE] hover:text-[#5B21B6] hover:border-purple-200';
            case 'Collected':
                return isActive
                    ? 'bg-[#DCFCE7] text-[#166534] border-green-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#DCFCE7] hover:text-[#166534] hover:border-green-200';
            case 'Unclaimed':
                return isActive
                    ? 'bg-[#C5C5CF] text-black border-gray-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#C5C5CF] hover:text-black hover:border-gray-300';
            default:
                return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-700';
        }
    };

    // Function to get badge styles for each tab
    const getBadgeStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        if (isActive) {
            // Active badge styles (semi-transparent white)
            return 'bg-white/50';
        } else {
            // Inactive badge styles should match the active tab colors
            switch (tab) {
                case 'All Parcels':
                    return 'bg-blue-100 text-blue-600';
                case 'Pending Payment':
                    return 'bg-orange-100 text-orange-600';
                case 'Ready For Collection':
                    return 'bg-purple-100 text-purple-600';
                case 'Collected':
                    return 'bg-green-100 text-green-600';
                case 'Unclaimed':
                    return 'bg-gray-100 text-gray-600';
                default:
                    return 'bg-gray-100 text-white';
            }
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
            case 'approved':
                return t('approved');
            case 'unclaimed':
                return t('unclaimed');
            default:
                return status;
        }
    };

    // Updated handleMarkAsCollected function - navigates to schedule page
    const handleMarkAsCollected = (parcelId: number) => {
        // Navigate to schedule page with parcel ID
        router.visit(`/student/schedule/${parcelId}`);
    };

    // Format date for display
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
    const handleDeleteClick = (parcelId: number, parcelCode: string) => {
        setSelectedParcelId(parcelId);
        setSelectedParcelCode(parcelCode);
        setShowDeleteModal(true);
    };

    // Prevent body scroll when any modal is open
    useEffect(() => {
        if (showPayModal || showDetailsModal || showDeleteModal || showQRModal || showLocations) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showPayModal, showDetailsModal, showDeleteModal, showQRModal, showLocations]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Notification Bell - Positioned at top right */}
            <div className="fixed top-4 right-6 z-50">
                <div className="relative">
                    <button
                        onClick={() => setShowNotificationDropdown((s) => !s)}
                        className="notification-bell relative rounded-full border border-border bg-background p-3 shadow-md hover:bg-accent"
                    >
                        <Bell className="h-6 w-6 text-foreground" />
                        {visibleNotifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                                {visibleNotifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotificationDropdown && (
                        <div className="notification-dropdown absolute top-12 right-0 z-50 w-96 rounded-lg border bg-popover shadow-lg">
                            <div className="border-b border-border p-4">
                                <h3 className="text-lg font-semibold text-popover-foreground">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {visibleNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
                                ) : (
                                    visibleNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className="cursor-pointer border-b border-border bg-popover p-4 hover:bg-accent"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-popover-foreground">{notification.title}</h4>
                                                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                                                    {notification.parcel_code && (
                                                        <p className="mt-1 text-xs text-muted-foreground">Parcel: {notification.parcel_code}</p>
                                                    )}
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 p-6">
                {/* Toast Notification Container */}
                <div className="fixed right-4 bottom-4 z-50 space-y-3">
                    {toastNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`max-w-96 min-w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out ${
                                notification.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : 'border-red-200 bg-red-50/95 text-red-800 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-300'
                            } `}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold">{notification.title}</h4>
                                    <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                                </div>
                                <button
                                    onClick={() => removeToastNotification(notification.id)}
                                    className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <WelcomeHeader user={currentUser} activeParcelCount={activeParcelCount} t={t} />

                {/* QR Code Modal */}
                <QRCodeModal isOpen={showQRModal} onClose={handleCloseQRModal} qrCodeData={qrCodeData} isLoading={loadingQRParcels.size > 0} />

                {/* Quick Pay Modal */}
                {showPayModal && (
                    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/70 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-card">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">{t('paymentQRScanner')}</h2>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-muted-foreground">{t('scanPaymentQRAndUpload')}</p>
                                </div>
                                <button
                                    onClick={() => setShowPayModal(false)}
                                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="mb-4 flex h-35 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-border">
                                    <img src="/images/qrpayment.png" alt="DuitNow QR" className="h-40 w-40 object-contain" />
                                </div>
                                <input ref={proofInputRef} type="file" accept="image/*" onChange={handleProofSelected} className="hidden" />
                                <button
                                    onClick={() => proofInputRef.current?.click()}
                                    disabled={isUploadingProof}
                                    className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-border dark:bg-muted dark:text-foreground dark:hover:bg-accent"
                                >
                                    <Upload className="h-4 w-4" />
                                    {isUploadingProof ? t('uploading') : t('uploadPaymentProof')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Parcel Details Modal */}
                {showDetailsModal && (
                    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/70 p-4">
                        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-card">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-card-foreground">Parcel Details</h2>

                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Complete information about the parcel</p>
                                </div>
                                <button
                                    onClick={handleCloseDetailsModal}
                                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="min-h-screen bg-white p-6 dark:bg-background">
                    {/* Header tiles matching screenshot */}
                    <div className="mb-6 grid grid-cols-12 gap-x-4 gap-y-3">
                        {/* My Parcels - Purple (icon on right) */}
                        <div className="col-span-3 h-30 rounded-xl border-3 border-violet-300 bg-violet-50 p-4 dark:border-violet-500/50 dark:bg-violet-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-violet-400">{t('myParcels')}</div>
                                    <div className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">{tileCounts.myParcels}</div>
                                </div>
                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/30 dark:text-violet-300">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Pending Payment - Yellow (icon on right) */}
                        <div className="col-span-3 h-30 rounded-xl border-3 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/50 dark:bg-yellow-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-yellow-400">{t('pendingPayment')}</div>
                                    <div className="mt-1 text-3xl font-bold text-yellow-700 dark:text-yellow-300">{tileCounts.pendingPayment}</div>
                                </div>
                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-300">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Approved - Orange (icon on right) */}
                        <div className="col-span-3 h-30 rounded-xl border-3 border-amber-200 bg-amber-50 p-4 dark:border-amber-500/50 dark:bg-amber-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-amber-400">{t('approved')}</div>
                                    <div className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">{tileCounts.approved}</div>
                                </div>
                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/30 dark:text-amber-300">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="col-span-4 col-start-11 rounded-xl border-3 border-gray-100 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
                            <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-card-foreground">{t('quickActions')}</div>

                            <button
                                onClick={() => {
                                    setSelectedHub(hubs[0]);
                                    setShowLocations(true);
                                }}
                                className="flex w-full items-center justify-between rounded-lg bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/30"
                            >
                                <span>{t('locations')}</span>
                            </button>
                        </div>

                        {/* Ready for Collection - Green (icon on right) */}
                        <div className="col-span-3 h-30 rounded-xl border-3 border-green-200 bg-green-50 p-4 dark:border-green-500/50 dark:bg-green-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-green-400">{t('readyForCollection')}</div>
                                    <div className="mt-1 text-3xl font-bold text-green-700 dark:text-green-300">{tileCounts.readyForCollection}</div>
                                </div>
                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/30 dark:text-green-300">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Locations Modal */}
                        {showLocations && (
                            <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/70 p-4">
                                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-card">
                                    <div className="mb-4 flex items-center justify-between border-b pb-4">
                                        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-card-foreground">
                                            <MapPin className="h-5 w-5" /> Parcel Locations
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowLocations(false);
                                                setSelectedHub(null);
                                            }}
                                            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                                        {hubs.map((hub) => {
                                            const open = isHubOpenNow(hub);
                                            return (
                                                <div
                                                    key={hub.name}
                                                    className={`rounded-lg border p-4 transition-colors ${
                                                        selectedHub?.name === hub.name
                                                            ? 'border-blue-300 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/20'
                                                            : 'border-gray-200 bg-gray-50 dark:border-border dark:bg-muted/30'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-card-foreground">
                                                                {hub.name}
                                                            </h3>
                                                            <p className="mt-1 text-xs text-gray-600 dark:text-muted-foreground">
                                                                Operating time: {toAmPm(hub.operating.start)} to {toAmPm(hub.operating.end)}
                                                            </p>
                                                            <p className="mt-1 text-xs">
                                                                Status:{' '}
                                                                <span
                                                                    className={`font-semibold ${
                                                                        open
                                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                                            : 'text-red-600 dark:text-red-400'
                                                                    }`}
                                                                >
                                                                    {open ? 'OPEN' : 'CLOSE'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedHub(hub)}
                                                            className="rounded-md px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/20"
                                                        >
                                                            {selectedHub?.name === hub.name ? 'Selected' : 'Select'}
                                                        </button>
                                                    </div>
                                                    {selectedHub?.name === hub.name && (
                                                        <div className="mt-3 space-y-3">
                                                            <div className="rounded-md border bg-white p-2 text-center text-xs dark:border-border dark:bg-card">
                                                                {/* Keyless Google Maps embed using q + output=embed (no API key needed) */}
                                                                <iframe
                                                                    title={`Map-${hub.name}`}
                                                                    src={`https://www.google.com/maps?q=${encodeURIComponent(hub.addressQuery)}&output=embed`}
                                                                    className="h-64 w-full rounded-md border"
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer-when-downgrade"
                                                                />
                                                                <p className="mt-2 text-[10px] text-gray-500 dark:text-muted-foreground">
                                                                    Map view via Google Maps (embedded search).
                                                                </p>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => openMaps(hub.addressQuery)}
                                                                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                                                                >
                                                                    Open in Google Maps
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {hubs.length === 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-border dark:bg-muted/30 dark:text-muted-foreground">
                                                No locations available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Collected - Light Blue (icon on right) */}
                        <div className="col-span-3 h-30 rounded-xl border-3 border-blue-200 bg-blue-50 p-4 dark:border-blue-500/50 dark:bg-blue-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-blue-400">{t('collected')}</div>
                                    <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">{tileCounts.collected}</div>
                                </div>
                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/30 dark:text-blue-300">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        className="lucide lucide-package-open-icon lucide-package-open"
                                    >
                                        <path d="M12 22v-9" />
                                        <path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" />
                                        <path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" />
                                        <path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Parcel cards grid */}
                    {displayParcels.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500 dark:border-border dark:bg-card dark:text-muted-foreground">
                            {t('noParcelsFound')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-6">
                            {displayParcels.map((parcel) => {
                                const status = parcel.parcel_status?.toLowerCase();
                                const isApproved = status === 'approved';
                                const isPendingPayment = status === 'pending payment';
                                const isReady = status === 'ready for collection' || status === 'ready to collect';
                                const isCollected = status === 'collected';
                                const scheduledDateStr = parcel.schedule
                                    ? new Date(parcel.schedule).toLocaleDateString('en-MY', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                      })
                                    : '';
                                return (
                                    <div
                                        key={parcel.parcel_id}
                                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card"
                                    >
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400">
                                                    {/* <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                        />
                                                        
                                                    </svg> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2.5"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    >
                                                        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                                                        <path d="M12 22V12" />
                                                        <polyline points="3.29 7 12 12 20.71 7" />
                                                        <path d="m7.5 4.27 9 5.15" />
                                                    </svg>
                                                </div>
                                                <div className="font-['Consolas'] text-sm font-semibold text-gray-900 dark:text-card-foreground">
                                                    {parcel.parcel_code || 'N/A'}
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyles(parcel.parcel_status)}`}
                                            >
                                                {getTranslatedStatus(parcel.parcel_status)}
                                            </span>
                                        </div>

                                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                                            <svg
                                                className="h-4 w-4 text-gray-400 dark:text-muted-foreground"
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
                                                {t('arrived')}: {formatDate(parcel.created_at)}
                                            </span>
                                        </div>

                                        <div className="mb-4 text-sm">
                                            <span className="mr-2 text-gray-600 dark:text-muted-foreground">{t('payment')}:</span>
                                            {parcel.payment_verified || isApproved || isReady ? (
                                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                    {t('verified')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                                                    {t('pending')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isPendingPayment && (
                                                <button
                                                    onClick={() => handlePayNow(parcel.parcel_id)}
                                                    className="flex-1 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                                >
                                                    {t('payNow')}
                                                </button>
                                            )}
                                            {isApproved && (
                                                <button
                                                    onClick={() => handleMarkAsCollected(parcel.parcel_id)}
                                                    className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                                >
                                                    <svg className="mr-1 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {t('collect')}
                                                </button>
                                            )}
                                            {isReady && (
                                                <div className="w-full space-y-2">
                                                    {/* Row 1: QR Code and View Details */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleShowQRCode(parcel.parcel_id)}
                                                            disabled={loadingQRParcels.has(parcel.parcel_id)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                                        >
                                                            {loadingQRParcels.has(parcel.parcel_id) ? (
                                                                <div className="flex items-center justify-center">
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <svg
                                                                        className="mr-1 inline h-4 w-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                                                                        />
                                                                    </svg>
                                                                    {t('showQRCode')}
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewParcel(parcel.parcel_id)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                                        >
                                                            {t('viewDetails')}
                                                        </button>
                                                    </div>

                                                    {/* Row 2: Scheduled full-width */}
                                                    <button className="w-full rounded-xl bg-gray-50 px-4 py-3 text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:bg-muted dark:text-foreground dark:hover:bg-accent">
                                                        <div className="flex items-center gap-3">
                                                            <svg
                                                                className="h-4 w-4 text-gray-600 opacity-90 dark:text-muted-foreground"
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
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-foreground">
                                                                    {t('scheduled')}
                                                                </span>
                                                                <span className="text-xs text-gray-700 dark:text-muted-foreground">
                                                                    {scheduledDateStr && parcel.time_slot
                                                                        ? `${scheduledDateStr} • ${parcel.time_slot}`
                                                                        : parcel.time_slot || scheduledDateStr || ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                            {!isReady && (
                                                <button
                                                    onClick={() => handleViewParcel(parcel.parcel_id)}
                                                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                                >
                                                    {t('viewDetails')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedParcelId !== null && (
                <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-card">
                        <div className="flex flex-col gap-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">{t('confirmDeletion')}</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">{t('areYouSureDeleteParcel')}</p>
                            </div>

                            {/* Parcel details for confirmation */}
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-muted">
                                <div className="flex justify-between">
                                    <span className="font-medium">Parcel Code:</span>
                                    <span>{selectedParcelCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span className={getStatusStyles('Pending Payment')}>Pending Payment</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (selectedParcelId === null) return;
                                        setIsDeleting(true);
                                        try {
                                            const response = await fetch(`/staff/parcel/${selectedParcelId}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                },
                                            });

                                            if (!response.ok) {
                                                throw new Error('Failed to delete parcel. Please try again.');
                                            }

                                            // Remove from local state
                                            setParcelList((prev) => prev.filter((parcel) => parcel.parcel_id !== selectedParcelId));

                                            addToastNotification('success', t('parcelDeleted'), t('parcelDeletedSuccess'));
                                            setShowDeleteModal(false);
                                        } catch (error) {
                                            console.error('Delete parcel error:', error);
                                            addToastNotification('error', t('deletionFailed'), t('failedToDeleteParcel'));
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center justify-center">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                                        </div>
                                    ) : (
                                        'Delete Parcel'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
