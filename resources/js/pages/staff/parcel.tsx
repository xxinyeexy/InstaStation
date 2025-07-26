import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from '@inertiajs/react';

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
            <div className="bg-gray-50 min-h-screen p-6">
                {/* Top Stats Grid */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Newly Arrived */}
                    <div className="bg-pink-100 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Newly Arrived</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">65</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+12%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className="bg-blue-100 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Payments</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">71</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+8%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Collection */}
                    <div className="bg-purple-100 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Ready for Collection</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">15</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+5%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row Stats */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Total Collection */}
                    <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Today Collection</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">18</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+23%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-yellow-100 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">$25</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+15%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Verified */}
                    <div className="bg-indigo-100 rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Payment Verified</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">65</p>
                                <div className="flex items-center mt-3">
                                    <span className="text-emerald-600 text-sm font-medium">+18%</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Sidebar */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Main Table Area - 3 columns */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            {/* Search Bar */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search parcels..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 p-6 border-b border-gray-100">
                                <button className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg font-medium">
                                    All Parcels 1
                                </button>
                                <button className="px-4 py-2 bg-orange-50 text-orange-600 text-sm rounded-lg border border-orange-200 hover:bg-orange-100">
                                    Pending Payments 1
                                </button>
                                <button className="px-4 py-2 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-200 hover:bg-emerald-100">
                                    Ready for Collection 0
                                </button>
                                <button className="px-4 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-100">
                                    Collected 0
                                </button>
                                <button className="px-4 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-100">
                                    Unclaimed 0
                                </button>
                            </div>

                            {/* Table Content */}
                            <div className="p-6 space-y-4">
                                {/* Package P001 */}
                                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-lg">P</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">Package - P001</p>
                                                <p className="text-sm text-gray-500 mt-1">Recipient: John Doe</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-4 py-2 bg-orange-100 text-orange-700 text-sm rounded-full font-medium border border-orange-200">
                                                Pending Payments
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="px-5 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 font-medium shadow-sm">
                                                    Mark as Collected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package P002 */}
                                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-lg">P</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">Package - P002</p>
                                                <p className="text-sm text-gray-500 mt-1">Recipient: Jane Doe</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium border border-emerald-200">
                                                Ready for Collection
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="px-5 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 font-medium shadow-sm">
                                                    Mark as Collected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package P003 */}
                                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-lg">P</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">Package - P003</p>
                                                <p className="text-sm text-gray-500 mt-1">Recipient: Alice Johnson</p>
                                                <p className="text-sm text-gray-400">The parcel - Jane Smith</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full font-medium border border-gray-200">
                                                Unclaimed
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="px-5 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 font-medium shadow-sm">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-5 text-lg">Quick Actions</h3>
                            <div className="space-y-3">
                             <Link
  href="/staff/add-parcel"
  className="w-full flex items-center gap-4 p-4 text-left hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group"
>
  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
    <span className="text-white font-medium">+</span>
  </div>
  <span className="text-sm text-gray-700 font-medium">Register New Parcel</span>
  <span className="ml-auto text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
</Link>
                                <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-emerald-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all group">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                        <span className="text-white font-medium">📄</span>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">Generate Reports</span>
                                    <span className="ml-auto text-gray-400 group-hover:text-emerald-500 transition-colors">→</span>
                                </button>
                                <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-orange-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-all group">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                        <span className="text-white font-medium">📱</span>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">Scan QR Code</span>
                                    <span className="ml-auto text-gray-400 group-hover:text-orange-500 transition-colors">→</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Notifications */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold text-gray-900 text-lg">Recent Notifications</h3>
                                <button className="text-blue-600 text-sm hover:text-blue-800 font-medium">View All</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">New Parcel Arrived</p>
                                        <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Parcel Ready for Pickup</p>
                                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Delivery Enquired</p>
                                        <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
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