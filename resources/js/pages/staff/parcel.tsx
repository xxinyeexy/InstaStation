import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Eye, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Parcel',
        href: '/staff/parcel',
    },
];

// Sample parcel data
const sampleParcels = [
    {
        id: 'P001',
        recipient: 'John Doe',
        sender: 'Jane Smith',
        status: 'Pending Payments',
        statusColor: 'orange',
    },
    {
        id: 'P002',
        recipient: 'Jane Doe',
        sender: 'Jane Smith',
        status: 'Ready for Collection',
        statusColor: 'emerald',
    },
    {
        id: 'P003',
        recipient: 'Alice Johnson',
        sender: 'Jane Smith',
        status: 'Unclaimed',
        statusColor: 'gray',
    },
    {
        id: 'P004',
        recipient: 'Bob Wilson',
        sender: 'Jane Smith',
        status: 'Collected',
        statusColor: 'blue',
    },
    {
        id: 'P005',
        recipient: 'Carol Brown',
        sender: 'Jane Smith',
        status: 'Pending Payments',
        statusColor: 'orange',
    },
];

type TabType = 'All Parcels' | 'Pending Payments' | 'Ready for Collection' | 'Collected' | 'Unclaimed';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('All Parcels');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter parcels based on active tab and search term
    const filteredParcels = sampleParcels.filter((parcel) => {
        const matchesTab = activeTab === 'All Parcels' || parcel.status === activeTab;
        const matchesSearch =
            searchTerm === '' ||
            parcel.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.sender.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    // Get counts for each tab
    const getCounts = () => {
        return {
            'All Parcels': sampleParcels.length,
            'Pending Payments': sampleParcels.filter((p) => p.status === 'Pending Payments').length,
            'Ready for Collection': sampleParcels.filter((p) => p.status === 'Ready for Collection').length,
            Collected: sampleParcels.filter((p) => p.status === 'Collected').length,
            Unclaimed: sampleParcels.filter((p) => p.status === 'Unclaimed').length,
        };
    };

    const counts = getCounts();

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pending Payments':
                return 'border-orange-200 bg-orange-100 text-orange-700';
            case 'Ready for Collection':
                return 'border-emerald-200 bg-emerald-100 text-emerald-700';
            case 'Collected':
                return 'border-blue-200 bg-blue-100 text-blue-700';
            case 'Unclaimed':
                return 'border-gray-200 bg-gray-100 text-gray-600';
            default:
                return 'border-gray-200 bg-gray-100 text-gray-600';
        }
    };

    const getTabStyles = (tab: TabType) => {
        const isActive = activeTab === tab;

        // Active and hover colors should match for each tab
        switch (tab) {
            case 'All Parcels':
                return isActive
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200';
            case 'Pending Payments':
                return isActive
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200';
            case 'Ready for Collection':
                return isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#EDE9FE] hover:text-[#5B21B6] hover:border-purple-200';
            case 'Collected':
                return isActive
                    ? 'bg-[#DCFCE7] text-[#166534] border-green-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#DCFCE7] hover:text-[#166534] hover:border-green-200';
            case 'Unclaimed':
                return isActive
                    ? 'bg-[#C5C5CF] text-black border-gray-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-[#C5C5CF] hover:text-black hover:border-gray-300';
            default:
                return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-700';
        }
    };

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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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

                            {/* Filter Tabs - Updated to match the image */}
                            <div className="flex gap-2 border-b border-gray-100 p-6">
                                {(['All Parcels', 'Pending Payments', 'Ready for Collection', 'Collected', 'Unclaimed'] as TabType[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${getTabStyles(tab)}`}
                                    >
                                        {tab} <span className="ml-1 rounded-full bg-white/50 px-2 py-0.5 text-xs">{counts[tab]}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Table Content */}
                            <div className="space-y-4 p-6">
                                {filteredParcels.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        {searchTerm ? `No parcels found matching "${searchTerm}"` : `No parcels in ${activeTab.toLowerCase()}`}
                                    </div>
                                ) : (
                                    filteredParcels.map((parcel) => (
                                        <div key={parcel.id} className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                        <span className="text-lg font-semibold text-blue-600">P</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-semibold text-gray-900">Package - {parcel.id}</p>
                                                        <p className="mt-1 text-sm text-gray-500">Recipient: {parcel.recipient}</p>
                                                        <p className="text-sm text-gray-400">The parcel - {parcel.sender}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span
                                                        className={`rounded-full border px-4 py-2 text-sm font-medium ${getStatusStyles(parcel.status)}`}
                                                    >
                                                        {parcel.status}
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
                                                        <button className="rounded-lg bg-[var(--mintgreen)] px-5 py-2 text-sm font-medium text-[var(--applegreen)] shadow-sm hover:bg-emerald-100">
                                                            Mark as Collected
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
