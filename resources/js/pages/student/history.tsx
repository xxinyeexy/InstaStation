import AppLayout from '@/layouts/app-layout';
import { FileText, Search, SlidersHorizontal, Calendar, TrendingDown } from 'lucide-react';
import { useState } from 'react';

// Types for props from backend
interface Parcel {
    id: number;
    tracking_no: string;
    parcel_code: string;
    collected_at: string;
    fee: number;
    status: string;
}

interface HistoryProps {
    total_collections: number;
    collections_this_year: number;
    total_fees: number;
    parcels: Parcel[];
}

export default function History({ total_collections, collections_this_year, total_fees, parcels }: HistoryProps) {
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
    const [showFilters, setShowFilters] = useState(false);

    const filteredParcels = parcels
        .filter(
            (p) => (p.parcel_code && p.parcel_code.toLowerCase().includes(search.toLowerCase())) || (p.collected_at && p.collected_at.includes(search)),
        )
        .sort((a, b) => {
            if (sortOrder === 'recent') {
                return new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime();
            } else {
                return new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime();
            }
        });

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <span>Collected Parcels</span>
                    </h1>
                    <p className="mt-1 text-gray-500">History of all collected parcels</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Total Collections</div>
                        <div className="text-3xl font-bold text-gray-900">{total_collections}</div>
                        <div className="text-xs text-gray-500">All time</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
                        <div className="text-sm font-medium text-gray-600">This Year</div>
                        <div className="text-3xl font-bold text-gray-900">{collections_this_year}</div>
                        <div className="text-xs text-gray-500">2025 collections</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Total Fees</div>
                        <div className="text-3xl font-bold text-green-600">RM{total_fees.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">All collections</div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Search className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="text"
                                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10"
                                placeholder="Search by parcel code or collection date..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-xl border-2 px-5 font-medium shadow-sm transition ${
                                showFilters
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <SlidersHorizontal size={18} />
                            <span className="text-sm">Filters</span>
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <SlidersHorizontal size={16} />
                                <span>Filter Options</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Sort Order */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600">Sort By Date</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSortOrder('recent')}
                                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                                                sortOrder === 'recent'
                                                    ? 'border-green-600 bg-green-600 text-white shadow-md'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Calendar size={16} />
                                            Most Recent
                                        </button>
                                        <button
                                            onClick={() => setSortOrder('oldest')}
                                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                                                sortOrder === 'oldest'
                                                    ? 'border-green-600 bg-green-600 text-white shadow-md'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <TrendingDown size={16} />
                                            Oldest First
                                        </button>
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{filteredParcels.length}</div>
                                        <div className="text-xs text-gray-500">Results Found</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Collection History */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Collection History</h2>
                        <p className="text-sm text-gray-500">View and export your parcel collection records</p>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                        {filteredParcels.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="mb-3 text-gray-300" size={48} />
                                <p className="text-gray-400">No collections found.</p>
                            </div>
                        )}
                        <div className="divide-y divide-gray-100">
                            {filteredParcels.map((parcel) => (
                                <div key={parcel.id} className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                            <FileText className="text-blue-600" size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">Package</span>
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{parcel.parcel_code}</span>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">Collected on {parcel.collected_at}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow"
                                            onClick={() => {
                                                window.open(`/parcels/${parcel.id}/export`, '_blank');
                                            }}
                                        >
                                            <FileText size={16} />
                                            Export
                                        </button>
                                        <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">{parcel.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}