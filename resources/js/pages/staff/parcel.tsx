import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Eye, Trash2, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Parcel',
        href: '/staff/parcel',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            {/* Background color matching the image */}
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Top Stats Grid */}
                <div className="mb-6 grid grid-cols-3 gap-6">
                    {/* Newly Arrived */}
                    <div className="rounded-xl border border-gray-100 bg-pink-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Newly Arrived</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">65</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+12%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className="rounded-xl border border-gray-100 bg-blue-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">71</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+8%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Collection */}
                    <div className="rounded-xl border border-gray-100 bg-purple-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ready for Collection</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">15</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+5%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row Stats */}
                <div className="mb-6 grid grid-cols-3 gap-6">
                    {/* Total Collection */}
                    <div className="rounded-xl border border-gray-100 bg-blue-50 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today Collection</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">18</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+23%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="rounded-xl border border-gray-100 bg-yellow-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">$25</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+15%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Verified */}
                    <div className="rounded-xl border border-gray-100 bg-indigo-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Payment Verified</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">65</p>
                                <div className="mt-3 flex items-center">
                                    <span className="text-sm font-medium text-emerald-600">+18%</span>
                                    <TrendingUp className="ml-1 h-4 w-4 text-emerald-600" />
                                </div>
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
                                        className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 text-gray-700 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

                            {/* Filter Tabs */}
                            <div className="flex gap-2 border-b border-gray-100 p-6">
                                <button className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">All Parcels 1</button>
                                <button className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-600 hover:bg-orange-100">
                                    Pending Payments 1
                                </button>
                                <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-100">
                                    Ready for Collection 0
                                </button>
                                <button className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                                    Collected 0
                                </button>
                                <button className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                                    Unclaimed 0
                                </button>
                            </div>

                            {/* Table Content */}
                            <div className="space-y-4 p-6">
                                {/* Package P001 */}
                                <div className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                <span className="text-lg font-semibold text-blue-600">P</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">Package - P001</p>
                                                <p className="mt-1 text-sm text-gray-500">Recipient: John Doe</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="rounded-full border border-orange-200 bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
                                                Pending Payments
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600">
                                                    Mark as Collected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package P002 */}
                                <div className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                <span className="text-lg font-semibold text-blue-600">P</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">Package - P002</p>
                                                <p className="mt-1 text-sm text-gray-500">Recipient: Jane Doe</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                                                Ready for Collection
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600">
                                                    Mark as Collected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package P003 */}
                                <div className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                <span className="text-lg font-semibold text-blue-600">P</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">Package - P003</p>
                                                <p className="mt-1 text-sm text-gray-500">Recipient: Alice Johnson</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                                                Unclaimed
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600">
                                                    Mark as Collected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - 1 column */}
                    <div className="col-span-1 space-y-6">
                        {/* Quick Actions */}
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-5 text-lg font-semibold text-gray-900">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/staff/add-parcel"
                                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 transition-colors group-hover:bg-blue-600">
                                        <span className="font-medium text-white">+</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Register New Parcel</span>
                                    <span className="ml-auto text-gray-400 transition-colors group-hover:text-blue-500">→</span>
                                </Link>
                                <button className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 transition-colors group-hover:bg-emerald-600">
                                        <span className="font-medium text-white">📄</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Generate Reports</span>
                                    <span className="ml-auto text-gray-400 transition-colors group-hover:text-emerald-500">→</span>
                                </button>
                                <button className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-orange-200 hover:bg-orange-50">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 transition-colors group-hover:bg-orange-600">
                                        <span className="font-medium text-white">📱</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Scan QR Code</span>
                                    <span className="ml-auto text-gray-400 transition-colors group-hover:text-orange-500">→</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Notifications */}
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-800">View All</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                                    <div className="mt-2 h-3 w-3 flex-shrink-0 rounded-full bg-emerald-500"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">New Parcel Arrived</p>
                                        <p className="mt-1 text-xs text-gray-500">5 minutes ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                                    <div className="mt-2 h-3 w-3 flex-shrink-0 rounded-full bg-blue-500"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Parcel Ready for Pickup</p>
                                        <p className="mt-1 text-xs text-gray-500">1 hour ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                                    <div className="mt-2 h-3 w-3 flex-shrink-0 rounded-full bg-orange-500"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Delivery Enquired</p>
                                        <p className="mt-1 text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
