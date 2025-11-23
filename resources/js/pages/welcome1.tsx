import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Bell, Calendar, CreditCard, MapPin, Package, QrCode, Shield, Sparkles, X, Zap } from 'lucide-react';
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

    const announcementsSorted = [...announcements].sort((a, b) => {
        const ad = new Date(a.publish_date || a.created_at || 0).getTime();
        const bd = new Date(b.publish_date || b.created_at || 0).getTime();
        return bd - ad;
    });

    const displayedAnnouncements = announcementsSorted.slice(0, visibleCount);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('.animate-in'));

        if (nodes.length === 0) return;

        nodes.forEach((el) => {
            el.classList.remove('animate-in');
            el.classList.add('will-animate');
        });

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
                        target.classList.remove('will-animate');
                        target.classList.add('animate-in');
                        observer.unobserve(target);
                    }
                });
            },
            { threshold: 0.15 },
        );

        nodes.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800,900" rel="stylesheet" />
            </Head>

            {/* Hero Section - Magazine Style Layout */}
            <div className="relative min-h-screen overflow-hidden bg-white">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.03)_0%,transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>

                {/* Floating Gradient Orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="animate-float absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-pink-100/30 to-purple-100/30 blur-3xl"></div>
                    <div className="animate-float-delayed absolute bottom-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-100/30 to-cyan-100/30 blur-3xl"></div>
                </div>

                {/* Navigation - Minimalist */}
                <nav className="relative z-50 mx-auto flex max-w-7xl items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-6 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 shadow-lg">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="text-xl leading-tight font-black">
                                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Insta</span>
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Station</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={auth.user.type === 'staff' ? route('staff.dashboard') : route('student.parcel')}
                                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-lg px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="group rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                                >
                                    <span className="flex items-center gap-1.5">
                                        Get Started
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero Content - Centered with Side Elements */}
                <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32">
                    <div className="mx-auto max-w-4xl text-center">
                        {/* Badge */}
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50/50 px-4 py-1.5 text-sm font-semibold text-pink-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            Next-Gen Parcel Management Platform
                        </div>

                        {/* Main Headline */}
                        <h1 className="mb-8 text-6xl leading-[1.1] font-black tracking-tight text-gray-900 lg:text-7xl">
                            The{' '}
                            <div className="relative my-4 inline-block h-20 w-56 overflow-hidden lg:h-24 lg:w-64">
                                {words.map((word, index) => (
                                    <div
                                        key={word}
                                        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                                            index === currentWord
                                                ? 'translate-y-0 opacity-100'
                                                : index < currentWord
                                                  ? '-translate-y-full opacity-0'
                                                  : 'translate-y-full opacity-0'
                                        }`}
                                    >
                                        <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-6xl font-black text-transparent lg:text-7xl">
                                            {word}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <br />
                            Way to Manage
                            <br />
                            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Campus Parcels
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="mb-12 text-xl leading-relaxed text-gray-600 lg:text-2xl">
                            Streamline your university's parcel operations with intelligent automation,{' '}
                            <span className="font-semibold text-gray-900">real-time tracking</span>, and{' '}
                            <span className="font-semibold text-pink-600">seamless collection</span>.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mb-16 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href={route('public.unclaimed')}
                                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl"
                            >
                                <Package className="h-5 w-5" />
                                Check Unclaimed Parcels
                            </Link>
                            {!auth.user && (
                                <Link
                                    href={route('register')}
                                    className="rounded-xl border-2 border-gray-200 bg-white px-8 py-4 font-bold text-gray-900 shadow-lg transition-all duration-200 hover:border-pink-300 hover:shadow-xl"
                                >
                                    Start Free Trial
                                </Link>
                            )}
                        </div>

                        {/* Stats - Horizontal */}
                        <div className="flex flex-wrap items-center justify-center gap-8 border-t border-gray-100 pt-12">
                            <div className="text-center">
                                <div className="mb-1 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-4xl font-black text-transparent">
                                    1000+
                                </div>
                                <div className="text-sm font-medium text-gray-500">Parcels Delivered</div>
                            </div>
                            <div className="h-12 w-px bg-gray-200"></div>
                            <div className="text-center">
                                <div className="mb-1 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-black text-transparent">
                                    500+
                                </div>
                                <div className="text-sm font-medium text-gray-500">Active Users</div>
                            </div>
                            <div className="h-12 w-px bg-gray-200"></div>
                            <div className="text-center">
                                <div className="mb-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-4xl font-black text-transparent">
                                    99%
                                </div>
                                <div className="text-sm font-medium text-gray-500">Success Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section - Grid with Icons */}
            <section className="relative overflow-hidden bg-gray-50 py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-16 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5">
                            <Zap className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-700">Powerful Features</span>
                        </div>
                        <h2 className="mb-4 text-5xl font-black text-gray-900">Everything You Need</h2>
                        <p className="mx-auto max-w-2xl text-xl text-gray-600">
                            Comprehensive tools designed to streamline your parcel management workflow
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Package,
                                title: 'Smart Tracking',
                                desc: 'Real-time status updates and location tracking',
                                gradient: 'from-pink-500 to-pink-600',
                                bg: 'from-pink-50 to-white',
                            },
                            {
                                icon: Bell,
                                title: 'Instant Alerts',
                                desc: 'Immediate notifications via email and SMS',
                                gradient: 'from-purple-500 to-purple-600',
                                bg: 'from-purple-50 to-white',
                            },
                            {
                                icon: Shield,
                                title: 'Secure Storage',
                                desc: 'Safe and secure storage until collection',
                                gradient: 'from-blue-500 to-blue-600',
                                bg: 'from-blue-50 to-white',
                            },
                            {
                                icon: CreditCard,
                                title: 'Easy Payment',
                                desc: 'Quick and secure payment verification',
                                gradient: 'from-green-500 to-emerald-600',
                                bg: 'from-green-50 to-white',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.bg} p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                            >
                                <div
                                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                                >
                                    <feature.icon className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Vertical Timeline */}
            <section className="relative overflow-hidden bg-white py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mb-16 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-pink-600" />
                            <span className="text-sm font-semibold text-pink-700">Simple Process</span>
                        </div>
                        <h2 className="mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-5xl font-black text-transparent">
                            How It Works
                        </h2>
                        <p className="mx-auto max-w-2xl text-xl text-gray-600">From arrival to collection in 4 simple steps</p>
                    </div>

                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute top-0 left-8 hidden h-full w-0.5 bg-gradient-to-b from-pink-200 via-purple-200 to-blue-200 lg:block"></div>

                        <div className="space-y-12">
                            {[
                                {
                                    step: '01',
                                    icon: Package,
                                    title: 'Parcel Arrival',
                                    desc: 'Your parcel is received and securely logged into our system with instant tracking capabilities.',
                                    color: 'pink',
                                },
                                {
                                    step: '02',
                                    icon: Bell,
                                    title: 'Smart Alert',
                                    desc: 'Get instant notifications via email and in-app alerts about your parcel arrival and status.',
                                    color: 'purple',
                                },
                                {
                                    step: '03',
                                    icon: CreditCard,
                                    title: 'Easy Payment',
                                    desc: 'Upload payment proof and get quick verification from our staff team.',
                                    color: 'blue',
                                },
                                {
                                    step: '04',
                                    icon: QrCode,
                                    title: 'Quick Collection',
                                    desc: 'Show QR code or collection code and collect your parcel hassle-free.',
                                    color: 'green',
                                },
                            ].map((item) => {
                                const colorClasses = {
                                    pink: {
                                        stepBg: 'from-pink-500 to-pink-600',
                                        iconBg: 'from-pink-100 to-pink-50',
                                        iconColor: 'text-pink-600',
                                        border: 'border-pink-200',
                                    },
                                    purple: {
                                        stepBg: 'from-purple-500 to-purple-600',
                                        iconBg: 'from-purple-100 to-purple-50',
                                        iconColor: 'text-purple-600',
                                        border: 'border-purple-200',
                                    },
                                    blue: {
                                        stepBg: 'from-blue-500 to-blue-600',
                                        iconBg: 'from-blue-100 to-blue-50',
                                        iconColor: 'text-blue-600',
                                        border: 'border-blue-200',
                                    },
                                    green: {
                                        stepBg: 'from-green-500 to-green-600',
                                        iconBg: 'from-green-100 to-green-50',
                                        iconColor: 'text-green-600',
                                        border: 'border-green-200',
                                    },
                                };
                                const colors = colorClasses[item.color as keyof typeof colorClasses];

                                return (
                                    <div key={item.step} className="relative flex items-start gap-8">
                                        <div className="relative z-10 flex-shrink-0">
                                            <div
                                                className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${colors.stepBg} text-xl font-black text-white shadow-xl lg:h-20 lg:w-20`}
                                            >
                                                {item.step}
                                            </div>
                                        </div>
                                        <div
                                            className={`flex-1 rounded-2xl border ${colors.border} bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl`}
                                        >
                                            <div className="mb-4 flex items-center gap-4">
                                                <div
                                                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colors.iconBg}`}
                                                >
                                                    <item.icon className={`h-7 w-7 ${colors.iconColor}`} />
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                                            </div>
                                            <p className="text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Announcements */}
            {announcements.length > 0 && (
                <section className="relative overflow-hidden bg-gray-50 py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-12 flex items-center justify-between">
                            <div>
                                <h2 className="mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-4xl font-black text-transparent">
                                    Latest Announcements
                                </h2>
                                <p className="text-gray-600">Stay updated with campus news and updates</p>
                            </div>
                            {announcementsSorted.length > displayedAnnouncements.length && (
                                <button
                                    onClick={() => setVisibleCount((c) => Math.min(c + 4, announcementsSorted.length))}
                                    className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:border-pink-300 hover:shadow-lg"
                                >
                                    View More
                                </button>
                            )}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displayedAnnouncements.map((a: AnnouncementCard) => (
                                <div
                                    key={a.announcement_id}
                                    className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:scale-105 hover:border-pink-300 hover:shadow-xl"
                                    onClick={() => setSelectedAnnouncement(a)}
                                >
                                    {a.announcement_image && (
                                        <div className="relative h-48 w-full overflow-hidden">
                                            <img
                                                src={`/storage/${a.announcement_image}`}
                                                alt="announcement"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 p-1.5">
                                                <Package className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600">Postal Hub</span>
                                        </div>
                                        <h3 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900">{a.announcement_title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(a.publish_date || a.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer - Clean & Professional */}
            <footer className="relative overflow-hidden border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                        <div className="lg:col-span-2">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 shadow-lg">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl font-black">
                                        <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Insta</span>
                                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Station</span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-500">Campus Parcel Hub</div>
                                </div>
                            </div>
                            <p className="mb-6 max-w-md text-gray-600">
                                The smart way to track and manage campus deliveries. Get notified instantly when your parcels arrive.
                            </p>
                            <div className="flex items-center gap-3">
                                {['facebook', 'instagram', 'twitter'].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-all duration-200 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
                                    >
                                        <span className="sr-only">{social}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">Quick Links</h4>
                            <ul className="space-y-3">
                                {['About Us', 'How It Works', 'FAQs', 'Support', 'Contact'].map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-gray-600 transition-colors hover:text-pink-600">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">Contact</h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-gray-600">
                                    <svg className="mt-0.5 h-4 w-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span className="text-sm">support@instastation.edu</span>
                                </li>
                                <li className="flex items-start gap-3 text-gray-600">
                                    <MapPin className="mt-0.5 h-4 w-4 text-purple-600" />
                                    <span className="text-sm">Campus Postal Hub</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-gray-200 pt-8">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} <span className="font-semibold text-gray-900">InstaStation</span>. All rights reserved.
                            </p>
                            <p className="text-sm text-gray-500">
                                Made with <span className="text-pink-600">❤️</span> for UMPSA
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Announcement Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedAnnouncement.announcement_title}</h2>
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedAnnouncement.announcement_image && (
                                <img
                                    src={`/storage/${selectedAnnouncement.announcement_image}`}
                                    alt="announcement"
                                    className="mb-6 h-64 w-full rounded-xl object-cover"
                                />
                            )}
                            <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    Postal Hub
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}
                                </span>
                            </div>
                            <div className="prose max-w-none text-gray-700">{selectedAnnouncement.announcement_content}</div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 6s ease-in-out infinite;
                    animation-delay: 3s;
                }
            `}</style>
        </>
    );
}
