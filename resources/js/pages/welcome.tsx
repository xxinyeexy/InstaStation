import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Bell, Calendar, CreditCard, MapPin, Package, PackagePlus, Sparkles, X, Zap } from 'lucide-react';
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
            { threshold: 0.2 }, // Trigger when 20% visible
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
                threshold: 0,
            },
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
                            behavior: 'smooth',
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

                <div className="relative z-10 p-4 md:p-6">
                    {/* Header - Slide down from top */}
                    <header className="mb-12 flex justify-end gap-2 duration-700 animate-in fade-in slide-in-from-top-4 md:mb-20 md:gap-4">
                        <nav className="flex items-center justify-end gap-2 md:gap-4">
                            {auth.user ? (
                                <Link
                                    href={auth.user.type === 'staff' ? route('staff.dashboard') : route('student.parcel')}
                                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl md:rounded-2xl md:px-8 md:py-3 md:text-base"
                                >
                                    <span className="relative z-10">Dashboard</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg bg-white px-3 py-2 text-sm text-black transition-colors hover:text-black md:px-4 md:text-base"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-black md:px-6 md:text-base"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Main Content */}
                    <div className="mx-auto max-w-4xl px-2 text-center">
                        {/* Badge - Fade in and slide from top */}
                        <div
                            className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-pink-300/50 bg-white/90 px-4 py-2 shadow-2xl ring-2 ring-pink-100/50 backdrop-blur-md duration-700 animate-in fade-in slide-in-from-top-4 md:mb-8 md:gap-3 md:px-6 md:py-3"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1 md:p-1.5">
                                <Sparkles className="h-3 w-3 text-white md:h-4 md:w-4" />
                            </div>
                            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-xs font-bold text-transparent md:text-sm">
                                Instant Parcel Tracking Dashboard
                            </span>
                        </div>

                        {/* Logo and Title - Scale up and fade in */}
                        <div className="mb-6 duration-700 animate-in fade-in zoom-in-95 md:mb-8" style={{ animationDelay: '200ms' }}>
                            <h1 className="relative mb-4">
                                <span className="block">
                                    <span className="relative inline-block bg-gradient-to-r from-[#FF029A] via-pink-600 to-[#FF029A] bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-7xl">
                                        Insta
                                        <span className="relative">
                                            <span className="relative z-10 bg-gradient-to-r from-gray-900 via-green-300 to-green-600 bg-clip-text text-transparent">
                                                Station
                                            </span>
                                            {/* Underline decoration */}
                                            <svg className="absolute -bottom-1 left-0 w-full md:-bottom-2" height="8" viewBox="0 0 200 8" fill="none">
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
                            className="flex items-center justify-center gap-1 text-2xl font-bold duration-700 animate-in fade-in slide-in-from-bottom-4 sm:text-3xl md:text-4xl"
                            style={{ animationDelay: '300ms' }}
                        >
                            <span className="text-gray-700">The</span>
                            <div className="relative inline-block h-8 w-28 overflow-hidden sm:h-10 sm:w-32 md:h-12 md:w-40">
                                {words.map((word, index) => (
                                    <div
                                        key={word}
                                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                                            index === currentWord
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
                            className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-600 duration-700 animate-in fade-in slide-in-from-bottom-4 sm:text-xl md:text-2xl"
                            style={{ animationDelay: '400ms' }}
                        >
                            to Track Campus Deliveries
                        </p>

                        {/* Description - Fade in and slide from bottom */}
                        <div
                            className="mt-6 mb-10 duration-1000 animate-in fade-in slide-in-from-bottom-8 md:mt-8 md:mb-16"
                            style={{ animationDelay: '500ms' }}
                        >
                            <p className="mx-auto max-w-3xl px-2 text-base leading-relaxed font-medium text-gray-600 sm:text-lg md:text-xl">
                                Streamline parcel management for your{' '}
                                <span className="rounded-lg bg-pink-100 px-2 py-1 font-bold text-pink-700">university</span> with{' '}
                                <span className="rounded-lg bg-purple-100 px-2 py-1 font-bold text-purple-700">smart matching</span>,{' '}
                                <span className="rounded-lg bg-green-100 px-2 py-1 font-bold text-green-700">secure payments</span>, and
                                <span className="rounded-lg bg-yellow-100 px-2 py-1 font-bold text-yellow-700">real-time tracking.</span>
                            </p>
                        </div>

                        {/* Check for Unclaimed Parcels Button - Scale in */}
                        <div className="mb-10 duration-700 animate-in fade-in zoom-in-95 md:mb-16" style={{ animationDelay: '600ms' }}>
                            <div className="relative mx-auto mb-6 w-48 sm:w-56 md:mb-8 md:w-70">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-pink-400 to-pink-500 opacity-20 blur-2xl"></div>
                                <img src="/images/logo.png" alt="InstaStation" className="relative z-10 mx-auto w-full" />
                            </div>
                            <Link
                                href={route('public.unclaimed')}
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 text-sm font-semibold text-green-700 shadow-lg transition-all duration-300 hover:scale-105 hover:border-green-400 hover:shadow-2xl md:gap-3 md:rounded-2xl md:px-8 md:py-4 md:text-base"
                            >
                                <div className="relative z-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-md transition-transform duration-300 group-hover:scale-90 md:rounded-xl md:p-2">
                                    <PackagePlus className="h-4 w-4 text-white md:h-5 md:w-5" />
                                </div>
                                <span className="relative z-10">Grab Unclaimed Parcels</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                            </Link>
                        </div>

                        {/* Stats Section with Animation */}
                        <section className="my-12 duration-1000 animate-in fade-in zoom-in-95 md:my-20" style={{ animationDelay: '700ms' }}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
                        {/* Spotlight Section - Interactive Lamp Design */}
                        <div className="relative z-20">
                            <span id="how-it-works" className="absolute -top-32 left-0 h-px w-px opacity-0"></span>

                            <section
                                id="spotlight-section"
                                className="relative left-1/2 mt-12 mb-20 flex min-h-[900px] w-screen -translate-x-1/2 flex-col items-center overflow-hidden bg-[#2c2c2c] py-16 md:mt-20 md:mb-32 md:min-h-[1400px] md:py-32"
                            >
                                {/* The Lamp - Swings in */}
                                <div
                                    className={`absolute top-0 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center transition-transform duration-[1500ms] ease-out ${isSpotlightVisible ? 'translate-y-0' : '-translate-y-40'}`}
                                >
                                    {/* Cord */}
                                    <div className="h-24 w-1 bg-[#4a3b32] md:h-40 md:w-1.5"></div>
                                    {/* Shade */}
                                    <div className="relative h-20 w-48 md:h-28 md:w-64">
                                        {/* Shade Body */}
                                        <div className="absolute inset-x-0 top-0 bottom-0 z-20 overflow-hidden rounded-t-[4rem] rounded-b-xl bg-[#fbbf24] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                            {/* Inner texture/shading */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-yellow-300/30"></div>
                                        </div>
                                        {/* Bulb Glow Effect underneath */}
                                        <div
                                            className={`absolute -bottom-12 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-yellow-200 blur-2xl transition-opacity duration-1000 ${isSpotlightVisible ? 'opacity-80' : 'opacity-0'}`}
                                        ></div>
                                    </div>
                                </div>

                                {/* The Light Beam Container */}
                                <div
                                    className="relative z-10 flex w-full flex-1 flex-col items-center bg-[#fffbf0] shadow-2xl transition-[clip-path] duration-[2500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        marginTop: '100px', // Start below the lamp - reduced for mobile
                                        clipPath: isSpotlightVisible
                                            ? 'polygon(50% 0%, 150% 100%, -50% 100%)' // Very Wide Triangle (extends beyond screen edges for full floor coverage)
                                            : 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)', // Closed point
                                        paddingTop: '120px',
                                        paddingBottom: '60px',
                                    }}
                                >
                                    {/* Texture Overlay */}
                                    <div
                                        className="pointer-events-none absolute inset-0 opacity-10"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                                        }}
                                    ></div>

                                    {/* Content Container - Constrained Width */}
                                    <div
                                        className={`w-full max-w-5xl px-4 transition-opacity delay-500 duration-1000 md:px-6 ${isSpotlightVisible ? 'opacity-100' : 'opacity-0'}`}
                                    >
                                        {/* Title Area */}
                                        <div className="mb-10 text-center md:mb-16">
                                            <div className="mx-auto mb-4 flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-yellow-100 text-yellow-600 md:mb-6 md:h-16 md:w-16">
                                                <Zap className="h-6 w-6 md:h-8 md:w-8" />
                                            </div>
                                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-white px-4 py-1.5 text-xs font-bold text-pink-700 shadow-lg animate-in fade-in slide-in-from-top-4 md:mb-6 md:px-6 md:py-2 md:text-sm">
                                                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                                                How It Works
                                            </div>
                                            <h2 className="mb-4 text-3xl font-black tracking-tight text-[#4a3b32] sm:text-4xl md:mb-6 md:text-5xl lg:text-7xl">
                                                Seamless <br /> Management
                                            </h2>
                                            <p className="mx-auto max-w-2xl px-2 text-base font-bold text-[#8d7f6d] md:text-lg lg:text-xl">
                                                We shine a light on where your package is. <br />
                                                From arrival to collection, it's always visible.
                                            </p>
                                        </div>

                                        {/* Visual Graphic Area (Mimicking the cute characters in reference) */}
                                        <div className="relative mx-auto mb-10 max-w-3xl md:mb-16">
                                            {/* Cute Feature Cards Row */}
                                            <div className="grid grid-cols-1 justify-center gap-6 md:grid-cols-3 md:gap-8">
                                                {/* Card 1 - Left */}
                                                <div className="group relativeRotate relative rounded-[2rem] border-[3px] border-[#e6dcc6] bg-white p-5 text-center shadow-lg transition-transform hover:scale-105 hover:border-pink-400 md:mt-12 md:rotate-[-5deg] md:p-6 md:hover:rotate-0">
                                                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-600 md:h-16 md:w-16">
                                                        <Bell className="h-7 w-7 md:h-8 md:w-8" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-[#594a3a] md:text-xl">
                                                        Instant
                                                        <br />
                                                        Alerts
                                                    </h3>
                                                </div>

                                                {/* Card 2 - Center (Prominent) */}
                                                <div className="group relative z-10 rounded-[2.5rem] border-[3px] border-[#e6dcc6] bg-white p-6 text-center shadow-xl transition-transform hover:scale-105 hover:border-blue-400 md:scale-110 md:p-8 md:hover:scale-125">
                                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 md:mb-4 md:h-20 md:w-20">
                                                        <Package className="h-8 w-8 md:h-10 md:w-10" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-[#594a3a] md:text-2xl">
                                                        Safe
                                                        <br />
                                                        Storage
                                                    </h3>
                                                    <div className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-500">
                                                        Featured
                                                    </div>
                                                </div>

                                                {/* Card 3 - Right */}
                                                <div className="group relative rounded-[2rem] border-[3px] border-[#e6dcc6] bg-white p-5 text-center shadow-lg transition-transform hover:scale-105 hover:border-green-400 md:mt-12 md:rotate-[5deg] md:p-6 md:hover:rotate-0">
                                                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 md:h-16 md:w-16">
                                                        <CreditCard className="h-7 w-7 md:h-8 md:w-8" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-[#594a3a] md:text-xl">
                                                        Easy
                                                        <br />
                                                        Payment
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Button */}
                                        <div className="text-center">
                                            <Link
                                                href={route('register')}
                                                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#fbbf24] px-6 py-3 text-base font-black text-[#4a3b32] transition-transform hover:scale-110 hover:shadow-xl hover:ring-4 hover:ring-[#fcd34d]/50 md:px-10 md:py-4 md:text-xl"
                                            >
                                                <span>Start Automating</span>
                                                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45 md:h-6 md:w-6" />
                                                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                            </Link>

                                            <p className="mt-4 text-xs font-bold tracking-widest text-[#8d7f6d] uppercase md:mt-6 md:text-sm">
                                                ★ Best Choice for Universities ★
                                            </p>
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

                        <div className="relative h-0 w-0">
                            <span id="process-timeline" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>

                        <section className="relative pt-32 pb-0">
                            {/* Cute Pattern Background */}
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: 'radial-gradient(#dccfb6 2px, transparent 2px)',
                                    backgroundSize: '30px 30px',
                                }}
                            ></div>

                            <div className="container mx-auto px-6">
                                <div className="mb-24 text-center">
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-white px-6 py-2 text-sm font-bold text-pink-700 shadow-lg animate-in fade-in slide-in-from-top-4">
                                        <Sparkles className="h-4 w-4" />
                                        Process Timeline
                                    </div>
                                    <h2 className="mb-4 text-4xl font-black text-[#594a3a] animate-in fade-in slide-in-from-bottom-4 md:text-6xl">
                                        Your Parcel Journey
                                    </h2>
                                    <p className="mx-auto max-w-2xl text-lg font-medium text-[#8d7f6d] animate-in fade-in slide-in-from-bottom-4">
                                        Scroll down to follow your parcel's adventure!
                                    </p>
                                </div>

                                <div className="relative">
                                    <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2 lg:gap-24">
                                        {/* Left Column: Sticky Film Frame */}
                                        <div className="sticky top-[calc(50vh-250px)] hidden h-[500px] items-center justify-center lg:flex">
                                            {/* The Frame */}
                                            <div className="relative h-[420px] w-80 rotate-[-2deg] transform overflow-hidden rounded-[3rem] border-[16px] border-[#e6dcc6] bg-[#fffbf0] shadow-[0_40px_80px_rgba(0,0,0,0.15)] transition-all duration-500 hover:scale-105 hover:rotate-0">
                                                {/* Inner Shadow / Depth */}
                                                <div className="pointer-events-none absolute inset-0 m-2 rounded-[2.5rem] bg-[#f2eadd]"></div>

                                                {/* The Film Strip Viewport */}
                                                <div className="absolute inset-4 overflow-hidden rounded-[2.2rem] bg-white shadow-inner ring-4 ring-white">
                                                    {/* The Sliding Strip */}
                                                    <div
                                                        className="flex h-full w-full flex-col transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                                        style={{ transform: `translateY(-${activeTimelineStep * 100}%)` }}
                                                    >
                                                        {/* Scene 1: Arrival */}
                                                        <div className="flex h-full w-full flex-shrink-0 flex-col items-center justify-center bg-pink-50 p-6 text-center">
                                                            <div className="animate-bounce-slow mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-pink-200 shadow-lg">
                                                                <Package className="h-16 w-16 text-pink-600" />
                                                            </div>
                                                            <div className="text-2xl font-black text-pink-400 opacity-20">STEP 01</div>
                                                        </div>

                                                        {/* Scene 2: Alert */}
                                                        <div className="flex h-full w-full flex-shrink-0 flex-col items-center justify-center bg-purple-50 p-6 text-center">
                                                            <div className="relative mb-6">
                                                                <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75"></div>
                                                                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-purple-200 shadow-lg">
                                                                    <Bell className="h-16 w-16 text-purple-600" />
                                                                </div>
                                                                <div className="absolute top-0 right-0 h-8 w-8 rounded-full border-4 border-white bg-red-500"></div>
                                                            </div>
                                                            <div className="text-2xl font-black text-purple-400 opacity-20">STEP 02</div>
                                                        </div>

                                                        {/* Scene 3: Payment */}
                                                        <div className="flex h-full w-full flex-shrink-0 flex-col items-center justify-center bg-blue-50 p-6 text-center">
                                                            <div className="mb-6 flex h-32 w-32 rotate-3 transform items-center justify-center rounded-full bg-blue-200 shadow-lg">
                                                                <CreditCard className="h-16 w-16 text-blue-600" />
                                                            </div>
                                                            <div className="text-2xl font-black text-blue-400 opacity-20">STEP 03</div>
                                                        </div>

                                                        {/* Scene 4: Collection */}
                                                        <div className="flex h-full w-full flex-shrink-0 flex-col items-center justify-center bg-green-50 p-6 text-center">
                                                            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-green-200 shadow-lg">
                                                                <MapPin className="h-16 w-16 animate-bounce text-green-600" />
                                                            </div>
                                                            <div className="text-2xl font-black text-green-400 opacity-20">STEP 04</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Glint/Reflection */}
                                                <div className="pointer-events-none absolute top-0 right-0 h-full w-2/3 rounded-[3rem] bg-gradient-to-l from-white/20 to-transparent"></div>
                                            </div>

                                            {/* Decoration below frame */}
                                            <div className="absolute -bottom-10 -z-10 h-12 w-48 rounded-[100%] bg-black/10 blur-xl"></div>
                                        </div>

                                        {/* Right Column: Scrolling Steps */}
                                        <div className="relative">
                                            {/* Connecting Line */}
                                            <div className="absolute top-0 bottom-0 left-8 hidden w-1 rounded-full bg-gradient-to-b from-pink-200 via-purple-200 to-green-200 lg:left-[-40px] lg:block"></div>

                                            <div className="space-y-[30vh] pt-[5vh] pb-0 md:space-y-[40vh]">
                                                {/* Step 1 */}
                                                <div
                                                    className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 0 ? 'scale-100 opacity-100' : 'scale-95 opacity-40 blur-[1px]'}`}
                                                    data-step="0"
                                                >
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="relative z-10 hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-pink-100 bg-white text-2xl font-black text-pink-500 shadow-xl lg:flex">
                                                            01
                                                            {activeTimelineStep === 0 && (
                                                                <span className="absolute inset-0 animate-ping rounded-xl opacity-50 ring-2 ring-pink-400"></span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl border-2 border-pink-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-4 lg:hidden">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600">
                                                                    01
                                                                </div>
                                                                <Package className="h-6 w-6 text-pink-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Parcel Arrival</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Your parcel arrives at our secure hub. Our staff carefully scans and logs it into the
                                                                InstaStation system, creating a digital record instantly.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 2 */}
                                                <div
                                                    className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 1 ? 'scale-100 opacity-100' : 'scale-95 opacity-40 blur-[1px]'}`}
                                                    data-step="1"
                                                >
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="relative z-10 hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-purple-100 bg-white text-2xl font-black text-purple-500 shadow-xl lg:flex">
                                                            02
                                                            {activeTimelineStep === 1 && (
                                                                <span className="absolute inset-0 animate-ping rounded-xl opacity-50 ring-2 ring-purple-400"></span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl border-2 border-purple-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-4 lg:hidden">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                                                                    02
                                                                </div>
                                                                <Bell className="h-6 w-6 text-purple-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Smart Alert</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                You get a notification right away! Check your email or the student portal to see your
                                                                parcel details, photo, and collection status.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 3 */}
                                                <div
                                                    className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 2 ? 'scale-100 opacity-100' : 'scale-95 opacity-40 blur-[1px]'}`}
                                                    data-step="2"
                                                >
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="relative z-10 hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-blue-100 bg-white text-2xl font-black text-blue-500 shadow-xl lg:flex">
                                                            03
                                                            {activeTimelineStep === 2 && (
                                                                <span className="absolute inset-0 animate-ping rounded-xl opacity-50 ring-2 ring-blue-400"></span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl border-2 border-blue-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-4 lg:hidden">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                                    03
                                                                </div>
                                                                <CreditCard className="h-6 w-6 text-blue-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Easy Payment</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Need to pay a handling fee? Just upload your payment proof directly through the
                                                                dashboard. Our staff verifies it in minutes.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 4 */}
                                                <div
                                                    className={`timeline-step relative transition-all duration-700 ${activeTimelineStep === 3 ? 'scale-100 opacity-100' : 'scale-95 opacity-40 blur-[1px]'}`}
                                                    data-step="3"
                                                >
                                                    <div className="flex gap-6 md:gap-8">
                                                        <div className="relative z-10 hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-green-100 bg-white text-2xl font-black text-green-500 shadow-xl lg:flex">
                                                            04
                                                            {activeTimelineStep === 3 && (
                                                                <span className="absolute inset-0 animate-ping rounded-xl opacity-50 ring-2 ring-green-400"></span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 rounded-3xl border-2 border-green-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-4 lg:hidden">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-600">
                                                                    04
                                                                </div>
                                                                <MapPin className="h-6 w-6 text-green-500" />
                                                            </div>
                                                            <h3 className="mb-4 text-3xl font-black text-[#594a3a]">Quick Collection</h3>
                                                            <p className="text-lg leading-relaxed text-[#8d7f6d]">
                                                                Head to the counter, show your unique collection QR code, and grab your parcel.
                                                                Simple, secure, and super fast!
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
                        {/* Newsletter Section - tuned to match reference layout */}
                        <div className="relative mt-24 duration-700 animate-in fade-in slide-in-from-left-8" style={{ animationDelay: '100ms' }}>
                            <div className="mx-auto max-w-5xl">
                                <div className="relative overflow-hidden rounded-[42px] border-4 border-[#FCE1B8] bg-[#FFF7E6] px-6 py-8 shadow-[0_26px_80px_rgba(248,181,212,0.6)] sm:px-8 sm:py-10 md:px-12 md:py-12">
                                    {/* Top tab */}
                                    <div className="absolute -top-4 left-1/2 h-8 w-40 -translate-x-1/2 rounded-b-2xl bg-[#FDE68A] shadow-md"></div>

                                    {/* Header area */}
                                    <div className="relative mb-10 text-center md:mb-12">
                                        <div className="mb-6 inline-flex -rotate-1 items-center gap-2 rounded-2xl border-2 border-[#FCD34D] bg-[#FDE68A] px-6 py-2.5 shadow-sm">
                                            <Sparkles className="h-5 w-5 text-[#B45309]" />
                                            <span className="font-black tracking-wide text-[#92400E]">Newsletter!</span>
                                        </div>

                                        <h2 className="relative z-10 text-3xl font-black text-[#1E293B] sm:text-4xl md:text-6xl">
                                            Campus{' '}
                                            <span className="relative inline-block text-[#FB7185]">
                                                Dispatch
                                                <svg
                                                    className="absolute -bottom-2 left-0 -z-10 h-3 w-full text-[#FDE047] md:-bottom-3 md:h-5"
                                                    viewBox="0 0 100 10"
                                                    preserveAspectRatio="none"
                                                >
                                                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="12" fill="none" opacity="0.9" />
                                                </svg>
                                            </span>
                                        </h2>

                                        <p className="mt-4 text-sm font-bold tracking-widest text-[#94A3B8] uppercase md:text-base">
                                            | Daily News | Cultural Express | Otter Knowledge |
                                        </p>

                                        {announcementsSorted.length > displayedAnnouncements.length && (
                                            <div className="mt-8 flex justify-center md:justify-end">
                                                <button
                                                    onClick={() => setVisibleCount((c) => Math.min(c + 4, announcementsSorted.length))}
                                                    className="group inline-flex items-center gap-2 rounded-full bg-[#E0F2FE] px-8 py-3 text-xs font-black tracking-widest text-[#0EA5E9] uppercase transition-all hover:-translate-y-1 hover:bg-[#BAE6FD]"
                                                >
                                                    View More <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {announcements.length === 0 ? (
                                        <div className="rounded-[32px] border-2 border-dashed border-[#E2E8F0] bg-white p-16 text-center">
                                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F1F5F9]">
                                                <Bell className="h-10 w-10 text-[#CBD5E1]" />
                                            </div>
                                            <p className="text-xl font-bold text-[#94A3B8]">No announcements yet.</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                                            {/* Featured Card - large left panel */}
                                            {featuredAnnouncement && (
                                                <div
                                                    className="group relative w-full cursor-pointer rounded-[32px] bg-[#FFF9FB] p-4 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.06)] sm:p-5 md:p-7 lg:w-[60%]"
                                                    onClick={() => setSelectedAnnouncement(featuredAnnouncement)}
                                                >
                                                    <div className="relative overflow-hidden rounded-[28px] border-[4px] border-[#FFE1EB] bg-white p-4 md:p-6">
                                                        {featuredAnnouncement.announcement_image && (
                                                            <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-[22px] border-2 border-[#FFE4ED] shadow-inner md:aspect-[4/3]">
                                                                <img
                                                                    src={`/storage/${featuredAnnouncement.announcement_image}`}
                                                                    alt="announcement"
                                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="mb-3 flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-rose-600 uppercase">
                                                                <Package className="h-2.5 w-2.5" />
                                                                Featured
                                                            </span>
                                                            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                            <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                                                                {formatDate(featuredAnnouncement.publish_date || featuredAnnouncement.created_at)}
                                                            </span>
                                                        </div>

                                                        <h3 className="mb-4 line-clamp-2 text-xl leading-tight font-black text-gray-800 transition-colors group-hover:text-pink-500 md:text-2xl">
                                                            {featuredAnnouncement.announcement_title}
                                                        </h3>

                                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                                            <span className="text-xs font-bold text-gray-400 transition-colors group-hover:text-gray-500">
                                                                Tap to read more...
                                                            </span>
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF9E9E] text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-45 group-hover:bg-[#FB7185]">
                                                                <ArrowUpRight className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Secondary list - compact right column */}
                                            <div className="w-full rounded-[28px] bg-white/70 p-4 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)] backdrop-blur-sm lg:w-[40%]">
                                                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Latest Updates
                                                </div>
                                                <div className="space-y-3">
                                                    {secondaryAnnouncements.length === 0 && featuredAnnouncement && (
                                                        <div
                                                            className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#E5ECF5]"
                                                            onClick={() => setSelectedAnnouncement(featuredAnnouncement)}
                                                        >
                                                            {featuredAnnouncement.announcement_image ? (
                                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100">
                                                                    <img
                                                                        src={`/storage/${featuredAnnouncement.announcement_image}`}
                                                                        alt="announcement"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                                                                    <Package className="h-4 w-4 text-gray-300" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="mb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                                                                    {formatDate(featuredAnnouncement.publish_date || featuredAnnouncement.created_at)}
                                                                </p>
                                                                <p className="line-clamp-2 text-xs font-semibold text-gray-900">
                                                                    {featuredAnnouncement.announcement_title}
                                                                </p>
                                                            </div>
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-gray-400 ring-1 ring-gray-200 group-hover:bg-pink-100 group-hover:text-pink-500">
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {secondaryAnnouncements.map((a: AnnouncementCard, index: number) => (
                                                        <div
                                                            key={a.announcement_id}
                                                            className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#E5ECF5] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                                            style={{ animationDelay: `${(index + 1) * 80}ms` }}
                                                            onClick={() => setSelectedAnnouncement(a)}
                                                        >
                                                            {a.announcement_image ? (
                                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 md:h-14 md:w-14">
                                                                    <img
                                                                        src={`/storage/${a.announcement_image}`}
                                                                        alt="announcement"
                                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 md:h-14 md:w-14">
                                                                    <Package className="h-4 w-4 text-gray-300" />
                                                                </div>
                                                            )}

                                                            <div className="min-w-0 flex-1">
                                                                <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(a.publish_date || a.created_at)}
                                                                </p>
                                                                <p className="line-clamp-1 text-xs font-semibold text-gray-900 group-hover:text-pink-500">
                                                                    {a.announcement_title}
                                                                </p>
                                                                <p className="line-clamp-1 text-[10px] font-medium text-gray-400">
                                                                    {a.announcement_content}
                                                                </p>
                                                            </div>

                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-gray-400 ring-1 ring-gray-200 transition-all duration-300 group-hover:bg-pink-100 group-hover:text-pink-500">
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer - Clean Modern Design */}
            <footer className="relative overflow-hidden bg-gradient-to-br from-[#f7d8ff] via-[#fee5d3] to-[#d3e7ff] py-16 duration-1000 animate-in fade-in slide-in-from-bottom-8">
                <div className="relative z-10 mx-auto max-w-7xl px-6">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Brand Column */}
                        <div className="lg:col-span-1">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl">
                                    <img src="/images/parcel-logo.png" alt="InstaStation" className="relative z-10 mx-auto w-70" />
                                </div>
                            </div>
                            <p className="max-w-md text-lg leading-relaxed text-gray-700">
                                The smart way to track and manage campus deliveries. Get notified instantly when your parcels arrive and collect them
                                hassle-free.
                            </p>
                            <br />
                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700">
                                    <Package className="h-3.5 w-3.5" />
                                    Smart Tracking
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-pink-700">
                                    <Bell className="h-3.5 w-3.5" />
                                    Instant Alerts
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Live Updates
                                </div>
                            </div>
                        </div>

                        {/* Quick Links Card */}
                        <div className="lg:col-span-1">
                            <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-pink-500" />
                                    <h4 className="text-base font-bold text-gray-800">Quick Links</h4>
                                </div>
                                <ul className="space-y-2.5">
                                    <li>
                                        <a href="#about" className="text-sm text-gray-700 transition-colors hover:text-pink-600">
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#how-it-works" className="text-sm text-gray-700 transition-colors hover:text-pink-600">
                                            How It Works
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#process-timeline" className="text-sm text-gray-700 transition-colors hover:text-pink-600">
                                            Process Timeline
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#newsletter" className="text-sm text-gray-700 transition-colors hover:text-pink-600">
                                            Newsletter
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Get in Touch Card */}
                        <div id="contact" className="lg:col-span-1">
                            <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-pink-500" />
                                    <h4 className="text-base font-bold text-gray-800">Get in Touch</h4>
                                </div>

                                {/* Email */}
                                <div className="mb-6 rounded-2xl bg-pink-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-pink-200">
                                            <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">Email</p>
                                            <a
                                                href="mailto:support@instastation.edu"
                                                className="text-sm font-semibold text-gray-800 hover:text-pink-600"
                                            >
                                                support@instastation.edu
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Legal */}
                                <div>
                                    <h5 className="mb-3 text-xs font-bold tracking-wider text-gray-600 uppercase">Legal</h5>
                                    <ul className="space-y-2">
                                        <li>
                                            <a href="#" className="text-sm text-gray-600 transition-colors hover:text-pink-600">
                                                Privacy Policy
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="text-sm text-gray-600 transition-colors hover:text-purple-600">
                                                Terms of Service
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-12 border-t border-gray-300/50 pt-8 text-center">
                        <p className="text-sm text-gray-600">
                            © {new Date().getFullYear()} <span className="font-bold text-gray-800">InstaStation</span>. All rights reserved. |
                            Universiti Malaysia Pahang Al-Sultan Abdullah
                        </p>
                    </div>
                </div>
            </footer>

            {/* Announcement Detail Modal - Reference Match */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)} />

                    {/* Wrapper */}
                    <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl translate-y-8 flex-col duration-500 animate-in slide-in-from-bottom-8 zoom-in-95">
                        {/* Hanging String */}
                        <div className="pointer-events-none absolute -top-24 left-1/2 z-0 h-24 w-60 -translate-x-1/2">
                            <svg width="100%" height="100%" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M120 10L40 95" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
                                <path d="M120 10L200 95" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="120" cy="10" r="6" fill="#9CA3AF" />
                                <circle cx="120" cy="10" r="2" fill="#E5E7EB" />
                            </svg>
                        </div>

                        {/* Main Board */}
                        <div className="relative z-10 flex flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-[#DED6CA] bg-[#EBE6DE] shadow-2xl">
                            {/* Corner Accents */}
                            <div className="pointer-events-none absolute top-4 left-4 h-6 w-6 rounded-tl-2xl border-t-[3px] border-l-[3px] border-[#CDC3B3]"></div>
                            <div className="pointer-events-none absolute top-4 right-4 h-6 w-6 rounded-tr-2xl border-t-[3px] border-r-[3px] border-[#CDC3B3]"></div>
                            <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl-2xl border-b-[3px] border-l-[3px] border-[#CDC3B3]"></div>
                            <div className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 rounded-br-2xl border-r-[3px] border-b-[3px] border-[#CDC3B3]"></div>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#DAD3C7] text-[#9CA3AF] transition-colors hover:bg-[#CDC3B3] hover:text-white"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            {/* Inner Content Paper */}
                            <div className="custom-scrollbar m-3 flex flex-col overflow-y-auto rounded-[2rem] bg-white px-6 py-8 shadow-inner sm:m-4 sm:px-8 sm:py-10">
                                {/* Header Badge */}
                                <div className="mb-6 flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-[#88AB75] opacity-40 blur-md"></div>
                                        <span className="relative inline-block -rotate-1 transform rounded-full bg-[#88AB75] px-8 py-1.5 text-xs font-black tracking-[0.2em] text-white uppercase shadow-sm">
                                            ANNOUNCEMENT
                                        </span>
                                    </div>
                                </div>

                                {/* Image */}
                                {selectedAnnouncement.announcement_image && (
                                    <div className="mb-6 w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <img
                                            src={`/storage/${selectedAnnouncement.announcement_image}`}
                                            alt="announcement"
                                            className="h-auto w-full object-contain"
                                        />
                                    </div>
                                )}

                                {/* Title */}
                                <h2 className="mb-4 text-center text-2xl leading-tight font-black break-words text-[#594A3A] sm:text-3xl">
                                    {selectedAnnouncement.announcement_title}
                                </h2>

                                {/* Metadata */}
                                <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold tracking-wider uppercase">
                                    <span className="-rotate-1 transform rounded-sm bg-[#FDF6C9] px-2 py-0.5 text-[#8D7F6D]">
                                        {formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}
                                    </span>
                                    <span className="text-[#D1D5DB]">•</span>
                                    <span className="rotate-1 transform rounded-sm bg-[#FCE4D6] px-2 py-0.5 text-[#8D7F6D]">UMPSA Postal Hub</span>
                                </div>

                                {/* Body */}
                                <div className="prose prose-sm w-full max-w-none text-left leading-relaxed font-medium break-words whitespace-pre-wrap text-[#8D7F6D]">
                                    {selectedAnnouncement.announcement_content}
                                </div>

                                {/* Footer */}
                                <div className="mt-8 flex items-center justify-center gap-1.5 text-center text-[10px] font-bold text-[#CDC3B3]">
                                    Always welcome to visit us! <span className="text-sm opacity-70 grayscale">🦦</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollbar Styles */}
                    <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #D1D5DB; }
                        `}</style>
                </div>
            )}
        </>
    );
}
