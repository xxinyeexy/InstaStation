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
                <link href="https://fonts.bunny.net/css?family=nunito:400,600,800,900" rel="stylesheet" />
            </Head>
            <div className="relative min-h-screen overflow-hidden bg-[#FFF0F5] font-['Nunito']">
                <span id="about" className="absolute top-0 h-0 w-0 opacity-0"></span>
                {/* Animated background blobs - Softer and Rounder */}
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-pink-200 opacity-40 blur-[100px]"></div>
                <div
                    className="absolute -bottom-40 -left-40 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-200 opacity-40 blur-[100px]"
                    style={{ animationDelay: '2s' }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-purple-200 opacity-30 blur-[120px]"
                    style={{ animationDelay: '4s' }}
                ></div>

                <div className="relative z-10 p-6">
                    {/* Header - Slide down from top */}
                    <header className="mb-20 flex justify-end gap-4 duration-700 animate-in fade-in slide-in-from-top-4">
                        <nav className="flex items-center justify-end gap-4">
                            {auth.user ? (
                                <Link
                                    href={auth.user.type === 'staff' ? route('staff.dashboard') : route('student.parcel')}
                                    className="group relative overflow-hidden rounded-full bg-gray-900 px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95"
                                >
                                    <span className="relative z-10">Dashboard</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-full bg-white px-6 py-3 font-bold text-gray-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-lg active:scale-95"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-full bg-gray-900 px-8 py-3 font-bold text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-black hover:shadow-2xl active:scale-95"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Main Content */}
                    <div className="mx-auto max-w-5xl text-center">
                        {/* Badge - Plump and Bouncy */}
                        <div
                            className="mb-10 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 shadow-[0_10px_40px_-10px_rgba(255,182,193,0.5)] ring-4 ring-pink-100 transition-transform duration-300 hover:scale-105 duration-700 animate-in fade-in slide-in-from-top-4"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-base font-black tracking-wide text-transparent">
                                Instant Parcel Tracking Dashboard
                            </span>
                        </div>

                        {/* Logo and Title - Scale up and fade in */}
                        <div className="mb-10 duration-700 animate-in fade-in zoom-in-95" style={{ animationDelay: '200ms' }}>
                            <h1 className="relative mb-6">
                                <span className="block">
                                    <span className="relative inline-block bg-gradient-to-r from-[#FF69B4] via-purple-500 to-[#FF69B4] bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-sm md:text-8xl">
                                        Insta
                                        <span className="relative">
                                            <span className="relative z-10 bg-gradient-to-r from-gray-900 via-green-400 to-green-600 bg-clip-text text-transparent">
                                                Station
                                            </span>
                                            {/* Squiggly underline decoration */}
                                            <svg className="absolute -bottom-4 left-0 w-full animate-pulse" height="12" viewBox="0 0 200 12" fill="none">
                                                <path
                                                    d="M2 9.5C50 3.5 100 3.5 198 9.5"
                                                    stroke="#FF69B4"
                                                    strokeWidth="6"
                                                    strokeLinecap="round"
                                                    className="opacity-40"
                                                />
                                                <path
                                                    d="M2 9.5C50 3.5 100 3.5 198 9.5"
                                                    stroke="url(#gradient)"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    </span>
                                </span>
                            </h1>
                        </div>

                        {/* Animated Text - Fade in and slide from bottom */}
                        <div
                            className="flex items-center justify-center gap-2 text-3xl font-black duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-5xl"
                            style={{ animationDelay: '300ms' }}
                        >
                            <span className="text-gray-800">The</span>
                            <div className="relative inline-block h-14 w-48 overflow-hidden rounded-full bg-white px-4 shadow-sm ring-2 ring-gray-100">
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
                                        <span className="bg-gradient-to-r from-pink-500 to-green-500 bg-clip-text text-transparent">{word}</span>
                                    </div>
                                ))}
                            </div>
                            <span className="text-gray-800">Way</span>
                        </div>

                        {/* Subtitle - Fade in */}
                        <p
                            className="mt-4 flex items-center justify-center gap-2 text-xl font-bold text-gray-500 duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-2xl"
                            style={{ animationDelay: '400ms' }}
                        >
                            to Track Campus Deliveries
                        </p>

                        {/* Description - Fade in and slide from bottom */}
                        <div className="mb-16 mt-8 duration-1000 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '500ms' }}>
                            <p className="mx-auto max-w-3xl text-xl font-medium leading-relaxed text-gray-600">
                                Streamline parcel management for your <span className="rounded-lg bg-pink-100 px-2 py-1 font-bold text-pink-700">university</span> with{' '}
                                <span className="rounded-lg bg-purple-100 px-2 py-1 font-bold text-purple-700">smart matching</span>
                                ,{' '}
                                <span className="rounded-lg bg-green-100 px-2 py-1 font-bold text-green-700">secure payments</span>
                                , and real-time tracking.
                            </p>
                        </div>

                        {/* Check for Unclaimed Parcels Button - Scale in */}
                        <div className="mb-20 duration-700 animate-in fade-in zoom-in-95" style={{ animationDelay: '600ms' }}>
                            <Link
                                href={route('public.unclaimed')}
                                className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full border-4 border-green-200 bg-white px-10 py-5 text-lg font-black text-green-700 shadow-[0_20px_50px_-12px_rgba(22,163,74,0.25)] transition-all duration-300 hover:scale-110 hover:border-green-300 hover:shadow-[0_20px_60px_-12px_rgba(22,163,74,0.4)] active:scale-95"
                            >
                                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                                    <Package className="h-6 w-6" />
                                </div>
                                <span className="relative z-10">Check Unclaimed Parcels</span>
                                <div className="absolute inset-0 bg-green-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                            </Link>
                        </div>

                        {/* Stats Section with Animation */}
                        <section className="my-24 duration-1000 animate-in fade-in zoom-in-95" style={{ animationDelay: '700ms' }}>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white bg-[#FFF0F5] p-10 text-center shadow-xl transition-all duration-500 hover:-translate-y-2 hover:rotate-2 hover:shadow-2xl hover:shadow-pink-200">
                                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                        <Package className="h-12 w-12 text-pink-500" />
                                    </div>
                                    <h3 className="mb-2 text-5xl font-black text-gray-800 md:text-6xl">
                                        1000+
                                    </h3>
                                    <p className="text-lg font-bold text-gray-500">Parcels Delivered</p>
                                </div>

                                <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white bg-[#F3E8FF] p-10 text-center shadow-xl transition-all duration-500 hover:-translate-y-2 hover:-rotate-1 hover:shadow-2xl hover:shadow-purple-200">
                                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                                        <svg className="h-12 w-12 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 text-5xl font-black text-gray-800 md:text-6xl">
                                        500+
                                    </h3>
                                    <p className="text-lg font-bold text-gray-500">Active Students</p>
                                </div>

                                <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white bg-[#ECFDF5] p-10 text-center shadow-xl transition-all duration-500 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl hover:shadow-green-200">
                                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                        <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 text-5xl font-black text-gray-800 md:text-6xl">
                                        99%
                                    </h3>
                                    <p className="text-lg font-bold text-gray-500">Success Rate</p>
                                </div>
                            </div>
                        </section>

                        {/* Interactive Demo Section - Plump Design */}
                        <div className="relative">
                            <span id="how-it-works" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                            <section
                                className="my-24 duration-1000 animate-in fade-in slide-in-from-left-8"
                                style={{ animationDelay: '800ms' }}
                            >
                                <div className="border-gradient-to-br relative overflow-hidden rounded-[3rem] border-8 border-white bg-white p-12 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.15)] md:p-16">
                                    {/* Animated background elements */}
                                    <div
                                        className="absolute -top-20 -left-20 h-64 w-64 animate-spin rounded-full bg-pink-100 opacity-50 blur-3xl"
                                        style={{ animationDuration: '20s' }}
                                    ></div>
                                    <div
                                        className="absolute -right-20 -bottom-20 h-64 w-64 animate-spin rounded-full bg-blue-100 opacity-50 blur-3xl"
                                        style={{ animationDuration: '15s', animationDirection: 'reverse' }}
                                    ></div>

                                    <div className="relative grid gap-12 lg:grid-cols-2">
                                        <div className="space-y-8">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-6 py-3">
                                                <Zap className="h-5 w-5 text-pink-600" />
                                                <span className="text-sm font-black uppercase tracking-wide text-pink-700">How It Works</span>
                                            </div>
                                            <h2 className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-4xl font-black text-transparent md:text-6xl">
                                                Seamless Parcel Management
                                            </h2>
                                            <p className="text-xl font-medium leading-relaxed text-gray-500">
                                                Our intelligent system automates every step of the parcel handling process, from arrival notification to
                                                secure collection.
                                            </p>

                                            {/* Feature list with icons - Bouncy Cards */}
                                            <div className="space-y-6">
                                                <div className="group flex items-start gap-6 rounded-[2rem] border-4 border-white bg-[#FFF7ED] p-6 shadow-lg transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl">
                                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.2rem] bg-orange-500 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-12">
                                                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-800">Instant Notifications</h4>
                                                        <p className="font-medium text-gray-500">Get real-time alerts when your parcel arrives</p>
                                                    </div>
                                                </div>

                                                <div className="group flex items-start gap-6 rounded-[2rem] border-4 border-white bg-[#EFF6FF] p-6 shadow-lg transition-all hover:-translate-y-1 hover:-rotate-1 hover:shadow-xl">
                                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.2rem] bg-blue-500 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-12">
                                                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-800">Secure Storage</h4>
                                                        <p className="font-medium text-gray-500">Your parcels are safely stored until collection</p>
                                                    </div>
                                                </div>

                                                <div className="group flex items-start gap-6 rounded-[2rem] border-4 border-white bg-[#F0FDF4] p-6 shadow-lg transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl">
                                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.2rem] bg-green-500 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-12">
                                                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-800">Easy Payment</h4>
                                                        <p className="font-medium text-gray-500">Quick and secure payment processing</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Animated Phone Mockup - Rounded */}
                                        <div className="relative flex items-center justify-center">
                                            <div className="relative">
                                                <div
                                                    className="absolute inset-0 animate-ping rounded-[3rem] bg-pink-200 opacity-40"
                                                    style={{ animationDuration: '3s' }}
                                                ></div>

                                                <div className="relative rounded-[3rem] border-8 border-gray-900 bg-white p-4 shadow-2xl">
                                                    <div className="overflow-hidden rounded-[2rem] bg-[#F5F3FF]">
                                                        <div className="space-y-4 p-6">
                                                            <div
                                                                className="animate-slide-down rounded-[1.5rem] bg-white p-5 shadow-sm transition-transform hover:scale-105"
                                                                style={{ animationDelay: '0s' }}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                                                                        <Package className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-gray-800">Parcel Arrived!</p>
                                                                        <p className="text-xs font-semibold text-gray-400">PCL2025110001</p>
                                                                    </div>
                                                                    <div className="h-3 w-3 animate-pulse rounded-full bg-pink-500"></div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="animate-slide-down rounded-[1.5rem] bg-white p-5 shadow-sm transition-transform hover:scale-105"
                                                                style={{ animationDelay: '0.3s' }}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                                                                        <CreditCard className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-gray-800">Payment Verified</p>
                                                                        <p className="text-xs font-semibold text-gray-400">Ready for pickup</p>
                                                                    </div>
                                                                    <div className="h-5 w-5 rounded-full bg-green-100 p-1 text-green-600">
                                                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="animate-slide-down rounded-[1.5rem] bg-white p-5 shadow-sm transition-transform hover:scale-105"
                                                                style={{ animationDelay: '0.6s' }}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                                                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-gray-800">QR Code Ready</p>
                                                                        <p className="text-xs font-semibold text-gray-400">Scan to collect</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Feature Cards - Staggered fade in from bottom */}
                        <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {/* User Management */}
                            <div
                                className="group relative overflow-hidden rounded-[2.5rem] bg-[#F5F3FF] p-8 shadow-lg transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl"
                                style={{ animationDelay: '100ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-purple-200 opacity-50 blur-2xl group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-purple-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="mb-3 text-xl font-black text-gray-800">User Management</h3>
                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                        Automate name matching and profile management
                                    </p>
                                </div>
                            </div>

                            {/* Payment Processing */}
                            <div
                                className="group relative overflow-hidden rounded-[2.5rem] bg-[#ECFDF5] p-8 shadow-lg transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-2 hover:-rotate-1 hover:shadow-2xl"
                                style={{ animationDelay: '200ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-green-200 opacity-50 blur-2xl group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-green-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                                        <CreditCard className="h-8 w-8" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-black text-gray-800">Payment Processing</h3>
                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                        Secure payment handling with proof upload
                                    </p>
                                </div>
                            </div>

                            {/* Smart Notifications */}
                            <div
                                className="group relative overflow-hidden rounded-[2.5rem] bg-[#FFF7ED] p-8 shadow-lg transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl"
                                style={{ animationDelay: '300ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-orange-200 opacity-50 blur-2xl group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-orange-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                        <Bell className="h-8 w-8" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-black text-gray-800">Smart Notifications</h3>
                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                        Automated reminders for collection and payments
                                    </p>
                                </div>
                            </div>

                            {/* Parcel Tracking */}
                            <div
                                className="group relative overflow-hidden rounded-[2.5rem] bg-[#EFF6FF] p-8 shadow-lg transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-2 hover:-rotate-1 hover:shadow-2xl"
                                style={{ animationDelay: '400ms' }}
                            >
                                <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-blue-200 opacity-50 blur-2xl group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-blue-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                                        <MapPin className="h-8 w-8" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-black text-gray-800">Parcel Tracking</h3>
                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                        Real-time tracking from arrival to collection
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* How It Works Section - Redesigned with Timeline */}
                        <div className="relative h-0 w-0">
                            <span id="process-timeline" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>
                        <div
                            className="relative mt-32 overflow-hidden rounded-[3rem] border-8 border-white bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-12 shadow-[0_40px_100px_-20px_rgba(236,72,153,0.2)] duration-1000 animate-in fade-in zoom-in-95"
                            style={{ animationDelay: '100ms' }}
                        >

                            <div className="relative">
                                <div
                                    className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 shadow-lg duration-700 animate-in fade-in slide-in-from-top-4"
                                    style={{ animationDelay: '200ms' }}
                                >
                                    <Sparkles className="h-5 w-5 text-pink-500" />
                                    <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-base font-black text-transparent">Process Timeline</span>
                                </div>
                                <h2
                                    className="mb-6 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-500 bg-clip-text text-4xl font-black text-transparent duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-6xl"
                                    style={{ animationDelay: '300ms' }}
                                >
                                    Your Parcel Journey
                                </h2>
                                <p
                                    className="mx-auto mb-20 max-w-2xl text-xl font-medium text-gray-500 duration-700 animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: '400ms' }}
                                >
                                    From arrival to collection in 4 simple steps
                                </p>

                                {/* Timeline Layout */}
                                <div className="relative">
                                    {/* Connecting Line - Vertical on mobile, Horizontal on desktop */}
                                    <div className="absolute top-0 left-1/2 h-full w-4 -translate-x-1/2 rounded-full bg-white shadow-inner lg:top-12 lg:right-[10%] lg:left-[10%] lg:h-4 lg:w-auto lg:translate-x-0"></div>

                                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-4 lg:gap-8">
                                        {/* Step 1 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '500ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-8">
                                                    {/* Pulsing ring */}
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-pink-300 opacity-40"
                                                        style={{ animationDuration: '2s' }}
                                                    ></div>

                                                    {/* Main circle */}
                                                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-white bg-pink-500 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 hover:shadow-pink-300">
                                                        <Package className="h-14 w-14 text-white" />
                                                        <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-black text-pink-500 shadow-xl">
                                                            01
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-[2rem] border-4 border-white bg-white/60 p-6 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-1">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-800">Parcel Arrival</h3>
                                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                                        Your parcel is received and securely logged into our system
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '700ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-8">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-purple-300 opacity-40"
                                                        style={{ animationDuration: '2s', animationDelay: '0.3s' }}
                                                    ></div>

                                                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-white bg-purple-500 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 hover:shadow-purple-300">
                                                        <Bell className="h-14 w-14 text-white" />
                                                        <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-black text-purple-500 shadow-xl">
                                                            02
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-[2rem] border-4 border-white bg-white/60 p-6 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-1">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-800">Smart Alert</h3>
                                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                                        Get instant notifications via email and in-app alerts
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '900ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-8">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-blue-300 opacity-40"
                                                        style={{ animationDuration: '2s', animationDelay: '0.6s' }}
                                                    ></div>

                                                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-white bg-blue-500 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 hover:shadow-blue-300">
                                                        <CreditCard className="h-14 w-14 text-white" />
                                                        <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-black text-blue-500 shadow-xl">
                                                            03
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-[2rem] border-4 border-white bg-white/60 p-6 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-1">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-800">Easy Payment</h3>
                                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                                        Upload payment proof and get quick verification
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '1100ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-8">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-green-300 opacity-40"
                                                        style={{ animationDuration: '2s', animationDelay: '0.9s' }}
                                                    ></div>

                                                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-white bg-green-500 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 hover:shadow-green-300">
                                                        <svg className="h-14 w-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                                            />
                                                        </svg>
                                                        <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-black text-green-500 shadow-xl">
                                                            04
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-[2rem] border-4 border-white bg-white/60 p-6 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-1">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-800">Quick Collection</h3>
                                                    <p className="text-sm font-semibold leading-relaxed text-gray-500">
                                                        Show QR code and collect your parcel hassle-free
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Newsletter Section - Curated Studio */}
                        <div className="relative h-0 w-0">
                            <span id="newsletter" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>
                        <div
                            className="relative mt-20 duration-700 animate-in fade-in slide-in-from-left-8"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="relative overflow-hidden rounded-[3rem] border border-white/70 bg-white/80 p-10 shadow-[0_30px_120px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                                <div className="pointer-events-none absolute inset-0">
                                    <div className="absolute top-[-40px] -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-pink-200/40 via-purple-200/30 to-blue-200/40 blur-[120px]"></div>
                                    <div className="absolute bottom-[-50px] -left-12 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-200/40 via-cyan-200/30 to-pink-200/40 blur-[110px]"></div>
                                </div>
                                <div className="relative mb-10 flex flex-wrap justify-between">
                                    <div>
                                        <p className="mb-6 ml-10 inline-flex gap-2 rounded-full border-2 border-pink-300 bg-rose-50 px-6 py-2 text-sm font-bold text-pink-700 shadow-lg duration-700 animate-in fade-in slide-in-from-top-4">
                                            <Sparkles className="h-3.5 w-3.5 text-rose-500" /> Curated
                                        </p>
                                        <h2 className="mb-4 text-left text-3xl font-black text-slate-900 md:text-4xl">Campus Dispatch</h2>
                                        <p className="text-left text-sm text-slate-500">
                                            Hand-picked announcements and service notices from our postal studio.
                                        </p>
                                    </div>
                                    {announcementsSorted.length > displayedAnnouncements.length && (
                                        <button
                                            onClick={() => setVisibleCount((c) => Math.min(c + 4, announcementsSorted.length))}
                                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                                        >
                                            View more <ArrowUpRight className="h-4 w-4" />
                                        </button>
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
                                    <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
                                        {featuredAnnouncement && (
                                            <div
                                                className="group relative cursor-pointer overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-[#ffe4f1] via-white to-[#e4fbff] p-1 shadow-[0_25px_90px_rgba(236,72,153,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_110px_rgba(236,72,153,0.4)]"
                                                onClick={() => setSelectedAnnouncement(featuredAnnouncement)}
                                            >
                                                <div className="rounded-[30px] bg-white/80 p-8 backdrop-blur">
                                                    {featuredAnnouncement.announcement_image && (
                                                        <div className="relative mb-6 h-64 overflow-hidden rounded-[24px]">
                                                            <img
                                                                src={`/storage/${featuredAnnouncement.announcement_image}`}
                                                                alt="announcement"
                                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>

                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs tracking-[0.2em] text-slate-400 uppercase">
                                                        <span className="inline-flex items-center gap-2 rounded-2xl bg-rose-100 px-3 py-1 font-semibold text-rose-500 shadow-inner">
                                                            {' '}
                                                            <img
                                                                src="/images/parcel-logo.png"
                                                                alt="InstaStation"
                                                                className="relative z-10 mx-auto w-10"
                                                            />
                                                        </span>
                                                        <span className="h-px w-6 bg-rose-200"></span>
                                                        <span>
                                                            {formatDate(featuredAnnouncement.publish_date || featuredAnnouncement.created_at)}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-4 text-xl font-black text-slate-900">
                                                        {featuredAnnouncement.announcement_title}
                                                    </h3>
                                                    {/* <p className="mt-3 text-base text-slate-600 line-clamp-3">{featuredAnnouncement.announcement_content}</p> */}
                                                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-500">
                                                        Dive deeper <ArrowUpRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative grid gap-6">
                                            <div className="absolute top-0 left-5 h-full w-px bg-gradient-to-b from-rose-200 via-purple-100 to-transparent md:left-6"></div>
                                            {/* {secondaryAnnouncements.length === 0 && featuredAnnouncement && (
                                                <div
                                                    className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-md backdrop-blur"
                                                    onClick={() => setSelectedAnnouncement(featuredAnnouncement)}
                                                >
                                                    <p className="text-sm text-gray-500">All caught up! Tap the featured story to read more.</p>
                                                </div>
                                            )} */}

                                            {secondaryAnnouncements.map((a: AnnouncementCard, index: number) => (
                                                <div
                                                    key={a.announcement_id}
                                                    className="group relative flex cursor-pointer gap-5 rounded-[26px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(15,23,42,0.12)]"
                                                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                                                    onClick={() => setSelectedAnnouncement(a)}
                                                >
                                                    <span className="absolute top-8 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-2 ring-rose-100 md:left-5">
                                                        <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                                                    </span>
                                                    {a.announcement_image && (
                                                        <div className="relative h-28 w-28 overflow-hidden rounded-2xl">
                                                            <img
                                                                src={`/storage/${a.announcement_image}`}
                                                                alt="announcement"
                                                                className="h-full w-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 border border-white/40"></div>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-1 flex-col">
                                                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                                                            <span className="text-rose-500">Postal Hub</span>
                                                            <span className="h-0.5 w-4 bg-slate-200"></span>
                                                            <span>{formatDate(a.publish_date || a.created_at)}</span>
                                                        </div>
                                                        <h4 className="mt-2 text-xl font-bold text-slate-900">{a.announcement_title}</h4>
                                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.announcement_content}</p>
                                                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                            Read update <ArrowUpRight className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer - Premium Professional Design */}
            <footer className="relative overflow-hidden bg-gradient-to-r from-[#f7d8ff] via-[#fee5d3] to-[#d3e7ff] duration-1000 animate-in fade-in slide-in-from-bottom-8">
                {/* Animated background decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 blur-3xl delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-lime-500/10 blur-3xl delay-500"></div>
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

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
            </footer>

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center duration-300 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)} />
                    <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.2)] duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
                        <div className="relative overflow-hidden bg-gradient-to-r from-pink-400 to-green-400 p-6 text-white">
                            <div className="absolute inset-0 opacity-40">
                                <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
                                <div className="absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-green-200/30 blur-3xl"></div>
                            </div>
                            <div className="relative flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex-1 px-4 text-center">
                                    <p className="text-xs font-semibold tracking-[0.3em] text-white/80 uppercase">Announcement</p>
                                    <h2 className="text-xl font-bold">{selectedAnnouncement.announcement_title}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 p-6">
                            {selectedAnnouncement.announcement_image && (
                                <div className="overflow-hidden rounded-2xl border border-pink-50">
                                    <img
                                        src={`/storage/${selectedAnnouncement.announcement_image}`}
                                        alt="announcement"
                                        className="h-64 w-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner">
                                        <img src="/images/parcel-logo.png" alt="InstaStation" className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">Publisher</p>
                                        <p className="text-base font-semibold text-gray-800">UMPSA Postal Hub</p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-600 shadow">
                                    <Calendar className="h-4 w-4 text-pink-500" />
                                    {formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-700">{selectedAnnouncement.announcement_content}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

