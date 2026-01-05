import QRCodeModal from '@/components/qr-code-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, Calendar, CalendarDays, CheckCircle, ChevronRight, Info, MapPin, Package, PackageOpen, Sparkles, Clock, Upload, X, XCircle, TrendingUp, IdCard, WalletCards, CircleCheck, AlarmClock } from 'lucide-react';
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
    payment_rejected?: boolean;
    rejection_details?: {
        reason: string | null;
        date: string;
    } | null;
    latest_payment?: {
        proof_url: string;
        submitted_at: string;
    } | null;
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
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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

    const profilePhotoUrl = user?.profile_pic ? `/storage/${user.profile_pic}` : undefined;

    return (
        <div className="mb-8 rounded-[3.5rem] bg-white p-8 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden transition-all hover:shadow-[0_20px_70px_rgba(0,0,0,0.05)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* background blurs for atmosphere */}
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-100/40 blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-rose-100/30 blur-[80px]"></div>

            <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                {/* User Info Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left flex-1">
                    <div className="relative group">
                        {/* Multi-layered glow */}
                        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#9b6dff] via-[#ff6ac1] to-[#6ae1ff] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700"></div>
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#9b6dff] via-[#ff6ac1] to-[#6ae1ff] opacity-40 blur-md"></div>

                        <Avatar className="relative h-32 w-32 border-[6px] border-white shadow-2xl ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-105">
                            <AvatarImage src={profilePhotoUrl} alt={user?.name} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-black">
                                {user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        {/* Status ring */}
                        <div className="absolute bottom-2 right-2 h-7 w-7 rounded-full border-[4px] border-white bg-emerald-400 shadow-xl flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">


                        <h1 className="text-4xl font-black tracking-tight text-slate-800 ">
                            {getCurrentGreeting()},<br />
                            <span className="relative inline-block pb-1">
                                <span className="absolute bottom-0 left-0 w-full h-3 bg-indigo-100/60 -rotate-1 -z-10"></span>
                                <span className="bg-gradient-to-r from-[#7042FF] via-[#9B6DFF] to-[#D46DFF] bg-clip-text text-transparent">
                                    {getDisplayName().toUpperCase()}
                                </span>
                            </span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start pt-2">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 text-[11px] font-black text-indigo-500 uppercase tracking-widest">
                                <IdCard className="h-3.5 w-3.5" />
                                Matric ID: {user?.matric || 'AS1111'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Creative Card Stack Section (Referring to Photo 2 Style) */}
                <div className="relative h-[240px] w-full xl:w-[500px] flex items-center justify-center perspective-[1500px]">
                    {/* Shadow Layer for Depth */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[180px] bg-slate-900/10 blur-[80px] rounded-full -rotate-12 translate-y-12 shrink-0 pointer-events-none"></div>

                    {/* Back Card (Active Parcels Decoration) */}
                    <div className="absolute w-[280px] h-[160px] rounded-[3rem] bg-white border border-slate-100 shadow-lg rotate-[-12deg] -translate-x-12 translate-y-4 transition-transform duration-700 hover:rotate-[-8deg] pointer-events-none">
                        <div className="h-full w-full rounded-[2.8rem] bg-gradient-to-br from-indigo-50 to-transparent p-6 flex flex-col justify-end opacity-40">
                            <div className="h-8 w-24 bg-slate-100 rounded-full mb-2"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded-full"></div>
                        </div>
                    </div>

                    {/* Middle Card (Active Parcels Information) */}
                    <div className="absolute w-[300px] h-[160px] rounded-[3rem] bg-gradient-to-tr from-[#9b6dff]/10 via-[#ff6ac1]/10 to-[#6ae1ff]/10 border border-white shadow-xl rotate-[6deg] translate-x-10 -translate-y-2 transition-transform duration-700 hover:rotate-[3deg]">
                        <div className="h-full w-full rounded-[2.8rem] bg-white/40 backdrop-blur-md p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 border border-rose-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Active</span>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-2xl">
                                    <Package className="h-5 w-5 text-rose-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-slate-800 tracking-tighter">{activeParcelCount}</span>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">PARCELS IN HUB</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Main Card (Current Time / Dashboard Control - Inspired by Obsidian Glass) */}
                    <div className="absolute w-[320px] h-[180px] rounded-[3rem] p-[1.5px] bg-gradient-to-br from-slate-200 via-indigo-500 to-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 cursor-pointer -rotate-1">
                        <div className="relative h-full w-full rounded-[2.9rem] bg-slate-950 overflow-hidden p-6 flex flex-col justify-between">
                            {/* Sophisticated Blurs */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-[60px] -translate-x-10 -translate-y-10 rounded-full"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-500/10 blur-[40px] rounded-full"></div>

                            <div className="relative z-10 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-indigo-400" />
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner group/sparkle">
                                    <Sparkles className="h-5 w-5 text-indigo-400 group-hover/sparkle:text-indigo-300 transition-colors" />
                                </div>
                            </div>

                            <div className="relative z-10 flex items-end justify-between">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-6xl font-black text-white tracking-tighter drop-shadow-sm">
                                        {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-3xl font-black text-indigo-500 tracking-tighter ml-1 drop-shadow-sm">
                                        :{currentTime.getSeconds().toString().padStart(2, '0')}
                                    </span>
                                    <div className="text-[10px] font-black text-slate-500 uppercase flex flex-col leading-none pb-2 ml-2 tracking-widest">
                                        <span>{currentTime.getHours() >= 12 ? 'PM' : 'AM'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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

    // Update parcel list when prop changes
    useEffect(() => {
        setParcelList(parcels);
    }, [parcels]);

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
        console.log('Notification clicked - Full object:', notification);
        console.log('Notification clicked - ID:', notification.id);

        // Close dropdown after clicking
        setShowNotificationDropdown(false);

        // Keep payment_rejected visible until resubmission; others can be dismissed immediately
        const isStickyRejection = notification.type === 'payment_rejected';
        if (!isStickyRejection) {
            // Add to dismissed list so it won't come back even if props refresh
            setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));

            // Optimistically remove from UI immediately for better UX
            setNotificationList((prev) => prev.filter((n) => n.id !== notification.id));
        }

        // Mark as read on the server unless it is sticky (payment_rejected)
        if (notification.id && !isStickyRejection) {
            try {
                console.log('Attempting to mark notification as read:', notification.id);
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

                if (response.status === 419) {
                    window.location.reload();
                    return;
                }

                if (!response.ok) {
                    return;
                }

                await response.json();
            } catch (e) {
                console.error('Exception marking notification as read:', e);
            }
        }

        // Handle different notification types
        const title = notification.title?.toLowerCase() || '';
        const message = notification.message?.toLowerCase() || '';

        // Check if it's a "Parcel Collected" notification - just mark as read and don't navigate
        if (title.includes('parcel collected') || message.includes('successfully collected')) {
            return;
        }

        // For other notifications, navigate as usual
        if (notification.type === 'payment_rejected' && notification.parcel_id) {
            // Navigate but keep the notification visible (will be cleared after resubmission by backend)
            router.visit(`/student/payment/submit/${notification.parcel_id}`);
        } else if (notification.parcel_id) {
            router.visit(`/student/parcel/${notification.parcel_id}`);
        } else if (notification.type === 'payment_verified') {
            router.visit('/student/payment');
        }
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
    const proofInputRef = useRef<HTMLInputElement>(null);

    const currentPayParcel = parcels.find((p) => p.parcel_id === payParcelId);

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
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            let response = await fetch(`/staff/parcel/${editingParcel.parcel_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
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

            // Handle CSRF token expiration
            if (response.status === 419) {
                try {
                    // Refresh CSRF token
                    const refreshRes = await fetch(window.location.href);
                    const html = await refreshRes.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                    if (newToken) {
                        // Update meta tag for future requests
                        document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', newToken);

                        // Retry request with new token
                        response = await fetch(`/staff/parcel/${editingParcel.parcel_id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': newToken,
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
                    }
                } catch (refreshError) {
                    console.error('Session refresh failed:', refreshError);
                    addToastNotification('error', t('error'), 'Session expired. Please refresh the page and try again.');
                    setIsUpdating(false);
                    return;
                }
            }

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
                const errorText = await response.text();
                console.error('Update parcel failed:', response.status, errorText);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !payParcelId) return;

        setIsUploadingProof(true);
        const formData = new FormData();
        formData.append('proof', file);

        router.post(`/student/payment/submit/${payParcelId}`, formData, {
            onSuccess: () => {
                setShowPayModal(false);
                addToastNotification('success', t('success'), t('paymentProofUploaded') || 'Payment proof uploaded successfully!');
                // Reset file input
                if (proofInputRef.current) {
                    proofInputRef.current.value = '';
                }
            },
            onError: (errors) => {
                console.error('Upload error:', errors);
                const firstError = Object.values(errors)[0];
                addToastNotification('error', t('error'), firstError || t('failedToUploadProof') || 'Failed to upload payment proof. Please try again.');
            },
            onFinish: () => setIsUploadingProof(false),
            preserveState: true,
            preserveScroll: true,
        });
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
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'rejected':
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400';
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
            case 'rejected':
                return t('rejected');
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
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
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
            case 'rejected':
                return 'bg-gradient-to-r from-red-500 to-rose-600';
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
        if (showDetailsModal || showDeleteModal || showQRModal || showLocations) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showDetailsModal, showDeleteModal, showQRModal, showLocations]);

    const headerAction = (
        <div className="relative">
            <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="notification-bell relative rounded-full border border-border bg-background p-2.5 shadow-sm hover:bg-accent"
            >
                <Bell className="h-5 w-5 text-foreground" />
                {visibleNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {visibleNotifications.length}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
                <div className="notification-dropdown absolute top-12 right-0 z-50 w-96 rounded-lg border bg-popover shadow-lg">
                    <div className="border-b border-border p-4">
                        <h3 className="text-lg font-semibold text-popover-foreground">{t('notifications')}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {visibleNotifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">{t('noNotifications')}</div>
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
                                            {notification.reason && (
                                                <div className="mt-3 group overflow-hidden rounded-xl border border-red-100 bg-red-50/30 p-3 dark:border-red-900/30 dark:bg-red-900/10 transition-all hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-red-800 dark:text-red-300">{t('staffFeedback')}</span>
                                                    </div>
                                                    <p className="pl-3.5 text-xs italic leading-relaxed text-red-700 dark:text-red-400">
                                                        "{notification.reason}"
                                                    </p>
                                                </div>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Date(notification.created_at).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
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
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerAction={headerAction}>
            <Head title="My Parcels">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Inter:wght@100..900&display=swap" rel="stylesheet" />
            </Head>

            <div className="space-y-6 p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="fixed top-8 left-1/2 z-[100] -translate-x-1/2 space-y-3">
                    {toastNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`flex min-w-[320px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success'
                                ? 'bg-[#f0fdf4] text-[#065f46]'
                                : 'bg-[#fef2f2] text-[#991b1b]'
                                }`}
                        >
                            {notification.type === 'success' ? (
                                <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                            )}
                            <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                                {notification.message}
                            </span>
                        </div>
                    ))}
                </div>

                <div id="welcome-header">
                    <WelcomeHeader user={currentUser} activeParcelCount={activeParcelCount} t={t} />
                </div>

                {/* QR Code Modal */}
                <QRCodeModal isOpen={showQRModal} onClose={handleCloseQRModal} qrCodeData={qrCodeData} isLoading={loadingQRParcels.size > 0} />

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

                <div className="bg-slate-50/50 rounded-[3rem] p-4 sm:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {/* Stats Grid matching screenshot */}
                    <div id="stats-tiles" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                        {/* Top Group (8 cols) */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* My Parcels Card */}
                            <div className="h-32 rounded-2xl bg-[#f5f3ff] border border-[#ddd6fe] p-6 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <span className="text-sm font-semibold text-slate-600">{t('myParcels')}</span>
                                    <span className="text-4xl font-bold text-[#7c3aed]">{tileCounts.myParcels}</span>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#ede9fe]/80 flex items-center justify-center text-[#7c3aed]">
                                    <Package className="w-8 h-8" strokeWidth={2.4} />
                                </div>
                            </div>

                            {/* Pending Payment Card */}
                            <div className="h-32 rounded-2xl bg-[#fffdfa] border border-[#fef3c7] p-6 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <span className="text-sm font-semibold text-slate-600">{t('pendingPayment')}</span>
                                    <span className="text-4xl font-bold text-[#b45309]">{tileCounts.pendingPayment}</span>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#fef3c7]/80 flex items-center justify-center text-[#b45309]">
                                    <Clock className="w-8 h-8" strokeWidth={2.4} />
                                </div>
                            </div>

                            {/* Approved Card */}
                            <div className="h-32 rounded-2xl bg-[#fffaf5] border border-[#fed7aa] p-6 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <span className="text-sm font-semibold text-slate-600">{t('approved')}</span>
                                    <span className="text-4xl font-bold text-[#ea580c]">{tileCounts.approved}</span>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#ffedd5]/80 flex items-center justify-center text-[#ea580c]">
                                    <WalletCards className="w-8 h-8" strokeWidth={2.4} />
                                </div>
                            </div>

                            {/* Ready for Collection Card */}
                            <div className="h-32 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] p-6 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <span className="text-sm font-semibold text-slate-600">{t('readyForCollection')}</span>
                                    <span className="text-4xl font-bold text-[#16a34a]">{tileCounts.readyForCollection}</span>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#dcfce7]/80 flex items-center justify-center text-[#16a34a]">
                                    <PackageOpen className="w-8 h-8" strokeWidth={2.4} />
                                </div>
                            </div>

                            {/* Collected Card */}
                            <div className="h-32 rounded-2xl bg-[#f0f9ff] border border-[#e0f2fe] p-6 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <span className="text-sm font-semibold text-slate-600">{t('collected')}</span>
                                    <span className="text-4xl font-bold text-[#2563eb]">{tileCounts.collected}</span>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#dbeafe]/80 flex items-center justify-center text-[#2563eb]">
                                    <CircleCheck className="w-8 h-8" strokeWidth={2.4} />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Group (4 cols) */}
                        <div id="quick-actions" className="lg:col-span-4 h-full rounded-2xl bg-white border border-slate-100 p-8 shadow-sm transition-all" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <h3 className="text-[14px] font-bold text-slate-800 mb-6">{t('quickActions')}</h3>

                            <button
                                onClick={() => {
                                    setSelectedHub(hubs[0]);
                                    setShowLocations(true);
                                }}
                                className="flex w-full items-center justify-start gap-3 rounded-xl bg-pink-50 px-5 py-3 text-sm font-bold text-pink-700 hover:bg-pink-100 transition-colors"
                            >
                                <div className="p-1 rounded-md bg-white/50">
                                    <MapPin className="w-4 h-4 text-pink-500" />
                                </div>
                                <span>{t('locations')}</span>
                            </button>


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
                                            className={`rounded-lg border p-4 transition-colors ${selectedHub?.name === hub.name
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
                                                            className={`font-semibold ${open
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

                {/* Parcel cards grid */}
                {displayParcels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500 dark:border-border dark:bg-card dark:text-muted-foreground">
                        {t('noParcelsFound')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
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
                                        <AlarmClock className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                                        <span>
                                            {t('arrived')}: {formatDate(parcel.created_at)}
                                        </span>
                                    </div>

                                    <div className="mb-4 flex items-center gap-2 text-sm">
                                        <WalletCards className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                                        <span className="text-gray-600 dark:text-muted-foreground">{t('payment')}:</span>
                                        {parcel.payment_verified || isApproved || isReady ? (
                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                {t('verified')}
                                            </span>
                                        ) : parcel.payment_rejected ? (
                                            <span className="inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                                                {t('rejected')}
                                            </span>
                                        ) : parcel.days >= 3 ? (
                                            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                                                {t('overdue')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
                                                {t('pending')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isPendingPayment && (!parcel.latest_payment || parcel.payment_rejected) && (
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

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && selectedParcelId !== null && (
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
                                                // Get the parcel to retrieve tracking number before deletion
                                                const parcelToDelete = parcelList.find((p) => p.parcel_id === selectedParcelId);
                                                const trackingNo = parcelToDelete?.tracking_no || selectedParcelCode || 'N/A';

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

                                                addToastNotification('success', t('parcelDeleted'), `The parcel ${trackingNo} has been successfully deleted`);
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
                )
            }

            {/* Payment Proof Modal - Exact Match with Reference Photo */}
            {showPayModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-[1.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t('paymentQRScanner')}</h3>
                                <p className="mt-0.5 text-xs text-gray-500">{t('scanPaymentQRDescription')}</p>
                            </div>
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 pt-8">
                            {/* QR Container with Dashed Border */}
                            <div className="relative mb-6 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 flex items-center justify-center group">
                                <img
                                    src="/images/qrpayment.png"
                                    alt="Payment QR"
                                    className="h-44 w-44 object-contain"
                                />
                            </div>

                            <input
                                type="file"
                                ref={proofInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />

                            {/* Action Button */}
                            <button
                                onClick={() => proofInputRef.current?.click()}
                                disabled={isUploadingProof}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 disabled:opacity-50"
                            >
                                {isUploadingProof ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                ) : (
                                    <Upload className="h-4 w-4 text-gray-400" />
                                )}
                                <span>{isUploadingProof ? t('uploading') : t('uploadPaymentProof')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout >
    );
}
