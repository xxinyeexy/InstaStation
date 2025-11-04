import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Bell, Calendar, CreditCard, MapPin, Package, Sparkles, X } from 'lucide-react';
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
            <div className="min-h-screen bg-[#FFE0F2] p-6">
                {/* Header - Slide down from top */}
                <header className="mb-20 flex justify-end gap-4 duration-700 animate-in fade-in slide-in-from-top-4">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="rounded-lg bg-gray-900 px-6 py-2 text-white transition-colors hover:bg-black">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-lg bg-white px-4 py-2 text-black transition-colors hover:text-black">
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
                        className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF029A]/20 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm duration-700 animate-in fade-in slide-in-from-top-4"
                        style={{ animationDelay: '100ms' }}
                    >
                        <Sparkles className="h-4 w-4 text-[#FF029A]" />
                        <span className="bg-gradient-to-r from-[#FF029A] to-[#16A34A] bg-clip-text text-sm font-semibold text-transparent">
                            Instant Parcel Tracking Dashboard
                        </span>
                    </div>

                    {/* Logo and Title - Scale up and fade in */}
                    <div className="mb-8 duration-700 animate-in fade-in zoom-in-95" style={{ animationDelay: '200ms' }}>
                        <h1 className="relative mb-4">
                            <span className="block">
                                <span className="relative inline-block bg-gradient-to-r from-[#FF029A] via-pink-600 to-[#FF029A] bg-clip-text text-7xl font-black tracking-tight text-transparent">
                                    Insta
                                    <span className="relative">
                                        <span className="relative z-10 bg-gradient-to-r from-gray-900 via-green-600 to-green-700 bg-clip-text text-transparent">
                                            Station
                                        </span>
                                        {/* Underline decoration */}
                                        <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                                            <path d="M1 5.5C50 2.5 100 2.5 199 5.5" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" />
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
                        <img src="/images/logo.png" alt="InstaStation" className="mx-auto mb-4 w-70" />
                        <Link
                            href={route('public.unclaimed')}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-6 py-3 text-green-600 transition-colors hover:bg-green-100"
                        >
                            <Package className="h-5 w-5" />
                            Check Unclaimed Parcels
                        </Link>
                    </div>

                    {/* Hero Section - Slide from right */}
                    <section
                        className="relative overflow-hidden px-6 py-20 duration-1000 animate-in fade-in slide-in-from-right-8"
                        style={{ animationDelay: '700ms' }}
                    >
                        <div className="mx-auto max-w-7xl">
                            <div className="grid items-center gap-12 lg:grid-cols-2">
                                {/* Left Content */}
                                <div className="text-center lg:text-left">
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-purple-600"></span>
                                        Smart Campus Solution
                                    </div>
                                    <h1
                                        style={{
                                            marginBottom: '24px',
                                            fontSize: '60px',
                                            fontWeight: '900',
                                            background: 'linear-gradient(135deg, #FF029A 0%, #FF3BAE 50%, #16A34A 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            lineHeight: '1.2',
                                            letterSpacing: '-2px',
                                        }}
                                    >
                                        InstaStation
                                    </h1>
                                    <p className="mb-8 max-w-xl text-xl leading-relaxed text-gray-600">
                                        A comprehensive parcel tracking and management system designed for universities. Featuring intelligent
                                        matching, secure payment processing, and seamless real-time tracking for both students and staff.
                                    </p>
                                    <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-600 to-[#FF029A] px-8 py-4 text-base font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl">
                                            <Package className="h-5 w-5" />
                                            Learn More
                                        </button>
                                    </div>
                                </div>

                                {/* Right Image */}
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-3xl"></div>
                                    <div className="relative rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
                                        <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                                            <div className="text-center">
                                                <div className="mb-8">
                                                    <img src="/images/logo.png" alt="InstaStation" className="mx-auto mb-4 w-70" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Feature Cards - Staggered fade in from bottom */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* User Management */}
                        <div
                            className="rounded-xl bg-purple-50 p-6 shadow-lg transition-shadow duration-700 animate-in fade-in slide-in-from-bottom-4 hover:shadow-xl"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
                                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">User Management</h3>
                            <p className="text-sm text-gray-600">Automate name matching and profile management for students and staff</p>
                        </div>

                        {/* Payment Processing */}
                        <div
                            className="rounded-xl bg-green-50 p-6 shadow-lg transition-shadow duration-700 animate-in fade-in slide-in-from-bottom-4 hover:shadow-xl"
                            style={{ animationDelay: '200ms' }}
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                                    <CreditCard className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">Payment Processing</h3>
                            <p className="text-sm text-gray-600">Secure payment handling with proof upload and staff verification</p>
                        </div>

                        {/* Smart Notifications */}
                        <div
                            className="rounded-xl bg-orange-50 p-6 shadow-lg transition-shadow duration-700 animate-in fade-in slide-in-from-bottom-4 hover:shadow-xl"
                            style={{ animationDelay: '300ms' }}
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
                                    <Bell className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">Smart Notifications</h3>
                            <p className="text-sm text-gray-600">Automated reminders for collection, payment due, and parcel arrival</p>
                        </div>

                        {/* Parcel Tracking */}
                        <div
                            className="rounded-xl bg-blue-50 p-6 shadow-lg transition-shadow duration-700 animate-in fade-in slide-in-from-bottom-4 hover:shadow-xl"
                            style={{ animationDelay: '400ms' }}
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                    <MapPin className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">Parcel Tracking</h3>
                            <p className="text-sm text-gray-600">Real-time tracking from arrival to collection with QR codes and notifications</p>
                        </div>
                    </div>

                    {/* How It Works Section - Fade in and scale */}
                    <div
                        className="mt-32 rounded-xl bg-white p-12 shadow-xl duration-1000 animate-in fade-in zoom-in-95"
                        style={{ animationDelay: '100ms' }}
                    >
                        <div
                            className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white duration-700 animate-in fade-in slide-in-from-top-4"
                            style={{ animationDelay: '200ms' }}
                        >
                            Process
                        </div>
                        <h2
                            className="mb-4 text-4xl font-bold text-gray-900 duration-700 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: '300ms' }}
                        >
                            How It Works
                        </h2>
                        <p
                            className="mx-auto mb-16 max-w-2xl text-lg text-gray-600 duration-700 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: '400ms' }}
                        >
                            Getting your parcels have never been easier
                        </p>

                        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {/* Connecting Line - Hidden on mobile */}
                            <div className="absolute top-12 right-[12.5%] left-[12.5%] hidden h-0.5 bg-pink-300 lg:block"></div>

                            {/* Step 1 - Parcel Arrival */}
                            <div
                                className="relative flex flex-col items-center text-center duration-700 animate-in fade-in zoom-in-50"
                                style={{ animationDelay: '500ms' }}
                            >
                                <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-600 to-[#FF029A] transition-all hover:scale-110 hover:shadow-2xl">
                                    <Package className="h-10 w-10 text-white" />
                                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900 shadow drop-shadow-xl">
                                        01
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Parcel Arrival</h3>
                                <p className="text-sm text-gray-600">Your parcel is received and securely stored at our facility</p>
                            </div>

                            {/* Step 2 - Notification Sent */}
                            <div
                                className="relative flex flex-col items-center text-center duration-700 animate-in fade-in zoom-in-50"
                                style={{ animationDelay: '700ms' }}
                            >
                                <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-600 to-[#FF029A] shadow-lg transition-all hover:scale-110 hover:shadow-2xl">
                                    <Bell className="h-10 w-10 text-white" />
                                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900 shadow drop-shadow-xl">
                                        02
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Notification Sent</h3>
                                <p className="text-sm text-gray-600">Receive instant notifications about their parcel arrival.</p>
                            </div>

                            {/* Step 3 - Payment Processing */}
                            <div
                                className="relative flex flex-col items-center text-center duration-700 animate-in fade-in zoom-in-50"
                                style={{ animationDelay: '900ms' }}
                            >
                                <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-600 to-[#FF029A] shadow-lg transition-all hover:scale-110 hover:shadow-2xl">
                                    <CreditCard className="h-10 w-10 text-white" />
                                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900 shadow drop-shadow-xl">
                                        03
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Payment Processing</h3>
                                <p className="text-sm text-gray-600">Submit payment proof and wait for verification.</p>
                            </div>

                            {/* Step 4 - QR Collection */}
                            <div
                                className="relative flex flex-col items-center text-center duration-700 animate-in fade-in zoom-in-50"
                                style={{ animationDelay: '1100ms' }}
                            >
                                <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-600 to-[#FF029A] shadow-lg transition-all hover:scale-110 hover:shadow-2xl">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                        />
                                    </svg>
                                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900 shadow drop-shadow-xl">
                                        04
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">QR Collection</h3>
                                <p className="text-sm text-gray-600">Show your qrcode or pickup code to collect your parcel hassle-free</p>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter Section - Slide from left */}
                    <div className="mt-20 duration-700 animate-in fade-in slide-in-from-left-8" style={{ animationDelay: '100ms' }}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-gray-900">Newsletter</h2>
                            {announcementsSorted.length > displayedAnnouncements.length && (
                                <button
                                    onClick={() => setVisibleCount((c) => Math.min(c + 4, announcementsSorted.length))}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    View more
                                </button>
                            )}
                        </div>
                        <div className="space-y-6">
                            {displayedAnnouncements.map((a: AnnouncementCard, index: number) => {
                                return (
                                    <div
                                        key={a.announcement_id}
                                        className="cursor-pointer overflow-hidden rounded-2xl bg-white text-black transition-shadow duration-700 animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg"
                                        style={{ animationDelay: `${(index + 2) * 100}ms` }}
                                        onClick={() => setSelectedAnnouncement(a)}
                                    >
                                        {a.announcement_image && (
                                            <div className="h-40 w-full overflow-hidden">
                                                <img
                                                    src={`/storage/${a.announcement_image}`}
                                                    alt="announcement"
                                                    className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="mb-1 flex items-center gap-2 text-xs text-black">
                                                <span className="inline-flex items-center gap-1">
                                                    <Package className="h-4 w-4" /> Postal Hub
                                                </span>
                                            </div>
                                            <div className="text-left text-lg font-semibold">{a.announcement_title}</div>
                                            <div className="mt-2 text-left text-xs text-black">{formatDate(a.publish_date || a.created_at)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {announcements.length === 0 && (
                                <div className="rounded-xl border bg-white p-6 text-center text-gray-500 duration-700 animate-in fade-in">
                                    No announcements yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer - Fade in from bottom */}
            <footer className="mt-5 w-full bg-white py-8 duration-1000 animate-in fade-in slide-in-from-bottom-8">
                <div className="w-full text-center">
                    <p className="text-xs font-medium text-pink-500">© INSTASTATION. SINCE 2025. ALL RIGHTS RESERVED.</p>
                </div>
            </footer>

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center duration-300 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedAnnouncement(null)} />
                    <div className="relative z-10 w-full max-w-2xl rounded-xl bg-card shadow-xl duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedAnnouncement(null)} className="text-muted-foreground hover:text-foreground">
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className="text-lg font-semibold text-card-foreground">{selectedAnnouncement.announcement_title}</h2>
                            </div>
                            <button onClick={() => setSelectedAnnouncement(null)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Image */}
                            {selectedAnnouncement.announcement_image && (
                                <div className="mb-6 overflow-hidden rounded-lg">
                                    <img
                                        src={`/storage/${selectedAnnouncement.announcement_image}`}
                                        alt="announcement"
                                        className="h-64 w-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Sender info */}
                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    by Postal Hub
                                </span>
                            </div>

                            {/* Date and time */}
                            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                                <span>
                                    <Calendar className="h-4 w-4" />
                                </span>
                                <span>{formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}</span>
                            </div>

                            {/* Content */}
                            <div className="prose max-w-none text-gray-700">{selectedAnnouncement.announcement_content}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}