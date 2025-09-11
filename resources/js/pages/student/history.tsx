import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { FileText } from 'lucide-react';


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

export default function History({
  total_collections,
  collections_this_year,
  total_fees,
  parcels,
}: HistoryProps) {
  const [search, setSearch] = useState('');

  const filteredParcels = parcels.filter(
    (p) =>
      (p.tracking_no && p.tracking_no.toLowerCase().includes(search.toLowerCase())) ||
      (p.collected_at && p.collected_at.includes(search))
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>Collected Parcels</span>
          </h1>
          <p className="text-gray-500 mt-1">History of all collected parcels</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 flex flex-col gap-1">
            <div className="text-sm text-gray-600">Total Collections</div>
            <div className="text-2xl font-bold">{total_collections}</div>
            <div className="text-xs text-gray-500">All time</div>
          </div>
          <div className="rounded-xl border p-4 flex flex-col gap-1">
            <div className="text-sm text-gray-600">This Year</div>
            <div className="text-2xl font-bold">{collections_this_year}</div>
            <div className="text-xs text-gray-500">2025 collections</div>
          </div>
          <div className="rounded-xl border p-4 flex flex-col gap-1">
            <div className="text-sm text-gray-600">Total Fees</div>
            <div className="text-2xl font-bold text-green-600">
              RM{total_fees.toFixed(2)}
            </div>
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
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-lg font-semibold mb-4">Collection History</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {filteredParcels.length === 0 && (
              <div className="text-gray-400 text-center py-8">No collections found.</div>
            )}
            {filteredParcels.map((parcel) => (
              <div
                key={parcel.id}
                className="flex items-center justify-between border-b last:border-b-0 pb-4 last:pb-0"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    Package <span className="text-xs text-gray-500">{parcel.parcel_code}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Collected on {parcel.collected_at}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="border rounded-md px-3 py-1 text-sm flex items-center gap-1 hover:bg-gray-50"
                    onClick={() => {
                      window.open(`/parcels/${parcel.id}/export`, '_blank');
                    }}
                  >
                         <FileText className="text-black-200" />

                    Export
                  </button>
                  <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                    {parcel.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
