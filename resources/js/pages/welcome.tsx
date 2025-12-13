import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Bell, Calendar, CreditCard, MapPin, Package, Sparkles, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type AnnouncementCard = {
    announcement_id: number;
    announcement_title: string;
    announcement_content: string;
    announcement_image?: string | null;
    announcement_type?: string | null;
    publish_date?: string | null;
    created_at?: string | null;
};

export default function Welcome() {
    const { auth, announcements = [] } = usePage<SharedData & { announcements?: AnnouncementCard[] }>().props as any;
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementCard | null>(null);
    const [visibleCount, setVisibleCount] = useState(4);
    const [currentWord, setCurrentWord] = useState(0);
    const words = ['Smart', 'Instant', 'Swift', 'Secure'];

    // Timeline State
    const [activeTimelineStep, setActiveTimelineStep] = useState(0);
    const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);

    // Spotlight Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSpotlightVisible(entry.isIntersecting);
            },
            { threshold: 0.2 } // Trigger when 20% visible
        );
        const section = document.getElementById('spotlight-section');
        if (section) observer.observe(section);
        return () => observer.disconnect();
    }, []);

    // Timeline Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const step = parseInt(entry.target.getAttribute('data-step') || '0');
                        setActiveTimelineStep(step);
                    }
                });
            },
            {
                root: null,
                rootMargin: '-25% 0px -25% 0px', // Active when element is in center 50% of viewport
                threshold: 0
            }
        );

        const steps = document.querySelectorAll('.timeline-step');
        steps.forEach((step) => observer.observe(step));

        // Also observe the section to reset or pin if needed, but for now steps are enough.
        // Cleanup
        return () => {
            steps.forEach((step) => observer.unobserve(step));
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Smooth scroll handler for footer links
    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[href^="#"]');

            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - 100;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, []);

    // Format date consistently
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;

            return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
        } catch {
            return '';
        }
    };

    // Always reflect the latest announcements first
    const announcementsSorted = [...announcements].sort((a, b) => {
        const ad = new Date(a.publish_date || a.created_at || 0).getTime();
        const bd = new Date(b.publish_date || b.created_at || 0).getTime();
        return bd - ad; // newest first
    });

    const displayedAnnouncements = announcementsSorted.slice(0, visibleCount);
    const featuredAnnouncement = displayedAnnouncements[0];
    const secondaryAnnouncements = displayedAnnouncements.slice(1);

    /**
     * Intersection Observer animation hook
     *
     * Strategy:
     *  - Find all elements that currently have the `.animate-in` class (your markup uses that a lot).
     *  - Immediately remove the class and add `.will-animate` (so they don't animate on page-load).
     *  - Observe them; when they intersect threshold -> re-add `.animate-in` and unobserve.
     *  - Respect prefers-reduced-motion: treat as "already visible" and add animations back immediately.
     *
     * This avoids changing your markup and keeps your tailwind/animation utilities intact.
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Select elements intended to animate on view
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('.animate-in'));

        if (nodes.length === 0) return;

        // Prevent page-load animations: mark them as pending
        nodes.forEach((el) => {
            el.classList.remove('animate-in');
            el.classList.add('will-animate');
        });

        // If user prefers reduced motion, just restore animations (no intersection)
        if (prefersReduced) {
            nodes.forEach((el) => {
                el.classList.remove('will-animate');
                el.classList.add('animate-in');
            });
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const target = entry.target as HTMLElement;
                    if (entry.isIntersecting) {
                        // small delay support: elements can include style animationDelay inline already
                        target.classList.remove('will-animate');
                        target.classList.add('animate-in');
                        observer.unobserve(target); // animate once
                    }
                });
            },
            {
                threshold: 0.15, // element considered in-view when 15% visible
            },
        );

        nodes.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="relative min-h-screen overflow-hidden bg-[#FFE0F2]">
                <span id="about" className="absolute top-0 h-0 w-0 opacity-0"></span>
                {/* Animated background blobs */}
                <div className="absolute -top-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-pink-300 to-purple-400 opacity-20 blur-3xl"></div>
                <div
                    className="absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 opacity-20 blur-3xl"
                    style={{ animationDelay: '2s' }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-br from-purple-300 to-pink-400 opacity-10 blur-3xl"
                    style={{ animationDelay: '4s' }}
                ></div>

                <div className="relative z-10 p-6">
                    {/* Header - Slide down from top */}
                    <header className="mb-20 flex justify-end gap-4 duration-700 animate-in fade-in slide-in-from-top-4">
                        <nav className="flex items-center justify-end gap-4">
                            {auth.user ? (
                                <Link
                                    href={auth.user.type === 'staff' ? route('staff.dashboard') : route('student.parcel')}
                                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                >
                                    <span className="relative z-10">Dashboard</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg bg-white px-4 py-2 text-black transition-colors hover:text-black"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-gray-900 px-6 py-2 text-white transition-colors hover:bg-black"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Main Content */}
                    <div className="mx-auto max-w-4xl text-center">
                        {/* Badge - Fade in and slide from top */}
                        <div
                            className="mb-8 inline-flex items-center gap-3 rounded-full border-2 border-pink-300/50 bg-white/90 px-6 py-3 shadow-2xl ring-2 ring-pink-100/50 backdrop-blur-md duration-700 animate-in fade-in slide-in-from-top-4"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1.5">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-sm font-bold text-transparent">
                                Instant Parcel Tracking Dashboard
                            </span>
                        </div>

                        {/* Logo and Title - Scale up and fade in */}
                        <div className="mb-8 duration-700 animate-in fade-in zoom-in-95" style={{ animationDelay: '200ms' }}>
                            <h1 className="relative mb-4">
                                <span className="block">
                                    <span className="relative inline-block bg-gradient-to-r from-[#FF029A] via-pink-600 to-[#FF029A] bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-7xl">
                                        Insta
                                        <span className="relative">
                                            <span className="relative z-10 bg-gradient-to-r from-gray-900 via-green-300 to-green-600 bg-clip-text text-transparent">
                                                Station
                                            </span>
                                            {/* Underline decoration */}
                                            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                                                <path
                                                    d="M1 5.5C50 2.5 100 2.5 199 5.5"
                                                    stroke="url(#gradient)"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#FF029A" />
                                                        <stop offset="100%" stopColor="#16A34A" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </span>
                                    </span>
                                </span>
                            </h1>
                        </div>

                        {/* Animated Text - Fade in and slide from bottom */}
                        <div
                            className="flex items-center justify-center gap-1 text-3xl font-bold duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-4xl"
                            style={{ animationDelay: '300ms' }}
                        >
                            <span className="text-gray-700">The</span>
                            <div className="relative inline-block h-12 w-40 overflow-hidden">
                                {words.map((word, index) => (
                                    <div
                                        key={word}
                                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${index === currentWord
                                            ? 'translate-y-0 opacity-100'
                                            : index < currentWord
                                                ? '-translate-y-full opacity-0'
                                                : 'translate-y-full opacity-0'
                                            }`}
                                    >
                                        <span className="bg-gradient-to-r from-[#FF029A] to-[#16A34A] bg-clip-text text-transparent">{word}</span>
                                    </div>
                                ))}
                            </div>
                            <span className="text-gray-700">Way</span>
                        </div>

                        {/* Subtitle - Fade in */}
                        <p
                            className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-600 duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-2xl"
                            style={{ animationDelay: '400ms' }}
                        >
                            to Track Campus Deliveries
                        </p>

                        {/* Description - Fade in and slide from bottom */}
                        <div className="mb-16 duration-1000 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '500ms' }}>
                            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
                                Streamline parcel management for your <span className="font-semibold text-gray-900">university</span> with{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 font-semibold text-[#FF029A]">smart matching</span>
                                    <span className="absolute bottom-0 left-0 h-2 w-full bg-[#fffeff]"></span>
                                </span>
                                ,{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 font-semibold text-[#16A34A]">secure payments</span>
                                    <span className="absolute bottom-0 left-0 h-2 w-full bg-[#E6F7E6]"></span>
                                </span>
                                , and <span className="font-semibold text-gray-900">real-time tracking</span> for both students and staff.
                            </p>
                        </div>

                        {/* Check for Unclaimed Parcels Button - Scale in */}
                        <div className="mb-16 duration-700 animate-in fade-in zoom-in-95" style={{ animationDelay: '600ms' }}>
                            <div className="relative mx-auto mb-8 w-70">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-pink-400 to-pink-500 opacity-20 blur-2xl"></div>
                                <img src="/images/logo.png" alt="InstaStation" className="relative z-10 mx-auto w-70" />
                            </div>
                            <Link
                                href={route('public.unclaimed')}
                                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-4 font-semibold text-green-700 shadow-lg transition-all duration-300 hover:scale-105 hover:border-green-400 hover:shadow-2xl"
                            >
                                <div className="relative z-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 p-2 shadow-md transition-transform duration-300 group-hover:scale-90">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                <span className="relative z-10">Check Unclaimed Parcels</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                            </Link>
                        </div>

                        {/* Stats Section with Animation */}
                        <section className="my-20 duration-1000 animate-in fade-in zoom-in-95" style={{ animationDelay: '700ms' }}>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="group relative overflow-hidden rounded-3xl border-2 border-pink-200/50 bg-gradient-to-br from-pink-50 to-purple-50 p-8 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-pink-300 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
                                    <div className="relative">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 shadow-xl transition-transform duration-300 group-hover:rotate-12">
                                            <Package className="h-10 w-10 text-white" />
                                        </div>
                                        <h3 className="mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
                                            1000+
                                        </h3>
                                        <p className="font-semibold text-gray-700">Parcels Delivered</p>
                                    </div>
                                </div>

                                <div className="group relative overflow-hidden rounded-3xl border-2 border-purple-200/50 bg-gradient-to-br from-purple-50 to-blue-50 p-8 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-purple-300 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
                                    <div className="relative">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-xl transition-transform duration-300 group-hover:rotate-12">
                                            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h3 className="mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
                                            500+
                                        </h3>
                                        <p className="font-semibold text-gray-700">Active Students</p>
                                    </div>
                                </div>

                                <div className="group relative overflow-hidden rounded-3xl border-2 border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-green-300 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
                                    <div className="relative">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl transition-transform duration-300 group-hover:rotate-12">
                                            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
                                            99%
                                        </h3>
                                        <p className="font-semibold text-gray-700">Success Rate</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Spotlight Section - Interactive Lamp Design */}
                        <div className="relative z-20">
                            <span id="how-it-works" className="absolute -top-32 left-0 h-px w-px opacity-0"></span>

                            <section
                                id="spotlight-section"
                                className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-[#2c2c2c] py-32 min-h-[1200px] flex flex-col items-center mt-20 mb-32"
                            >
                                {/* The Lamp - Swings in */}
                                <div className={`absolute left-1/2 top-0 z-30 flex -translate-x-1/2 flex-col items-center transition-transform duration-[1500ms] ease-out ${isSpotlightVisible ? 'translate-y-0' : '-translate-y-40'}`}>
                                    {/* Cord */}
                                    <div className="h-40 w-1.5 bg-[#4a3b32]"></div>
                                    {/* Shade */}
                                    <div className="relative h-28 w-64">
                                        {/* Shade Body */}
                                        <div className="absolute inset-x-0 bottom-0 top-0 rounded-t-[4rem] rounded-b-xl bg-[#fbbf24] shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
                                            {/* Inner texture/shading */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-yellow-300/30"></div>
                                        </div>
                                        {/* Bulb Glow Effect underneath */}
                                        <div className={`absolute -bottom-12 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-yellow-200 blur-2xl transition-opacity duration-1000 ${isSpotlightVisible ? 'opacity-80' : 'opacity-0'}`}></div>
                                    </div>
                                </div>

                                {/* The Light Beam & Content Container */}
                                <div
                                    className="relative z-10 w-full max-w-6xl flex-1 bg-[#fffbf0] shadow-2xl transition-[clip-path] duration-[2500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        marginTop: '150px', // Start below the lamp
                                        clipPath: isSpotlightVisible
                                            ? 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' // Wide beam
                                            : 'polygon(48% 0%, 52% 0%, 55% 100%, 45% 100%)', // Closed/Narrow beam
                                        paddingTop: '120px',
                                        paddingBottom: '100px'
                                    }}
                                >
                                    {/* Texture Overlay */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>

                                    {/* Helper to hide content when beam is closed */}
                                    <div className={`transition-opacity duration-1000 delay-500 ${isSpotlightVisible ? 'opacity-100' : 'opacity-0'}`}>

                                        {/* Title Area */}
                                        <div className="text-center mb-16 px-6">
                                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 animate-bounce">
                                                <Zap className="h-8 w-8" />
                                            </div>
                                            <h2 className="font-black text-[#4a3b32] text-5xl md:text-7xl mb-6 tracking-tight">
                                                Seamless <br /> Management
                                            </h2>
                                            <p className="mx-auto max-w-2xl text-xl font-bold text-[#8d7f6d]">
                                                We shine a light on where your package is. <br />
                                                From arrival to collection, it's always visible.
                                            </p>
                                        </div>

                                        {/* Cute Feature Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 md:px-16">
                                            {/* Card 1 */}
                                            <div className="group relative bg-white border-[3px] border-[#e6dcc6] rounded-[2rem] p-8 text-center transition-transform duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-xl hover:-rotate-1">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-pink-200">
                                                    <Bell className="h-6 w-6 text-pink-600" />
                                                </div>
                                                <h3 className="mt-4 font-black text-2xl text-[#594a3a]">Instant<br />Alerts</h3>
                                                <p className="mt-2 text-sm font-bold text-[#9ca3af]">Ping! Updates sent straight to your phone.</p>
                                            </div>

                                            {/* Card 2 */}
                                            <div className="group relative bg-white border-[3px] border-[#e6dcc6] rounded-[2rem] p-8 text-center transition-transform duration-300 hover:scale-105 hover:border-blue-400 hover:shadow-xl hover:rotate-1">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-blue-200">
                                                    <Package className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <h3 className="mt-4 font-black text-2xl text-[#594a3a]">Safe<br />Storage</h3>
                                                <p className="mt-2 text-sm font-bold text-[#9ca3af]">Your parcels nap safely until you arrive.</p>
                                            </div>

                                            {/* Card 3 */}
                                            <div className="group relative bg-white border-[3px] border-[#e6dcc6] rounded-[2rem] p-8 text-center transition-transform duration-300 hover:scale-105 hover:border-green-400 hover:shadow-xl hover:-rotate-1">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-green-200">
                                                    <CreditCard className="h-6 w-6 text-green-600" />
                                                </div>
                                                <h3 className="mt-4 font-black text-2xl text-[#594a3a]">Easy<br />Payment</h3>
                                                <p className="mt-2 text-sm font-bold text-[#9ca3af]">Pay fees in a snap with proof upload.</p>
                                            </div>
                                        </div>

                                        {/* Bottom Action */}
                                        <div className="mt-16 text-center">
                                            <div className="inline-block relative">
                                                <div className="absolute inset-0 bg-yellow-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                                <div className="relative bg-white border-2 border-[#e6dcc6] px-6 py-2 rounded-full text-sm font-bold text-[#8d7f6d] shadow-sm">
                                                    Currently automating 100% of campus workflow
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Feature Cards - Staggered fade in from bottom */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {/* User Management */}
                            <div
                                className="group relative overflow-hidden rounded-3xl bg-[#F3E8FF] p-8 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:scale-105 hover:shadow-2xl"
                                style={{ animationDelay: '100ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-purple-300 opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-gray-900">User Management</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        Automate name matching and profile management for students and staff
                                    </p>
                                </div>
                            </div>

                            {/* Payment Processing */}
                            <div
                                className="group relative overflow-hidden rounded-3xl bg-[#D1FAE5] p-8 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:scale-105 hover:shadow-2xl"
                                style={{ animationDelay: '200ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-green-300 opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <CreditCard className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-gray-900">Payment Processing</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        Secure payment handling with proof upload and staff verification
                                    </p>
                                </div>
                            </div>

                            {/* Smart Notifications */}
                            <div
                                className="group relative overflow-hidden rounded-3xl bg-[#FFF4ED] p-8 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:scale-105 hover:shadow-2xl"
                                style={{ animationDelay: '300ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-orange-300 opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <Bell className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-gray-900">Smart Notifications</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        Automated reminders for collection, payment due, and parcel arrival
                                    </p>
                                </div>
                            </div>

                            {/* Parcel Tracking */}
                            <div
                                className="group relative overflow-hidden rounded-3xl bg-[#DBEAFE] p-8 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:scale-105 hover:shadow-2xl"
                                style={{ animationDelay: '400ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-300 opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                                        <MapPin className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-gray-900">Parcel Tracking</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        Real-time tracking from arrival to collection with QR codes and notifications
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* How It Works Section - Redesigned Film Strip Style */}
                        <div className="relative h-0 w-0">
                            <span id="process-timeline" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>

                        <section className="relative pt-32 pb-0">
                            {/* Cute Pattern Background */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'radial-gradient(#dccfb6 2px, transparent 2px)',
                                backgroundSize: '30px 30px'
                            }}></div>

                            <div className="container mx-auto px-6">
                                <div className="text-center mb-24">
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-white px-6 py-2 text-sm font-bold text-pink-700 shadow-lg animate-in fade-in slide-in-from-top-4">
                                        <Sparkles className="h-4 w-4" />
                                        Process Timeline
                                    </div>
                                    <h2 className="mb-4 text-4xl font-black text-[#594a3a] md:text-6xl animate-in fade-in slide-in-from-bottom-4">
                                        Your Parcel Journey
                                    </h2>
                                    <p className="mx-auto max-w-2xl text-lg font-medium text-[#8d7f6d] animate-in fade-in slide-in-from-bottom-4">
                                        Scroll down to follow your parcel's adventure!
                                    </p>
                                </div>

                                <div className="relative">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

                                        {/* Left Column: Sticky Film Frame */}
                                        <div className="sticky top-[calc(50vh-250px)] hidden lg:flex h-[500px] justify-center items-center">
                                            {/* The Frame */}
                                            <div className="relative w-80 h-[420px] bg-[#fffbf0] rounded-[3rem] border-[16px] border-[#e6dcc6] shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden transform rotate-[-2deg] transition-all duration-500 hover:rotate-0 hover:scale-105">
                                                {/* Inner Shadow / Depth */}
                                                <div className="absolute inset-0 m-2 rounded-[2.5rem] bg-[#f2eadd] pointer-events-none"></div>

                                                {/* The Film Strip Viewport */}
                                                <div className="absolute inset-4 rounded-[2.2rem] overflow-hidden bg-white ring-4 ring-white shadow-inner">
                                                    {/* The Sliding Strip */}
                                                    <div
                                                        className="h-full w-full flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                                        style={{ transform: `translateY(-${activeTimelineStep * 100}%)` }}
                                                    >
                                                        {/* Scene 1: Arrival */}
                                                        <div className="h-full w-full flex-shrink-0 flex flex-col items-center justify-center bg-pink-50 p-6 text-center">
                                                            <div className="mb-6 h-32 w-32 rounded-full bg-pink-200 flex items-center justify-center shadow-lg animate-bounce-slow">
                                                                <Package className="h-16 w-16 text-pink-600" />
                                                            </div>
                                                            <div className="font-black text-2xl text-pink-400 opacity-20">STEP 01</div>
                                                        </div>

                                                        {/* Scene 2: Alert */}
                                                        <div className="h-full w-full flex-shrink-0 flex flex-col items-center justify-center bg-purple-50 p-6 text-center">
                                                            <div className="relative mb-6">
                                                                <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75"></div>
                                                                <div className="relative h-32 w-32 rounded-full bg-purple-200 flex items-center justify-center shadow-lg">
                                                                    <Bell className="h-16 w-16 text-purple-600" />
                                                                </div>
                                                                <div className="absolute top-0 right-0 h-8 w-8 rounded-full bg-red-500 border-4 border-white"></div>
                                                            </div>
                                                            <div className="font-black text-2xl text-purple-400 opacity-20">STEP 02</div>
                                                        </div>

                                                        {/* Scene 3: Payment */}
                                                        <div className="h-full w-full flex-shrink-0 flex flex-col items-center justify-center bg-blue-50 p-6 text-center">
                                                            <div className="mb-6 h-32 w-32 rounded-full bg-blue-200 flex items-center justify-center shadow-lg transform rotate-3">
                                                                <CreditCard className="h-16 w-16 text-blue-600" />
                                                            </div>
                                                            <div className="font-black text-2xl text-blue-400 opacity-20">STEP 03</div>
                                                        </div>

                                                        {/* Scene 4: Collection */}
                                                        <div className="h-full w-full flex-shrink-0 flex flex-col items-center justify-center bg-green-50 p-6 text-center">
                                                            <div className="mb-6 h-32 w-32 rounded-full bg-green-200 flex items-center justify-center shadow-lg">
                                                                <MapPin className="h-16 w-16 text-green-600 animate-bounce" />
                                                            </div>
                                                            <div className="font-black text-2xl text-green-400 opacity-20">STEP 04</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Glint/Reflection */}
                                                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none rounded-[3rem]"></div>
                                            </div>

                                            {/* Decoration below frame */}
                                            <div className="absolute -bottom-10 -z-10 h-12 w-48 rounded-[100%] bg-black/10 blur-xl"></div>
                                        </div>

                                        {/* Right Column: Scrolling Steps */}
                                        <div className="relative">
                                            {/* Connecting Line */}
                                            <div className="absolute left-8 lg:left-[-40px] top-0 bottom-0 w-1 bg-gradient-to-b from-pink-200 via-purple-200 to-green-200 hidden lg:block rounded-full"></div>

                                            <div className="space-y-[30vh] md:space-y-[40vh] pb-0 pt-[5vh]">
                                                {/* Step 1 */}
                                                <div className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[1px]'}`} data-step="0">
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="flex-shrink-0 hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-4 border-pink-100 text-2xl font-black text-pink-500 shadow-xl z-10 relative">
                                                            01
                                                            {activeTimelineStep === 0 && <span className="absolute inset-0 rounded-xl ring-2 ring-pink-400 animate-ping opacity-50"></span>}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-2 border-pink-100 backdrop-blur-sm">
                                                            <div className="flex items-center gap-4 mb-4 lg:hidden">
                                                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 font-bold">01</div>
                                                                <Package className="h-6 w-6 text-pink-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Parcel Arrival</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Your parcel arrives at our secure hub. Our staff carefully scans and logs it into the InstaStation system, creating a digital record instantly.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 2 */}
                                                <div className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[1px]'}`} data-step="1">
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="flex-shrink-0 hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-4 border-purple-100 text-2xl font-black text-purple-500 shadow-xl z-10 relative">
                                                            02
                                                            {activeTimelineStep === 1 && <span className="absolute inset-0 rounded-xl ring-2 ring-purple-400 animate-ping opacity-50"></span>}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-2 border-purple-100 backdrop-blur-sm">
                                                            <div className="flex items-center gap-4 mb-4 lg:hidden">
                                                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold">02</div>
                                                                <Bell className="h-6 w-6 text-purple-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Smart Alert</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                You get a notification right away! Check your email or the student portal to see your parcel details, photo, and collection status.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 3 */}
                                                <div className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[1px]'}`} data-step="2">
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="flex-shrink-0 hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-4 border-blue-100 text-2xl font-black text-blue-500 shadow-xl z-10 relative">
                                                            03
                                                            {activeTimelineStep === 2 && <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400 animate-ping opacity-50"></span>}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-2 border-blue-100 backdrop-blur-sm">
                                                            <div className="flex items-center gap-4 mb-4 lg:hidden">
                                                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">03</div>
                                                                <CreditCard className="h-6 w-6 text-blue-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Easy Payment</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Need to pay a handling fee? Just upload your payment proof directly through the dashboard. Our staff verifies it in minutes.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 4 */}
                                                <div className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[1px]'}`} data-step="3">
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="flex-shrink-0 hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-4 border-green-100 text-2xl font-black text-green-500 shadow-xl z-10 relative">
                                                            04
                                                            {activeTimelineStep === 3 && <span className="absolute inset-0 rounded-xl ring-2 ring-green-400 animate-ping opacity-50"></span>}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-2 border-green-100 backdrop-blur-sm">
                                                            <div className="flex items-center gap-4 mb-4 lg:hidden">
                                                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">04</div>
                                                                <MapPin className="h-6 w-6 text-green-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Quick Collection</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Head to the counter, show your unique collection QR code, and grab your parcel. Simple, secure, and super fast!
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Newsletter Section - Curated Studio */}
                        <div className="relative h-0 w-0">
                            <span id="newsletter" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>
                        <div
                            className="relative mt-24 duration-700 animate-in fade-in slide-in-from-left-8"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="relative overflow-hidden rounded-[40px] border-[8px] border-[#f2e8da] bg-[#fffbf0] p-10 shadow-[0_30px_60px_rgba(200,180,160,0.2)]">
                                {/* Decorative elements mimicking the reference */}
                                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                    {/* Top Tablet 'notch' or decorative bar */}
                                    <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-xl bg-[#f2e8da]"></div>
                                </div>

                                <div className="relative mb-12 text-center">
                                    <div className="mb-4 inline-flex -rotate-2 transform items-center gap-2 rounded-2xl bg-[#ffecb3] px-6 py-3 shadow-sm transition-transform hover:rotate-0">
                                        <Sparkles className="h-5 w-5 text-orange-400" />
                                        <span className="font-black tracking-wide text-orange-900">Beaver's News!</span>
                                    </div>

                                    <h2 className="relative z-10 font-black text-[#2c3e50] md:text-5xl">
                                        Campus <span className="relative inline-block text-[#ff8e8e]">Dispatch
                                            <svg className="absolute -bottom-2 -left-2 -z-10 h-4 w-full text-[#ffeb3b]" viewBox="0 0 100 10" preserveAspectRatio="none">
                                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                                            </svg>
                                        </span>
                                    </h2>
                                    <p className="mt-4 font-bold text-[#95a5a6]">
                                        | Daily News | Cultural Express | Otter Knowledge |
                                    </p>

                                    {announcementsSorted.length > displayedAnnouncements.length && (
                                        <div className="mt-6 flex justify-center">
                                            <button
                                                onClick={() => setVisibleCount((c) => Math.min(c + 4, announcementsSorted.length))}
                                                className="group inline-flex items-center gap-2 rounded-full bg-[#81ecec] px-8 py-3 font-black text-[#00cec9] transition-all hover:-translate-y-1 hover:bg-[#4dd0e1] hover:text-white"
                                            >
                                                View More <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {announcements.length === 0 ? (
                                    <div className="rounded-[32px] border border-dashed border-rose-200/80 bg-white/90 p-12 text-center shadow-inner">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                                            <Bell className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-lg font-semibold text-gray-500">No announcements yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-12 lg:grid-cols-2">
                                        {featuredAnnouncement && (
                                            <div
                                                className="group relative rotate-1 transform overflow-hidden rounded-[30px] border-[6px] border-[#fff] bg-[#fdf2f8] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]"
                                                onClick={() => setSelectedAnnouncement(featuredAnnouncement)}
                                            >
                                                {/* Decorative Tape */}
                                                <div className="absolute top-2 left-1/2 h-8 w-24 -translate-x-1/2 -rotate-2 bg-[#ffeaa7]/50 shadow-sm backdrop-blur-sm"></div>

                                                <div className="h-full rounded-[20px] bg-white p-6">
                                                    {featuredAnnouncement.announcement_image && (
                                                        <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[16px] border-4 border-[#fff0f6]">
                                                            <img
                                                                src={`/storage/${featuredAnnouncement.announcement_image}`}
                                                                alt="announcement"
                                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#fae3d9] px-3 py-1 text-[#e17055]">
                                                            <Package className="h-3 w-3" /> FEATURED
                                                        </span>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                                        <span>
                                                            {formatDate(featuredAnnouncement.publish_date || featuredAnnouncement.created_at)}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-4 text-2xl font-black text-[#2d3436]">
                                                        {featuredAnnouncement.announcement_title}
                                                    </h3>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="text-sm font-bold text-[#b2bec3]">Tap to read more...</span>
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fab1a0] text-white transition-colors group-hover:bg-[#e17055]">
                                                            <ArrowUpRight className="h-5 w-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative grid content-start gap-4">
                                            {/* Removed timeline line for cleaner blocky look */}

                                            {secondaryAnnouncements.map((a: AnnouncementCard, index: number) => (
                                                <div
                                                    key={a.announcement_id}
                                                    className="group relative flex cursor-pointer gap-5 rounded-[24px] border-2 border-[#eeebe6] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffeaa7] hover:shadow-[4px_4px_0px_#ffeaa7]"
                                                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                                                    onClick={() => setSelectedAnnouncement(a)}
                                                >
                                                    {a.announcement_image && (
                                                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] border-2 border-[#f0f0f0]">
                                                            <img
                                                                src={`/storage/${a.announcement_image}`}
                                                                alt="announcement"
                                                                className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-1 flex-col justify-center">
                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wider text-[#b2bec3] uppercase">
                                                            <span className="flex items-center gap-1 rounded-md bg-[#f1f2f6] px-2 py-0.5 text-[#a4b0be]">
                                                                <Calendar className="h-3 w-3" /> {formatDate(a.publish_date || a.created_at)}
                                                            </span>
                                                        </div>
                                                        <h4 className="mt-1 line-clamp-1 text-lg font-black text-[#2d3436] group-hover:text-[#e17055]">
                                                            {a.announcement_title}
                                                        </h4>
                                                        <p className="mt-1 line-clamp-2 text-xs font-medium text-[#636e72]">
                                                            {a.announcement_content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-center self-center rounded-full bg-[#f1f2f6] p-2 text-[#b2bec3] transition-colors group-hover:bg-[#ffeaa7] group-hover:text-[#d35400]">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >
                </div >
            </div >
            {/* Footer - Premium Professional Design */}
            < footer className="relative overflow-hidden bg-gradient-to-r from-[#f7d8ff] via-[#fee5d3] to-[#d3e7ff] duration-1000 animate-in fade-in slide-in-from-bottom-8" >
                {/* Animated background decorations */}
                < div className="pointer-events-none absolute inset-0 overflow-hidden" >
                    <div className="absolute -top-40 -right-40 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 blur-3xl delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-lime-500/10 blur-3xl delay-500"></div>
                </div >

                {/* Grid pattern overlay */}
                < div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" ></div >

                <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        {/* Brand Column - Enhanced */}
                        <div className="lg:col-span-5">
                            <div className="mb-8">
                                {/* Logo with gradient */}
                                <div className="mb-6 inline-flex items-center gap-3">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl">
                                        <img src="/images/parcel-logo.png" alt="InstaStation" className="relative z-10 mx-auto w-70" />
                                    </div>
                                </div>
                                <p className="max-w-md text-lg leading-relaxed text-gray-700">
                                    The smart way to track and manage campus deliveries. Get notified instantly when your parcels arrive and collect
                                    them hassle-free.
                                </p>
                            </div>

                            {/* Feature Pills - Enhanced */}
                            <div className="mb-8 flex flex-wrap gap-3">
                                <div className="group relative overflow-hidden rounded-full border border-purple-300 bg-gradient-to-r from-purple-100 to-purple-200 px-5 py-2.5 text-gray-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-400 hover:from-purple-200 hover:to-purple-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-600/0 transition-all duration-300 group-hover:from-purple-500/10 group-hover:to-purple-600/10"></div>
                                    <div className="relative flex items-center gap-2">
                                        <Package className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm font-semibold">Smart Tracking</span>
                                    </div>
                                </div>
                                <div className="group relative overflow-hidden rounded-full border border-pink-300 bg-gradient-to-r from-pink-100 to-pink-200 px-5 py-2.5 text-gray-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-pink-400 hover:from-pink-200 hover:to-pink-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-pink-600/0 transition-all duration-300 group-hover:from-pink-500/10 group-hover:to-pink-600/10"></div>
                                    <div className="relative flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-pink-500" />
                                        <span className="text-sm font-semibold">Instant Alerts</span>
                                    </div>
                                </div>
                                <div className="group relative overflow-hidden rounded-full border border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 px-5 py-2.5 text-gray-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:from-blue-200 hover:to-blue-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-600/0 transition-all duration-300 group-hover:from-blue-500/10 group-hover:to-blue-600/10"></div>
                                    <div className="relative flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-semibold">Live Updates</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Quick Links Column - Enhanced */}
                        <div className="lg:col-span-3">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-gradient-to-r from-white to-pink-100 px-4 py-2 text-gray-700 backdrop-blur-sm">
                                <Sparkles className="h-4 w-4 text-pink-500" />
                                <h4 className="text-lg font-bold">Quick Links</h4>
                            </div>
                            <ul className="space-y-4 text-gray-700">
                                <li>
                                    <a
                                        href="#about"
                                        className="group relative inline-flex items-center gap-3 transition-all duration-300 hover:translate-x-2 hover:text-white"
                                    >
                                        <div className="absolute -left-8 h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                                        <span className="text-base font-medium text-gray-800">About Us</span>
                                        <svg
                                            className="h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#how-it-works"
                                        className="group relative inline-flex items-center gap-3 transition-all duration-300 hover:translate-x-2 hover:text-white"
                                    >
                                        <div className="absolute -left-8 h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                                        <span className="text-base font-medium text-gray-800">How It Works</span>
                                        <svg
                                            className="h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#process-timeline"
                                        className="group relative inline-flex items-center gap-3 transition-all duration-300 hover:translate-x-2 hover:text-white"
                                    >
                                        <div className="absolute -left-8 h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                                        <span className="text-base font-medium text-gray-800">Process Timeline</span>
                                        <svg
                                            className="h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#newsletter"
                                        className="group relative inline-flex items-center gap-3 transition-all duration-300 hover:translate-x-2 hover:text-white"
                                    >
                                        <div className="absolute -left-8 h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                                        <span className="text-base font-medium text-gray-800">Newsletter</span>
                                        <svg
                                            className="h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </li>

                            </ul>
                        </div>

                        {/* Contact & Legal Column - Enhanced */}
                        <div id="contact" className="lg:col-span-4">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-white to-blue-100 px-4 py-2 text-gray-700 backdrop-blur-sm">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <h4 className="text-lg font-bold">Get in Touch</h4>
                            </div>

                            {/* Contact Cards */}
                            <div className="mb-8 space-y-4">
                                <div className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-r from-white to-pink-100 p-5 text-gray-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-pink-300 hover:from-pink-50 hover:to-pink-200 hover:shadow-lg hover:shadow-pink-200/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-pink-600/0 transition-all duration-300 group-hover:from-pink-500/10 group-hover:to-pink-600/10"></div>
                                    <div className="relative flex items-start gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-200 to-pink-400 ring-2 ring-pink-200">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">Email</p>
                                            <a
                                                href="mailto:support@instastation.edu"
                                                className="text-base font-semibold text-gray-800 transition-colors hover:text-pink-500"
                                            >
                                                support@instastation.edu
                                            </a>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* Legal Section */}
                            <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 text-gray-700 shadow-lg backdrop-blur-sm">
                                <h5 className="mb-4 text-sm font-bold tracking-wider text-gray-600 uppercase">Legal</h5>
                                <ul className="space-y-3">
                                    <li>
                                        <a
                                            href="#"
                                            className="group inline-flex items-center gap-2 text-sm text-gray-600 transition-all duration-300 hover:text-pink-500"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-pink-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                            Privacy Policy
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="group inline-flex items-center gap-2 text-sm text-gray-600 transition-all duration-300 hover:text-purple-500"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                            Terms of Service
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Gradient Divider */}
                    <div className="my-12">
                        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
                        <div className="mt-2 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
                    </div>

                    {/* Bottom Bar - Enhanced */}
                    {/* Bottom Bar - Enhanced */}
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex flex-col items-center gap-2 text-gray-700 md:flex-row md:gap-6">
                            <p className="text-sm">
                                © {new Date().getFullYear()} <span className="font-bold text-gray-900">InstaStation</span>. All rights reserved.
                            </p>
                            <div className="hidden h-4 w-px bg-gray-700 md:block"></div>
                            <p className="text-sm text-gray-700">Universiti Malaysia Pahang Al-Sultan Abdullah</p>
                        </div>
                    </div>
                </div>
            </footer >

            {/* Announcement Detail Modal - Wooden Menu Board Style */}
            {
                selectedAnnouncement && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 animate-in fade-in">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)} />

                        {/* Wrapper to control max height and ensure it fits */}
                        <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col translate-y-8 duration-500 animate-in slide-in-from-bottom-8 zoom-in-95">

                            {/* Hanging String & Nail - Positioned absolutely relative to wrapper */}
                            <div className="absolute -top-24 left-1/2 h-24 w-60 -translate-x-1/2 pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* String */}
                                    <path d="M120 10L20 90" stroke="#dcdde1" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M120 10L220 90" stroke="#dcdde1" strokeWidth="4" strokeLinecap="round" />
                                    {/* Nail */}
                                    <circle cx="120" cy="10" r="8" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="2" />
                                    <circle cx="120" cy="10" r="3" fill="#ecf0f1" className="opacity-50" />
                                </svg>
                            </div>

                            {/* Main Board Container */}
                            <div className="relative flex flex-col overflow-hidden rounded-[48px] bg-[#dccfb6] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                                {/* Wood Texture/Frame Details */}
                                <div className="absolute inset-0 pointer-events-none rounded-[48px] border-[12px] border-[#cbbca0]"></div>
                                {/* Corner Accents */}
                                <div className="absolute top-6 left-6 h-8 w-1 rotate-45 rounded-full bg-[#b0a28a] pointer-events-none"></div>
                                <div className="absolute top-6 right-6 h-8 w-1 -rotate-45 rounded-full bg-[#b0a28a] pointer-events-none"></div>
                                <div className="absolute bottom-6 left-6 h-8 w-1 -rotate-45 rounded-full bg-[#b0a28a] pointer-events-none"></div>
                                <div className="absolute bottom-6 right-6 h-8 w-1 rotate-45 rounded-full bg-[#b0a28a] pointer-events-none"></div>

                                {/* Inner Paper Content Area - Scrollable */}
                                <div className="relative mx-3 my-3 flex flex-col overflow-y-auto rounded-[36px] bg-[#fbf9f5] px-6 pt-12 pb-10 shadow-inner md:px-8 custom-scrollbar">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedAnnouncement(null)}
                                        className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#e3dad0] text-[#8d7f6d] transition-transform hover:rotate-90 hover:bg-[#d6c9bc]"
                                    >
                                        <X size={18} strokeWidth={3} />
                                    </button>

                                    {/* Title Section with Organic Green Blob */}
                                    <div className="relative mb-8 flex-shrink-0 text-center">
                                        <div className="relative inline-block">
                                            {/* Green Organic Background */}
                                            <div className="absolute inset-0 -rotate-2 scale-110 transform rounded-[30%] bg-[#8bad6b] opacity-90 blur-[1px]"></div>
                                            <h2 className="relative z-10 px-6 py-2 text-2xl font-black tracking-widest text-white">
                                                ANNOUNCEMENT
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Image Area */}
                                    {selectedAnnouncement.announcement_image && (
                                        <div className="mb-6 w-full flex-shrink-0 overflow-hidden rounded-xl shadow-sm">
                                            <img
                                                src={`/storage/${selectedAnnouncement.announcement_image}`}
                                                alt="announcement"
                                                className="h-56 w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Content Info */}
                                    <div className="flex-1 text-center">
                                        <h3 className="text-2xl font-black text-[#594a3a] md:text-3xl">
                                            {selectedAnnouncement.announcement_title}
                                        </h3>

                                        {/* Meta Data Stickers */}
                                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                            <span className="relative z-0 inline-block">
                                                <span className="absolute inset-0 top-1/2 h-3 w-full -translate-y-1/2 scale-110 -rotate-2 transform bg-[#ffeaa7]/60"></span>
                                                <span className="relative z-10 text-xs font-bold text-[#8d7f6d] md:text-sm">
                                                    {formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}
                                                </span>
                                            </span>
                                            <span className="text-[#cbbca0]">●</span>
                                            <span className="relative z-0 inline-block">
                                                <span className="absolute inset-0 top-1/2 h-3 w-full -translate-y-1/2 scale-110 rotate-1 transform bg-[#fab1a0]/40"></span>
                                                <span className="relative z-10 text-xs font-bold text-[#8d7f6d] md:text-sm">
                                                    UMPSA Postal Hub
                                                </span>
                                            </span>
                                        </div>

                                        {/* Description - The scrolling part */}
                                        <div className="relative mt-6 text-left">
                                            <p className="whitespace-pre-line text-base font-bold leading-relaxed text-[#8d7f6d] md:text-lg">
                                                {selectedAnnouncement.announcement_content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom Decorative Footer Text */}
                                    <div className="mt-8 flex-shrink-0 text-center text-xs font-bold text-[#cbbca0]">
                                        Always welcome to visit us! 🦦
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Style for custom scrollbar within this component */}
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 8px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background-color: #e3dad0;
                                border-radius: 20px;
                                border: 2px solid #fbf9f5;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background-color: #d6c9bc;
                            }
                        `}</style>
                    </div>
                )
            }
        </>
    );
}
