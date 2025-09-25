import AppLayout from '@/layouts/app-layout';
import { FileText } from 'lucide-react';
import { useState } from 'react';

// Types for props from backend
interface Parcel {
    id: number;
    tracking_no: string;
    parcel_code: string; // Added this line
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

    const filteredParcels = parcels.filter(
        (p) => (p.parcel_code && p.parcel_code.toLowerCase().includes(search.toLowerCase())) || (p.collected_at && p.collected_at.includes(search)),
    );

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
                    <div className="flex flex-col gap-1 rounded-xl border p-4">
                        <div className="text-sm text-gray-600">Total Collections</div>
                        <div className="text-2xl font-bold">{total_collections}</div>
                        <div className="text-xs text-gray-500">All time</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border p-4">
                        <div className="text-sm text-gray-600">This Year</div>
                        <div className="text-2xl font-bold">{collections_this_year}</div>
                        <div className="text-xs text-gray-500">2025 collections</div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border p-4">
                        <div className="text-sm text-gray-600">Total Fees</div>
                        <div className="text-2xl font-bold text-green-600">RM{total_fees.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">All collections</div>
                    </div>
                </div>

                {/* Search */}
                <div>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Search collection history..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Collection History */}
                <div className="rounded-xl border bg-white p-0">
                    <h2 className="border-b p-4 text-lg font-semibold">Collection History</h2>
                    <div className="max-h-[480px] space-y-0 overflow-y-auto p-4">
                        {filteredParcels.length === 0 && <div className="py-8 text-center text-gray-400">No collections found.</div>}
                        {filteredParcels.map((parcel) => (
                            <div key={parcel.id} className="mb-3 flex items-center justify-between rounded-lg border p-3 last:mb-0">
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        Package <span className="text-xs text-gray-500">{parcel.parcel_code}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">Collected on {parcel.collected_at}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                                        onClick={() => {
                                            window.open(`/parcels/${parcel.id}/export`, '_blank');
                                        }}
                                    >
                                        <FileText className="text-black-200" size={14} />
                                        Export
                                    </button>
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{parcel.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
