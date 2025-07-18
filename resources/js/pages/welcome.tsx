import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Package, CreditCard, Bell, MapPin } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-[#FFE0F2] p-6">
                {/* Header */}
                <header className="flex justify-end gap-4 mb-20">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="px-4 py-2  bg-white text-black rounded-lg hover:text-black transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto text-center">
                    {/* Logo and Title */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Insta<span className="text-gray-900">Station</span>
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Instant Parcel Tracking Dashboard
                        </p>
                    </div>

                    {/* Description */}
                    <div className="mb-16">
                        <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed">
                            Streamline parcel management for your university with smart matching,
                            secure payments, and real-time tracking for both students and staff.
                        </p>
                    </div>

                    {/* Check for Unclaimed Parcels Button */}
                    <div className="mb-16">
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-400 rounded-lg hover:bg-green-100 transition-colors">
                            <Package className="w-5 h-5" />
                            Check for Unclaimed Parcels
                        </button>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* User Management */}
                        <div className="bg-purple-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                            <p className="text-sm text-gray-600">
                                Automate name matching and profile management for students and staff
                            </p>
                        </div>

                        {/* Payment Processing */}
                        <div className="bg-green-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
                            <p className="text-sm text-gray-600">
                                Secure payment handling with proof upload and staff verification
                            </p>
                        </div>

                        {/* Smart Notifications */}
                        <div className="bg-orange-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Notifications</h3>
                            <p className="text-sm text-gray-600">
                                Automated reminders for collection, payment due, and parcel arrival
                            </p>
                        </div>

                        {/* Parcel Tracking */}
                        <div className="bg-blue-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Parcel Tracking</h3>
                            <p className="text-sm text-gray-600">
                                Real-time tracking from arrival to collection with QR codes and notifications
                            </p>
                        </div>
                    </div>

                    {/* Deploy Button */}
                    <div className="mt-16">
                        <Link
                            href="https://cloud.laravel.com"
                            target="_blank"
                            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                        >
                            Deploy now
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}