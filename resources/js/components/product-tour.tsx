import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    ChevronLeft,
    X,
    Sparkles,
    Package,
    CreditCard,
    Users,
    Megaphone,
    MessageCircleQuestion,
    Clock,
    LayoutGrid,
    HelpCircle,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface Step {
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
    anchorId?: string;
}

const studentSteps: Step[] = [
    {
        title: 'Welcome to InstaStation!',
        description: 'Your premium parcel management companion. Let\'s take a quick look at how to get the most out of your dashboard.',
        icon: Sparkles,
    },
    {
        title: 'Operations Dashboard',
        description: 'Your central command center. Click the brand logo anytime to return to your main parcel overview.',
        anchorId: 'nav-dashboard',
    },
    {
        title: 'Dashboard Overview',
        description: 'Stay updated with personalized greetings and your active parcel count here.',
        anchorId: 'welcome-header',
    },
    {
        title: 'Live Statistics',
        description: 'Get a snapshot of your parcel status – from total parcels to those ready for collection.',
        anchorId: 'stats-tiles',
    },
    {
        title: 'Quick Actions',
        description: 'Access important locations and quick services from this section.',
        anchorId: 'quick-actions',
    },
    {
        title: 'Your Deliveries',
        description: 'Access and manage your complete list of active parcels and their detailed status here.',
        anchorId: 'nav-my-parcels',
    },
    {
        title: 'Seamless Payments',
        description: 'Managing fees is easy. Upload your payment proofs and track verification status in real-time.',
        anchorId: 'nav-payment',
    },
    {
        title: 'Collection History',
        description: 'Look back at your past collections anytime for reference.',
        anchorId: 'nav-history',
        icon: Clock,
    },
    {
        title: 'Help & FAQ',
        description: 'Got questions? Find instant answers to common queries or learn more about our processes.',
        anchorId: 'nav-faqs',
    },
    {
        title: 'Profile & Settings',
        description: 'Customize your experience and manage your account settings from your personal profile menu.',
        anchorId: 'nav-user',
    },
];

const adminStaffSteps: Step[] = [
    {
        title: 'Staff Command Center',
        description: 'Welcome to your administrative hub. We\'ll show you how to efficiently manage the entire parcel lifecycle.',
        icon: Sparkles,
    },
    {
        title: 'Operations Dashboard',
        description: 'Your central command center. Return here anytime for an overview of daily activities and metrics.',
        anchorId: 'nav-dashboard',
    },
    {
        title: 'Operations Overview',
        description: 'Get an instant status check on total parcels, daily arrivals, and unclaimed items in the notification tiles.',
        anchorId: 'overview-stats',
    },
    {
        title: 'User Management',
        description: 'Access the complete student directory, monitor their activity, and manage their account status.',
        anchorId: 'nav-users',
    },
    {
        title: 'Global Broadcasts',
        description: 'Keep the community informed by publishing system-wide announcements and critical updates.',
        anchorId: 'nav-announcements',
    },
    {
        title: 'Resource Management',
        description: 'Manage the knowledge base and common queries to help students navigate our services better.',
        anchorId: 'nav-faqs',
    },
    {
        title: 'Staff Profile',
        description: 'Access your account settings and manage your staff profile from this personal menu.',
        anchorId: 'nav-user',
    },
];

const generalStaffSteps: Step[] = [
    {
        title: 'Staff Operations',
        description: 'Welcome to the operational hub. Let\'s guide you through managing parcels and payments.',
        icon: Sparkles,
    },
    {
        title: 'Operations Dashboard',
        description: 'Your central command center. Return here anytime for an overview of daily activities and metrics.',
        anchorId: 'nav-dashboard',
    },
    {
        title: 'Operations Overview',
        description: 'Get an instant status check on total parcels, daily arrivals, and unclaimed items.',
        anchorId: 'overview-stats',
    },
    {
        title: 'Parcel Operations',
        description: 'Register new shipments and manage existing ones. Our smart system links parcels to students automatically.',
        anchorId: 'nav-parcels',
    },
    {
        title: 'Financial Oversight',
        description: 'Review payment proofs and verify transactions. Move parcels forward in the collection pipeline.',
        anchorId: 'nav-payment',
    },
];

export default function ProductTour({ isOpen: forceOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user?.type;
    const department = (auth.user as any)?.department?.trim();

    // Determine the correct steps based on role and department
    const getSteps = () => {
        if (userRole !== 'staff') return studentSteps;

        if (department === 'Operations - Admin' || department === 'Admin') {
            return adminStaffSteps;
        }
        return generalStaffSteps;
    };

    const steps = getSteps();
    const isStudent = userRole !== 'staff';
    const roleColor = isStudent ? 'bg-emerald-500' : 'bg-pink-500';
    const roleColorLight = isStudent ? 'bg-emerald-50' : 'bg-pink-50';
    const roleTextColor = isStudent ? 'text-emerald-600' : 'text-pink-600';

    const [currentStep, setCurrentStep] = useState(-1); // -1 for Intro
    const [isFinishing, setIsFinishing] = useState(false);
    const [isOpen, setIsOpen] = useState(forceOpen);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; isCentered: boolean }>({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        isCentered: true
    });

    useEffect(() => {
        setIsOpen(forceOpen);
        if (forceOpen) setCurrentStep(-1);
    }, [forceOpen]);

    const updatePosition = useCallback(() => {
        if (!isOpen || currentStep === -1) {
            setCoords({ top: 0, left: 0, width: 0, height: 0, isCentered: true });
            return;
        }

        const anchorId = steps[currentStep]?.anchorId;
        if (anchorId) {
            const element = document.getElementById(anchorId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    isCentered: false
                });
                return;
            }
        }
        setCoords({ top: 0, left: 0, width: 0, height: 0, isCentered: true });
    }, [currentStep, isOpen, steps]);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [updatePosition]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextIndex = currentStep + 1;
            setCurrentStep(nextIndex);

            // 🎯 Smooth scroll to the next anchor
            setTimeout(() => {
                const anchorId = steps[nextIndex]?.anchorId;
                if (anchorId) {
                    const element = document.getElementById(anchorId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevIndex = currentStep - 1;
            setCurrentStep(prevIndex);

            // 🔙 Smooth scroll to the previous anchor
            setTimeout(() => {
                const anchorId = steps[prevIndex]?.anchorId;
                if (anchorId) {
                    const element = document.getElementById(anchorId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
        } else if (currentStep === 0) {
            setCurrentStep(-1);
        }
    };

    const handleFinish = () => {
        setIsFinishing(true);
        router.post('/user/complete-tour', {}, {
            onSuccess: () => {
                setIsOpen(false);
                onClose();
            },
            onFinish: () => {
                setIsFinishing(false);
                setIsOpen(false);
                onClose();
            },
        });
    };

    if (!isOpen) return null;

    const step = currentStep === -1 ? steps[0] : steps[currentStep];

    return (
        <div className="fixed inset-0 z-[110] overflow-hidden pointer-events-none font-sans">
            {/* Premium White Blurry Overlay with Dynamic Hole */}
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-md pointer-events-auto transition-all duration-500"
                style={{
                    clipPath: !coords.isCentered
                        ? `polygon(0% 0%, 0% 100%, ${coords.left - 8}px 100%, ${coords.left - 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px 100%, 100% 100%, 100% 0%)`
                        : 'none',
                }}
            />

            {/* Target Highlight Effect (Border Only) */}
            {!coords.isCentered && (
                <div
                    style={{
                        top: `${coords.top - 8}px`,
                        left: `${coords.left - 8}px`,
                        width: `${coords.width + 16}px`,
                        height: `${coords.height + 16}px`,
                    }}
                    className={cn(
                        "absolute z-[105] rounded-xl border-4 bg-transparent pointer-events-none transition-all duration-500 ease-in-out",
                        isStudent ? "border-emerald-400" : "border-pink-400"
                    )}
                />
            )}

            {/* Tour Modal Container */}
            <div
                className={cn(
                    "absolute z-[120] pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1.1)]",
                    coords.isCentered
                        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] sm:w-[500px]"
                        : "w-[calc(100vw-32px)] md:w-[400px]",
                    !coords.isCentered && (coords.top + coords.height + 24 > windowSize.height - 350) && "md:-translate-y-full"
                )}
                style={!coords.isCentered ? (
                    windowSize.width < 768
                        ? { bottom: '16px', left: '16px', right: '16px', top: 'auto', width: 'auto' } // Docked to bottom on mobile
                        : {
                            top: `${coords.top + coords.height + 24 > windowSize.height - 350 ? coords.top - 24 : coords.top + coords.height + 24}px`,
                            left: `${Math.max(24, Math.min(windowSize.width - 424, coords.left + coords.width / 2 - 200))}px`,
                        }
                ) : {}}
            >
                {currentStep === -1 ? (
                    /* Intro View */
                    <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-500 border border-white/20 relative overflow-hidden group">
                        {/* Background Decor */}
                        <div className={cn("absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-110", roleColor)} />

                        <div className="flex justify-center mb-6 sm:mb-10">
                            <div className={cn("w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white rotate-3 shadow-2xl transition-transform hover:rotate-6 duration-300", roleColor)}>
                                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12" />
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                            {step.title}
                        </h2>

                        <p className="text-slate-500 text-base sm:text-xl leading-relaxed mb-8 sm:mb-12 max-w-[95%] sm:max-w-[85%] mx-auto font-medium">
                            {step.description}
                        </p>

                        <div className="flex flex-col gap-4">
                            <Button
                                className={cn("h-14 sm:h-16 rounded-2xl text-white font-black text-lg sm:text-xl shadow-xl hover:opacity-90 transform active:scale-95 transition-all", roleColor)}
                                onClick={() => {
                                    setCurrentStep(0);
                                    setTimeout(() => {
                                        const anchorId = steps[0]?.anchorId;
                                        if (anchorId) {
                                            document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }, 100);
                                }}
                            >
                                Get Started
                                <ArrowRight className="w-6 h-6 ml-2" />
                            </Button>

                            <button
                                className="h-10 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors tracking-wide uppercase"
                                onClick={handleFinish}
                            >
                                Skip Tour
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Step View - Exact design like photo */
                    <div className="bg-white rounded-[1.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-300 relative border border-slate-50 overflow-hidden">
                        {/* Progress Bar top */}
                        <div className={cn("absolute top-0 left-0 h-1 transition-all duration-500", roleColor)} style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />

                        <button
                            onClick={handleFinish}
                            className="absolute right-4 top-4 p-2 text-slate-300 hover:text-slate-500 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-5 sm:p-8">
                            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-sm border", roleColorLight, roleTextColor, isStudent ? "border-emerald-100" : "border-pink-100")}>
                                    {currentStep + 1}
                                </div>
                                <div className="pt-1 sm:pt-1.5 flex-1">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                                        {step.title}
                                    </h3>
                                </div>
                            </div>

                            <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10 font-medium">
                                {step.description}
                            </p>

                            <div className="flex items-center justify-between">
                                {/* Back link like photo */}
                                {currentStep >= 0 ? (
                                    <button
                                        onClick={handleBack}
                                        className="text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors py-2 flex items-center group"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-0 group-hover:-translate-x-1 transition-transform" />
                                        Back
                                    </button>
                                ) : <div className="w-16" />}

                                {/* Centered Dots & Fraction Like Photo */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-1.5">
                                        {steps.map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-2 h-1 rounded-full transition-all duration-300",
                                                    i === currentStep ? cn("w-6", roleColor) : "bg-slate-200"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
                                        {currentStep + 1} of {steps.length}
                                    </span>
                                </div>

                                {/* Next Button like photo */}
                                <Button
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={isFinishing}
                                    className={cn("h-10 sm:h-11 px-6 sm:px-8 rounded-xl text-white font-black shadow-lg hover:opacity-90 hover:scale-105 transition-all text-sm", roleColor)}
                                >
                                    {isFinishing ? '...' : (currentStep === steps.length - 1 ? 'Finish' : 'Next')}
                                </Button>
                            </div>
                        </div>

                        {/* Speech Bubble Arrow */}
                        {!coords.isCentered && windowSize.width >= 768 && (
                            <div
                                className={cn(
                                    "absolute w-6 h-6 bg-white rotate-45 border-slate-50 shadow-[-5px_-5px_10px_rgba(0,0,0,0.02)]",
                                    coords.top + coords.height + 24 > windowSize.height - 350
                                        ? "bottom-[-12px] left-1/2 -translate-x-1/2 border-b border-r" // top pointing
                                        : "top-[-12px] left-1/2 -translate-x-1/2 border-t border-l" // bottom pointing
                                )}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
