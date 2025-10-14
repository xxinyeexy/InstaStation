import QRCodeModal from '@/components/qr-code-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Package, Sparkles, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Parcel',
        href: '/student/parcel',
    },
];

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
const WelcomeHeader = ({ user, activeParcelCount }: { user: any; activeParcelCount: number }) => {
    // Get current time for greeting
    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
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
            return `Matric ID: ${user.matric}`;
        }
        if (user?.email) {
            return `Email: ${user.email}`;
        }
        return `Matric ID: A12345678`;
    };

    return (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-card dark:ring-border">
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                        <Sparkles className="h-3 w-3" />
                        Welcome Back
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
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">Active</div>
                </div>
            </div>
        </div>
    );
};
export default function Dashboard({ parcels = [] }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;

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
                addToastNotification('error', 'QR Code Error', error.message);
            } else {
                addToastNotification('error', 'QR Code Error', 'Failed to generate QR code');
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
                addToastNotification('success', 'Success!', 'Parcel updated successfully!');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to update parcel:', error);
            addToastNotification('error', 'Error!', 'Failed to update parcel. Please try again.');
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
                    addToastNotification('success', 'Payment Uploaded', 'Payment proof uploaded successfully! Staff will verify within 24 hours.');
                    setShowPayModal(false);
                    setPayParcelId(null);
                    router.reload({ only: ['parcels'] });
                },
                onError: (errors) => {
                    const firstError = typeof errors === 'object' ? Object.values(errors)[0] : null;
                    addToastNotification('error', 'Upload Failed', (firstError as string) || 'Failed to upload proof');
                },
                onFinish: () => {
                    setIsUploadingProof(false);
                    if (proofInputRef.current) proofInputRef.current.value = '';
                },
                preserveScroll: true,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
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

                {/* QR Code Modal */}
                <QRCodeModal isOpen={showQRModal} onClose={handleCloseQRModal} qrCodeData={qrCodeData} isLoading={loadingQRParcels.size > 0} />

                {/* Quick Pay Modal */}
                {showPayModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-card">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-card-foreground">Payment QR Scanner</h2>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-muted-foreground">
                                        Scan payment QR code and upload payment proof
                                    </p>
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
                                    {isUploadingProof ? 'Uploading...' : 'Upload Payment Proof'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Parcel Details Modal */}
                {showDetailsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
                    {/* Welcome header */}
                    <WelcomeHeader user={currentUser} activeParcelCount={activeParcelCount} />

                    {/* Removed notification system from parcel.tsx */}

                    {/* Header tiles matching screenshot */}
                    <div className="mb-6 grid grid-cols-12 gap-4">
                        {/* My Parcels - Purple (icon on right) */}
                        <div className="col-span-2 rounded-xl border-3 border-violet-300 bg-violet-50 p-4 dark:border-violet-500/50 dark:bg-violet-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-violet-400">My Parcels</div>
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
                        <div className="col-span-2 rounded-xl border-3 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/50 dark:bg-yellow-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-yellow-400">Pending Payment</div>
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
                        <div className="col-span-2 rounded-xl border-3 border-amber-200 bg-amber-50 p-4 dark:border-amber-500/50 dark:bg-amber-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-amber-400">Approved</div>
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
                        <div className="col-span-4 col-start-9 rounded-xl border-3 border-gray-100 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
                            <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-card-foreground">Quick Actions</div>
                            <button className="flex w-full items-center justify-between rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-500/30">
                                <span>Generate Reports</span>
                            </button>
                        </div>

                        {/* Ready for Collection - Green (icon on right) */}
                        <div className="col-span-3 rounded-xl border-3 border-green-200 bg-green-50 p-4 dark:border-green-500/50 dark:bg-green-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-green-400">Ready for Collection</div>
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

                        {/* Collected - Light Blue (icon on right) */}
                        <div className="col-span-3 rounded-xl border-3 border-blue-200 bg-blue-50 p-4 dark:border-blue-500/50 dark:bg-blue-500/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-600 dark:text-blue-400">Collected</div>
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
                            No parcels found
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
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="font-['Consolas'] text-sm font-semibold text-gray-900 dark:text-card-foreground">
                                                    {parcel.parcel_code || 'N/A'}
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyles(parcel.parcel_status)}`}
                                            >
                                                {parcel.parcel_status}
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
                                            <span>Arrived: {formatDate(parcel.created_at)}</span>
                                        </div>

                                        <div className="mb-4 text-sm">
                                            <span className="mr-2 text-gray-600 dark:text-muted-foreground">Payment:</span>
                                            {isApproved ? (
                                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isPendingPayment && (
                                                <button
                                                    onClick={() => handlePayNow(parcel.parcel_id)}
                                                    className="flex-1 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                                >
                                                    Pay Now
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
                                                    Collect
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
                                                                    Show QR Code
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewParcel(parcel.parcel_id)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                                                        >
                                                            View Details
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
                                                                    Scheduled
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
                                                    View Details
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
        </AppLayout>
    );
}
