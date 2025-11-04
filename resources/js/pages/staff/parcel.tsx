import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BellRing, CheckCircle, Edit, Eye, Trash2, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Parcel',
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
    student_id: string;
    fee: number;
    sender_name: string;
    sender_address: string;
    weight: string;
    dimensions: string;
    description: string;
}

export default function Dashboard({ parcels = [] }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;

    const [activeTab, setActiveTab] = useState<TabType>('All Parcels');
    const [searchTerm, setSearchTerm] = useState('');
    // Use state for parcel list and initialize it with the parcels prop
    const [parcelList, setParcelList] = useState<Parcel[]>(parcels);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
    const [selectedTrackingNo, setSelectedTrackingNo] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        fee: 1.0,
        sender_name: '',
        sender_address: '',
        weight: '',
        dimensions: '',
        description: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Collecting state - track which parcels are being collected
    const [collectingParcels, setCollectingParcels] = useState<Set<number>>(new Set());

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
                await scannerRef.current.clear().catch(() => {});
            }
            if (html5Ref.current) {
                await html5Ref.current.stop().catch(() => {});
                try {
                    await html5Ref.current.clear();
                } catch {}
            }
        } catch {}
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
                addNotification('error', 'Scan Failed', `Parcel not found for code ${code}`);
                return;
            }
            const data = await resp.json();
            if (!data?.success || !data?.parcel) {
                addNotification('error', 'Scan Failed', 'No parcel data returned');
                return;
            }
            setParcelDetails(data.parcel as ParcelDetails);
            setShowDetailsModal(true);
            await closeScanModal();
        } catch {
            addNotification('error', 'Scan Error', 'Could not process QR scan');
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

                await html5.start(cameraConfig as any, scanConfig as any, onDecodeSuccess, () => {});
                // Hint autofocus after start (typed as any to avoid TS lib gaps)
                try {
                    await (html5Ref.current as any)?.applyVideoConstraints?.({ advanced: [{ focusMode: 'continuous' }] });
                } catch {}
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
                await html5Ref.current!.stop().catch(() => {});
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

                await html5Ref.current!.start({ deviceId: { exact: selectedCameraId } } as any, switchConfig as any, onDecodeSuccess, () => {});
                try {
                    await (html5Ref.current as any)?.applyVideoConstraints?.({ advanced: [{ focusMode: 'continuous' }] });
                } catch {}
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
            addNotification('error', 'Error!', 'Parcel not found in local data.');
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
                recipient_name: freshParcel.student_user?.name || '',
                email: freshParcel.student_user?.email || '',
                student_id: freshParcel.student_user?.matric || freshParcel.student_id?.toString() || '',
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
            addNotification('error', 'Error!', 'Failed to load parcel details. Please try again.');
        }
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
                credentials: 'same-origin',
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to update parcel:', error);
            addNotification('error', 'Error!', 'Failed to update parcel. Please try again.');
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
                    : 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50';
            case 'Pending Payment':
                return isActive
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-500/50';
            case 'Ready For Collection':
                return isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200'
                    : 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-[#EDE9FE] dark:hover:bg-purple-500/20 hover:text-[#5B21B6] dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-500/50';
            case 'Collected':
                return isActive
                    ? 'bg-[#DCFCE7] text-[#166534] border-green-200'
                    : 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-[#DCFCE7] dark:hover:bg-green-500/20 hover:text-[#166534] dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-500/50';
            case 'Unclaimed':
                return isActive
                    ? 'bg-[#C5C5CF] text-black border-gray-300'
                    : 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-[#C5C5CF] dark:hover:bg-gray-500/20 hover:text-black dark:hover:text-foreground hover:border-gray-300 dark:hover:border-border';
            default:
                return 'bg-white dark:bg-background text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-accent hover:text-gray-700 dark:hover:text-foreground';
        }
    };

    // Function to get badge styles for each tab
    const getBadgeStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        if (isActive) {
            // Active badge styles (semi-transparent white)
            return 'bg-white/50 dark:bg-background/50';
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
                    return 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground';
                default:
                    return 'bg-gray-100 dark:bg-muted text-white dark:text-foreground';
            }
        }
    };

    // Updated handleMarkAsCollected function - uses backend response
    const handleMarkAsCollected = async (parcelId: number) => {
        // Prevent multiple simultaneous requests for the same parcel
        if (collectingParcels.has(parcelId)) {
            return;
        }

        // Add parcel to collecting set
        setCollectingParcels((prev) => new Set(prev).add(parcelId));

        // Optimistically update the UI immediately
        setParcelList((prev) =>
            prev.map((parcel) =>
                parcel.parcel_id === parcelId
                    ? {
                          ...parcel,
                          parcel_status: 'Collected',
                          updated_at: new Date().toISOString(),
                      }
                    : parcel,
            ),
        );

        // Automatically switch to Collected tab to show the updated parcel
        setActiveTab('Collected');

        // Show success notification immediately
        addNotification('success', 'Success!', 'Parcel marked as collected successfully!');

        try {
            const response = await fetch(`/staff/parcel/${parcelId}/collect`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const result = await response.json();

                // Update with actual server data
                setParcelList((prev) =>
                    prev.map((parcel) =>
                        parcel.parcel_id === parcelId
                            ? {
                                  ...parcel,
                                  parcel_status: 'Collected',
                                  updated_at: result.parcel.updated_at,
                                  last_edited_by: result.parcel.last_edited_by,
                              }
                            : parcel,
                    ),
                );
            } else {
                // Revert the optimistic update on error
                setParcelList((prev) =>
                    prev.map((parcel) =>
                        parcel.parcel_id === parcelId
                            ? {
                                  ...parcel,
                                  parcel_status: 'Ready For Collection',
                              }
                            : parcel,
                    ),
                );

                // Show error notification
                addNotification('error', 'Error!', 'Failed to mark parcel as collected. Please try again.');
            }
        } catch (error) {
            console.error('Failed to mark as collected:', error);

            // Revert the optimistic update on error
            setParcelList((prev) =>
                prev.map((parcel) =>
                    parcel.parcel_id === parcelId
                        ? {
                              ...parcel,
                              parcel_status: 'Ready For Collection',
                          }
                        : parcel,
                ),
            );

            // Show error notification
            addNotification('error', 'Error!', 'Failed to mark parcel as collected. Please try again.');
        } finally {
            // Remove parcel from collecting set
            setCollectingParcels((prev) => {
                const newSet = new Set(prev);
                newSet.delete(parcelId);
                return newSet;
            });
        }
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

        setIsDeleting(true);

        try {
            const response = await fetch(`/staff/parcel/${selectedParcelId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove parcel from local state
            setParcelList((prev) => prev.filter((parcel) => parcel.parcel_id !== selectedParcelId));
            setShowDeleteModal(false);
            setSelectedParcelId(null);
            setSelectedTrackingNo(null);

            // Show success notification
            addNotification('success', 'Parcel Deleted', `Parcel ${selectedTrackingNo} has been successfully deleted.`);
        } catch (error) {
            console.error('Failed to delete parcel:', error);

            // Show error notification
            addNotification('error', 'Delete Failed', `Failed to delete parcel ${selectedTrackingNo}. Please try again.`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedParcelId(null);
        setSelectedTrackingNo(null);
    };

    // Reminder sending state (track per-parcel sending)
    const [sendingReminders, setSendingReminders] = useState<Set<number>>(new Set());

    // Send reminder for a single parcel
    const sendReminder = async (parcelId: number) => {
        // optimistic UI - mark as sending
        setSendingReminders((prev) => new Set(prev).add(parcelId));
        try {
            // Read CSRF token from meta tag, fallback to XSRF-TOKEN cookie (decoded)
            const csrfToken = (() => {
                const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                if (meta && meta.getAttribute('content')) return meta.getAttribute('content')!;
                const cookies = document.cookie ? document.cookie.split(';') : [];
                for (const c of cookies) {
                    const [k, v] = c.trim().split('=');
                    if (k === 'XSRF-TOKEN') return decodeURIComponent(v || '');
                }
                return '';
            })();

            const response = await fetch('/staff/parcels/remind', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    // Send both header names for maximum compatibility
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ parcel_ids: [parcelId] }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const err = await response.json();
                    if (err?.message) errorMessage = err.message;
                } catch {}
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data?.success) {
                const queued = data.queued ?? 0;
                const skipped_no_contact = data.skipped_no_contact ?? 0;
                const skipped_recently = data.skipped_recently ?? 0;
                let message = `Queued: ${queued}`;
                if (skipped_no_contact) message += ` • Skipped (no contact): ${skipped_no_contact}`;
                if (skipped_recently) message += ` • Skipped (already reminded today): ${skipped_recently}`;
                addNotification('success', 'Reminder Processed', message);
            } else {
                addNotification('error', 'Reminder Failed', data.message || 'Failed to queue reminder');
            }
        } catch (error: any) {
            console.error('Failed to send reminder:', error);
            addNotification('error', 'Error', error?.message || 'Failed to send reminder');
        } finally {
            // remove sending flag
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

    const todaysCollections = collectionsForSelectedDate;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parcel" />

            {/* Notification Container */}
            <div className="fixed right-4 bottom-4 z-50 space-y-3">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`max-w-96 min-w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out ${
                            notification.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                                : 'border-red-200 bg-red-50/95 text-red-800'
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
                                onClick={() => removeNotification(notification.id)}
                                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Calendar Modal */}
                        {calendarOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                                <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Collections for date</h3>
                                        <button onClick={() => setCalendarOpen(false)} className="text-sm text-gray-500">
                                            Close
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4">
                                        <label className="text-sm text-gray-600">Select date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="rounded-md border px-3 py-2"
                                        />
                                        <div className="ml-auto text-sm text-gray-600">Found: {collectionsForSelectedDate.length}</div>
                                    </div>
                                    <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
                                        {collectionsForSelectedDate.length === 0 ? (
                                            <div className="text-sm text-gray-500">No parcels scheduled on this date.</div>
                                        ) : (
                                            collectionsForSelectedDate.map((p) => (
                                                <div key={p.parcel_id} className="rounded-xl border border-gray-100 p-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 font-semibold text-purple-600">
                                                            <span className="text-sm">{p.time_slot ? p.time_slot.split(' - ')[0] : ''}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {p.student_user?.name || p.recipient_name || 'Unknown Student'}
                                                                </p>
                                                                {(p.student_user?.matric || p.recipient_matric) && (
                                                                    <p className="text-xs text-gray-500">
                                                                        ({p.student_user?.matric || p.recipient_matric})
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="mt-1 text-sm text-gray-700">
                                                                Tracking: <span className="font-mono">{p.tracking_no}</span>
                                                            </div>
                                                            <div className="mt-1 text-sm text-gray-700">
                                                                Location: {p.location || 'N/A'} • Size: {p.size || 'N/A'}
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                Timeslot: {p.time_slot || formatScheduledDate(p.schedule)}
                                                            </div>
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                Status:{' '}
                                                                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                                                    {p.parcel_status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Parcel Details Modal */}
            {showDetailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-card">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-border">
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

                        {/* Modal Content */}
                        <div className="max-h-[65vh] overflow-y-auto p-6">
                            {parcelDetails ? (
                                <div className="space-y-6">
                                    {/* Top Section */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">
                                                Tracking Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Tracking Number
                                                    </label>
                                                    <p className="font-['Consolas'] text-lg font-bold text-gray-900 dark:text-card-foreground">
                                                        {parcelDetails.tracking_no}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Status
                                                    </label>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(parcelDetails.parcel_status)}`}
                                                    >
                                                        {parcelDetails.parcel_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">
                                                Recipient Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Student ID
                                                    </label>
                                                    <p className="text-gray-900 dark:text-card-foreground">
                                                        {parcelDetails.student_user?.matric || parcelDetails.student_id}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">Name</label>
                                                    <p className="text-gray-900 dark:text-card-foreground">
                                                        {parcelDetails.student_user?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">Email</label>
                                                    <p className="text-gray-900 dark:text-card-foreground">
                                                        {parcelDetails.student_user?.email || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sender Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">Sender Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Sender</label>
                                                <p className="text-gray-900 dark:text-card-foreground">{parcelDetails.sender || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parcel Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Parcel Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Dimensions</label>
                                                <p className="text-gray-900">{parcelDetails.dimensions || parcelDetails.size || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Fee</label>
                                                <p className="text-gray-900">RM{parcelDetails.fee || '1.00'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Additional Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Location</label>
                                                <p className="text-gray-900">{parcelDetails.location || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Days in Storage</label>
                                                <p className="text-gray-900">{parcelDetails.days || 0} days</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scheduled Pickup Information */}
                                    {(parcelDetails.parcel_status?.toLowerCase() === 'ready for collection' ||
                                        parcelDetails.parcel_status?.toLowerCase() === 'ready to collect') &&
                                        (parcelDetails.schedule || parcelDetails.time_slot) && (
                                            <div>
                                                <h3 className="mb-3 text-lg font-semibold text-gray-900">Scheduled </h3>
                                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-700">Scheduled Date</label>
                                                            <p className="font-medium text-purple-900">
                                                                {formatScheduledDate(parcelDetails.schedule) || 'Not set'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-700">Time Slot</label>
                                                            <p className="font-medium text-purple-900">{parcelDetails.time_slot || 'Not set'}</p>
                                                        </div>
                                                    </div>
                                                    {formatScheduledDate(parcelDetails.schedule) && parcelDetails.time_slot && (
                                                        <div className="mt-3 border-t border-purple-200 pt-3">
                                                            <label className="block text-sm font-medium text-purple-700">Full Schedule</label>
                                                            <p className="font-semibold text-purple-900">
                                                                {formatScheduledDate(parcelDetails.schedule)} • {parcelDetails.time_slot}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Timestamps */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Timestamps</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Created At</label>
                                                <p className="text-gray-900">{formatDateTime(parcelDetails.created_at)}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                                                <p className="text-gray-900">{formatDateTime(parcelDetails.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">Failed to load parcel details.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {parcelDetails && (
                            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
                                <button
                                    onClick={handleCloseDetailsModal}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                {parcelDetails.parcel_status?.toLowerCase() === 'ready for collection' && (
                                    <button
                                        onClick={() => {
                                            handleMarkAsCollected(parcelDetails.parcel_id);
                                            handleCloseDetailsModal();
                                        }}
                                        disabled={collectingParcels.has(parcelDetails.parcel_id)}
                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-150 ${
                                            collectingParcels.has(parcelDetails.parcel_id)
                                                ? 'cursor-not-allowed bg-green-500 opacity-80'
                                                : 'bg-green-600 hover:scale-105 hover:bg-green-700 active:scale-95'
                                        }`}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Mark as Collected</span>
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
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-border">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Scan Parcel QR Code</h2>
                                <p className="mt-1 text-sm text-gray-600">Point your camera at a parcel QR to find it instantly</p>
                            </div>
                            <button
                                onClick={closeScanModal}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div id={scanContainerId} className="w-full" />
                            {availableCameras.length > 1 && (
                                <div className="mt-3 flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Camera:</label>
                                    <select
                                        value={selectedCameraId ?? ''}
                                        onChange={(e) => setSelectedCameraId(e.target.value)}
                                        className="rounded border border-gray-300 px-2 py-1 text-xs"
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
                                <p className="text-xs text-gray-500">Ensure camera permission is granted.</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            // try re-init by closing and re-opening scanner
                                            if (scannerRef.current) {
                                                await scannerRef.current.clear().catch(() => {});
                                                scannerRef.current = null;
                                            }
                                            if (html5Ref.current) {
                                                try {
                                                    await html5Ref.current.stop();
                                                } catch {}
                                                try {
                                                    await html5Ref.current.clear();
                                                } catch {}
                                                html5Ref.current = null;
                                            }
                                            setTimeout(() => setShowScanModal((v) => v), 0);
                                        } catch {}
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
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-card">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-border">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Edit Parcel</h2>
                                <p className="text-sm text-gray-600">Update parcel information</p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
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
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">
                                                Tracking Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Tracking Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.tracking_no}
                                                        onChange={(e) => handleEditFormChange('tracking_no', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={editForm.parcel_status}
                                                        onChange={(e) => handleEditFormChange('parcel_status', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                    >
                                                        <option value="Pending Payment">Pending Payment</option>
                                                        <option value="Ready for Collection">Ready for Collection</option>
                                                        <option value="Collected">Collected</option>
                                                        <option value="Unclaimed">Unclaimed</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">
                                                Recipient Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                                        Student ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.student_id}
                                                        onChange={(e) => handleEditFormChange('student_id', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">Name</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.recipient_name}
                                                        onChange={(e) => handleEditFormChange('recipient_name', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">Email</label>
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sender Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-card-foreground">Sender Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Sender</label>
                                                <input
                                                    type="text"
                                                    value={editForm.sender_name}
                                                    onChange={(e) => handleEditFormChange('sender_name', e.target.value)}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parcel Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Parcel Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Dimensions</label>
                                                <input
                                                    type="text"
                                                    value={editForm.dimensions}
                                                    onChange={(e) => handleEditFormChange('dimensions', e.target.value)}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Fee (RM)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.fee}
                                                    onChange={(e) => handleEditFormChange('fee', parseFloat(e.target.value))}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Additional Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Location</label>
                                                <input
                                                    type="text"
                                                    value={editingParcel.location || ''}
                                                    onChange={(e) => {
                                                        // Update the editingParcel directly for location
                                                        setEditingParcel((prev) => (prev ? { ...prev, location: e.target.value } : null));
                                                    }}
                                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                                        <button
                                            type="button"
                                            onClick={handleCloseEditModal}
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Parcel'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">Failed to load parcel for editing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>

                        <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete Parcel</h2>
                        <p className="mb-1 text-sm text-gray-600">
                            Are you sure you want to delete parcel <span className="font-medium text-red-600">{selectedTrackingNo}</span>?
                        </p>
                        <p className="mb-9 px-4 text-left text-xs text-gray-500">
                            This action cannot be undone and will permanently remove all parcel data and history.
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Parcel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background color matching the image */}
            <div className="min-h-screen bg-white p-6">
                {/* Top Stats Grid - Using actual database data */}
                <div className="mb-6 grid grid-cols-3 gap-6">
                    {/* Newly Arrived */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-pink-50 to-pink-200 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-pink-300 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Newly Arrived</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">{stats.newlyArrived}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-orange-200 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Pending Payment</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">{stats.pendingPayments}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Collection */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-purple-200 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Ready For Collection</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">{stats.readyForCollection}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row Stats - Using actual database data */}
                <div className="mb-6 grid grid-cols-3 gap-6">
                    {/* Total Collection */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-green-200 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-400">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Today Collection</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">{stats.todayCollection}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-yellow-200 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Total Revenue</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">RM{stats.totalRevenue}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Verified */}
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-indigo-200 opacity-20"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Payment Verified</p>
                                </div>
                                <p className="text-4xl font-bold text-gray-900">{stats.paymentVerified}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Sidebar */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Main Table Area - 3 columns */}
                    <div className="col-span-3">
                        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                            {/* Search Bar */}
                            <div className="border-b border-gray-100 p-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search parcels..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 text-gray-700 placeholder-gray-400 focus:ring-3 focus:ring-pink-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                            <div className="flex gap-2 border-b border-gray-100 p-6">
                                {(['All Parcels', 'Pending Payment', 'Ready For Collection', 'Collected', 'Unclaimed'] as TabType[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{ boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.25)' }}
                                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${getTabStyles(tab)}`}
                                    >
                                        {tab} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${getBadgeStyles(tab)}`}>{counts[tab]}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Table Content */}
                            <div className="space-y-6 p-6">
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
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                                            {searchTerm ? `No parcels found matching "${searchTerm}"` : `No parcels in ${activeTab.toLowerCase()}`}
                                        </h3>
                                        <p className="text-gray-500">Try adjusting your search or filters</p>
                                    </div>
                                ) : (
                                    filteredParcels.map((parcel) => (
                                        <div
                                            key={parcel.parcel_id}
                                            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-xl"
                                        >
                                            <div className="flex items-start justify-between">
                                                {/* Left side - Parcel info */}
                                                <div className="flex flex-1 items-start gap-6">
                                                    {/* Parcel icon */}
                                                    <div className="relative">
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-pink-300 shadow-lg">
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
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="font-['Consolas'] text-xl font-bold text-gray-900">
                                                                {parcel.parcel_code || 'N/A'}
                                                            </h3>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(parcel.parcel_status)}`}
                                                            >
                                                                {parcel.parcel_status}
                                                            </span>
                                                        </div>

                                                        {/* Collection code (display if present) */}
                                                        {parcel.collection_code && (
                                                            <div className="mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    Collection Code:{' '}
                                                                    <span className="font-['Consolas'] font-medium text-gray-900">
                                                                        {parcel.collection_code}
                                                                    </span>
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
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {parcel.student_user?.name || parcel.recipient_name || 'N/A'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {parcel.student_user?.matric || parcel.recipient_matric || 'No Matric ID'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Compact Two-Line Layout */}
                                                        <div className="space-y-5">
                                                            {/* First line - Location and Days */}
                                                            <div className="flex items-center gap-6 text-sm text-gray-600">
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
                                                                        <span className="font-medium">Location:</span> {parcel.location || 'N/A'}
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
                                                                        <span className="font-medium">Days:</span> {parcel.days || 0} days
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Scheduled pickup information for Ready For Collection parcels */}
                                                            {parcel.parcel_status?.toLowerCase() === 'ready for collection' &&
                                                                (parcel.schedule || parcel.time_slot) && (
                                                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-3 px-4 shadow-sm transition-colors">
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
                                                                            <span className="text-sm font-semibold text-purple-900">Scheduled</span>
                                                                            <span className="text-xs text-purple-700">
                                                                                {formatScheduledDate(parcel.schedule) && parcel.time_slot
                                                                                    ? `${formatScheduledDate(parcel.schedule)} • ${parcel.time_slot}`
                                                                                    : parcel.time_slot ||
                                                                                      formatScheduledDate(parcel.schedule) ||
                                                                                      'No schedule set'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Second line - All staff and timestamp info in one line */}
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
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
                                                                        Created by:{' '}
                                                                        <span className="font-medium text-gray-700">
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
                                                                        Last edited by:{' '}
                                                                        <span className="font-medium text-gray-700">
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
                                                                    <span>Added: {formatDateTime(parcel.created_at)}</span>
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
                                                                        <span>Updated: {formatDateTime(parcel.updated_at)}</span>
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
                                                            disabled={sendingReminders.has(parcel.parcel_id)}
                                                            className={`rounded-2xl p-3 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-yellow-50 hover:text-yellow-400 hover:shadow-lg ${
                                                                sendingReminders.has(parcel.parcel_id) ? 'cursor-wait opacity-60' : ''
                                                            }`}
                                                        >
                                                            {sendingReminders.has(parcel.parcel_id) ? (
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                                            ) : (
                                                                <BellRing className="h-5 w-5" />
                                                            )}
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
                                                    {parcel.parcel_status?.toLowerCase() == 'ready for collection' && (
                                                        <button
                                                            onClick={() => handleMarkAsCollected(parcel.parcel_id)}
                                                            disabled={collectingParcels.has(parcel.parcel_id)}
                                                            className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-150 ${
                                                                collectingParcels.has(parcel.parcel_id)
                                                                    ? 'cursor-not-allowed bg-green-500 opacity-80'
                                                                    : 'bg-green-600 hover:scale-105 hover:bg-green-700 hover:shadow-xl active:scale-95'
                                                            }`}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>Mark as Collected</span>
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
                        {/* Quick Actions */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#f2a6a6,_#f4d88e,_#a4d4ae,_#80c7d9,_#a39ddb)]">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                            </div>
                            <div className="space-y-4">
                                <Link
                                    href="/staff/add-parcel"
                                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-pink-200 hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-pink-500 transition-all group-hover:scale-110">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-900">Register New Parcel</span>
                                        <p className="text-xs text-gray-500">Add a new parcel to the system</p>
                                    </div>
                                    <span className="ml-auto text-gray-400 transition-colors group-hover:text-pink-500">→</span>
                                </Link>

                                <button
                                    onClick={openScanModal}
                                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-orange-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br bg-[linear-gradient(135deg,#f5d0c8,#f5f2f9,#d3b9a6,#fbe5cf,#d4dcfa)] transition-all group-hover:scale-110">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-900">Scan QR Code</span>
                                        <p className="text-xs text-gray-500">Quick parcel identification</p>
                                    </div>
                                    <span className="ml-auto text-gray-400 transition-colors group-hover:text-orange-500">→</span>
                                </button>
                            </div>
                        </div>

                        {/* Today's Collections */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#e7a6b2,_#f1bca1,_#d7c8a7,_#b4d6c3,_#c8b5e6)]">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 006 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <h3 className="text-xl font-bold text-gray-900">{formatScheduledDate(selectedDate)} Collection</h3>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                            {todaysCollections.length}
                                        </span>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="ml-4 rounded-md border px-2 py-1 text-sm"
                                            aria-label="Select date"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {todaysCollections.length === 0 ? (
                                    <div className="rounded-xl p-4 text-sm text-gray-500">No collections scheduled for today.</div>
                                ) : (
                                    todaysCollections.map((p) => (
                                        <div key={p.parcel_id} className="rounded-xl border border-gray-100 p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 font-semibold text-purple-600">
                                                    <span className="text-sm">{p.time_slot ? p.time_slot.split(' - ')[0] : ''}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {p.student_user?.name || p.recipient_name || 'Unknown Student'}
                                                            </p>
                                                            {(p.student_user?.matric || p.recipient_matric) && (
                                                                <p className="text-xs text-gray-500">
                                                                    ({p.student_user?.matric || p.recipient_matric})
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-700">
                                                            Tracking: <span className="font-mono">{p.tracking_no}</span>
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Timeslot: {p.time_slot || formatScheduledDate(p.schedule)}
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
