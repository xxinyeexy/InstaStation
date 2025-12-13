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

                        {/* Interactive Demo Section */}
                        <div className="relative">
                            <span id="how-it-works" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                            <section
                                className="my-20 duration-1000 animate-in fade-in slide-in-from-left-8"
                                style={{ animationDelay: '800ms' }}
                            >
                                <div className="border-gradient-to-br relative overflow-hidden rounded-3xl border-2 bg-white from-pink-200 to-purple-200 p-12 shadow-2xl">
                                    {/* Animated background elements */}
                                    <div
                                        className="absolute -top-20 -left-20 h-40 w-40 animate-spin rounded-full bg-gradient-to-r from-pink-200 to-purple-200 opacity-30 blur-3xl"
                                        style={{ animationDuration: '20s' }}
                                    ></div>
                                    <div
                                        className="absolute -right-20 -bottom-20 h-40 w-40 animate-spin rounded-full bg-gradient-to-r from-blue-200 to-cyan-200 opacity-30 blur-3xl"
                                        style={{ animationDuration: '15s', animationDirection: 'reverse' }}
                                    ></div>

                                    <div className="relative grid gap-8 lg:grid-cols-2 ">
                                        <div className="space-y-6">
                                            <div className="inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-pink-50 px-4 py-2">
                                                <Zap className="h-4 w-4 text-pink-600" />
                                                <span className="text-sm font-bold text-pink-700">How It Works</span>
                                            </div>
                                            <h2 className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-3xl font-black text-transparent md:text-5xl">
                                                Seamless Parcel Management
                                            </h2>
                                            <p className="text-lg leading-relaxed text-gray-600">
                                                Our intelligent system automates every step of the parcel handling process, from arrival notification to
                                                secure collection.
                                            </p>

                                            {/* Feature list with icons */}
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4 rounded-2xl border-2 border-orange-200 bg-orange-200 p-4 transition-all hover:scale-105">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-600 shadow-lg">
                                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Instant Notifications</h4>
                                                        <p className="text-sm text-gray-600">Get real-time alerts when your parcel arrives</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4 rounded-2xl border-2 border-blue-200 bg-blue-200 p-4 transition-all hover:scale-105">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
                                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Secure Storage</h4>
                                                        <p className="text-sm text-gray-600">Your parcels are safely stored until collection</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4 rounded-2xl border-2 border-green-200 bg-green-200 p-4 transition-all hover:scale-105">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Easy Payment</h4>
                                                        <p className="text-sm text-gray-600">Quick and secure payment processing</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Animated Phone Mockup */}
                                        <div className="relative flex items-center justify-center">
                                            <div className="relative">
                                                {/* Glowing ring animation */}
                                                <div
                                                    className="absolute inset-0 animate-ping rounded-3xl bg-gradient-to-r from-pink-400 to-purple-400 opacity-20"
                                                    style={{ animationDuration: '3s' }}
                                                ></div>

                                                {/* Phone mockup */}
                                                <div className="relative rounded-3xl border-8 border-gray-900 bg-white p-4 shadow-2xl">
                                                    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
                                                        <div className="space-y-3 p-6">
                                                            {/* Notification cards */}
                                                            <div
                                                                className="animate-slide-down rounded-2xl border-2 border-pink-200 bg-white p-4 shadow-lg"
                                                                style={{ animationDelay: '0s' }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-700">
                                                                        <Package className="h-6 w-6 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-gray-900">Parcel Arrived!</p>
                                                                        <p className="text-xs text-gray-600">PCL2025110001</p>
                                                                    </div>
                                                                    <div className="h-2 w-2 animate-pulse rounded-full bg-pink-500"></div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="animate-slide-down rounded-2xl border-2 border-green-200 bg-white p-4 shadow-lg"
                                                                style={{ animationDelay: '0.3s' }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                                                                        <CreditCard className="h-6 w-6 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-gray-900">Payment Verified</p>
                                                                        <p className="text-xs text-gray-600">Schedule pickup time slot</p>
                                                                    </div>
                                                                    <svg
                                                                        className="h-5 w-5 text-green-500"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M5 13l4 4L19 7"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="animate-slide-down rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-lg"
                                                                style={{ animationDelay: '0.6s' }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700">
                                                                        <svg
                                                                            className="h-6 w-6 text-white"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-gray-900">QR Code Ready</p>
                                                                        <p className="text-xs text-gray-600">Scan to collect</p>
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

                        {/* How It Works Section - Redesigned with Timeline */}
                        <div className="relative h-0 w-0">
                            <span id="process-timeline" className="absolute -top-20 left-0 h-px w-px opacity-0"></span>
                        </div>
                        <div
                            className="relative mt-32 overflow-hidden rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 p-12 shadow-2xl duration-1000 animate-in fade-in zoom-in-95"
                            style={{ animationDelay: '100ms' }}
                        >

                            <div className="relative">
                                <div
                                    className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-white px-6 py-2 text-sm font-bold text-pink-700 shadow-lg duration-700 animate-in fade-in slide-in-from-top-4"
                                    style={{ animationDelay: '200ms' }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Process Timeline
                                </div>
                                <h2
                                    className="mb-4 bg-gradient-to-r from-pink-600 via-pink-400 to-green-300 bg-clip-text text-3xl font-black text-transparent duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-5xl"
                                    style={{ animationDelay: '300ms' }}
                                >
                                    Your Parcel Journey
                                </h2>
                                <p
                                    className="mx-auto mb-16 max-w-2xl text-lg text-gray-600 duration-700 animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: '400ms' }}
                                >
                                    From arrival to collection in 4 simple steps
                                </p>

                                {/* Timeline Layout */}
                                <div className="relative">
                                    {/* Connecting Line - Vertical on mobile, Horizontal on desktop */}
                                    <div className="absolute top-0 left-1/2 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-pink-300 via-purple-300 to-blue-300 lg:top-12 lg:right-[10%] lg:left-[10%] lg:h-1 lg:w-auto lg:translate-x-0 lg:bg-gradient-to-r"></div>

                                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
                                        {/* Step 1 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '500ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-6">
                                                    {/* Pulsing ring */}
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-pink-400 opacity-20"
                                                        style={{ animationDuration: '2s' }}
                                                    ></div>

                                                    {/* Main circle */}
                                                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-pink-600 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12">
                                                        <Package className="h-12 w-12 text-white" />
                                                        <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-gray-900 shadow-xl ring-4 ring-pink-100">
                                                            01
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border-2 border-pink-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-900">Parcel Arrival</h3>
                                                    <p className="text-sm leading-relaxed text-gray-600">
                                                        Your parcel is received and securely logged into our system with instant tracking
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '700ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-6">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-20"
                                                        style={{ animationDuration: '2s', animationDelay: '0.3s' }}
                                                    ></div>

                                                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-300 to-purple-600 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12">
                                                        <Bell className="h-12 w-12 text-white" />
                                                        <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-gray-900 shadow-xl ring-4 ring-purple-100">
                                                            02
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border-2 border-purple-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-900">Smart Alert</h3>
                                                    <p className="text-sm leading-relaxed text-gray-600">
                                                        Get instant notifications via email and in-app alerts about your parcel
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '900ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-6">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"
                                                        style={{ animationDuration: '2s', animationDelay: '0.6s' }}
                                                    ></div>

                                                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-600 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12">
                                                        <CreditCard className="h-12 w-12 text-white" />
                                                        <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-gray-900 shadow-xl ring-4 ring-blue-100">
                                                            03
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border-2 border-blue-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-900">Easy Payment</h3>
                                                    <p className="text-sm leading-relaxed text-gray-600">
                                                        Upload payment proof and get quick verification from our staff
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="relative duration-700 animate-in fade-in zoom-in-50" style={{ animationDelay: '1100ms' }}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="group relative z-10 mb-6">
                                                    <div
                                                        className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"
                                                        style={{ animationDuration: '2s', animationDelay: '0.9s' }}
                                                    ></div>

                                                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-green-600 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12">
                                                        <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                                            />
                                                        </svg>
                                                        <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-gray-900 shadow-xl ring-4 ring-green-100">
                                                            04
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border-2 border-green-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                                                    <h3 className="mb-3 text-2xl font-black text-gray-900">Quick Collection</h3>
                                                    <p className="text-sm leading-relaxed text-gray-600">
                                                        Show QR code or collection code and collect your parcel hassle-free
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
            </footer >

            {/* Announcement Detail Modal */}
            {
                selectedAnnouncement && (
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
                )
            }
        </>
    );
}
