import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Download, Package, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardProps {
    overview: {
        totalParcels: number;
        newlyArrived: number;
        readyForCollection: number;
        unclaimed: number;
    };
    dailyArrivals: Array<{
        day: string;
        thisYear: number;
        lastYear: number;
    }>;
    dailyCollected: Array<{
        day: string;
        thisYear: number;
        lastYear: number;
    }>;
    parcelSenders: Array<{
        name: string;
        value: number;
    }>;
    parcelSize: Array<{
        size: string;
        count: number;
    }>;
    parcelStatus: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    collectionTime: Array<{
        time: string;
        count: number;
    }>;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/staff/home',
    },
];

const OverviewCard = ({
    title,
    value,
    icon: Icon,
    bgColor,
    iconColor,
    trend,
    trendValue,
}: {
    title: string;
    value: number;
    icon: any;
    bgColor: string;
    iconColor: string;
    trend?: 'up' | 'down';
    trendValue?: string;
}) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedValue(value);
        }, 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <p className="text-3xl font-bold text-foreground">{animatedValue.toLocaleString()}</p>
                            {trend && trendValue && (
                                <div
                                    className={`flex items-center gap-1 text-sm ${
                                        trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}
                                >
                                    {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    <span>{trendValue}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${bgColor}`} style={{ backgroundColor: bgColor }}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const AnimatedChart = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return <div className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>{children}</div>;
};

export default function StaffHome() {
    const data = usePage().props as unknown as DashboardProps;
    const [activeTab, setActiveTab] = useState('arrivals');
    const [showExport, setShowExport] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [format, setFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
    const defaultFilename = useMemo(() => {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `parcels_export_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    }, []);
    const [fileName, setFileName] = useState<string>(defaultFilename);
    const [selectedFields, setSelectedFields] = useState<string[]>([
        'parcel_code',
        'tracking_no',
        'parcel_status',
        'sender',
        'size',
        'created_at',
    ]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [sizeFilter, setSizeFilter] = useState<string>('');
    const [senderFilter, setSenderFilter] = useState<string>('');
    const [paymentFilter, setPaymentFilter] = useState<string>(''); // '', 'verified', 'unverified'
    const [fieldSearch, setFieldSearch] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string>('');
    const [previewColumns, setPreviewColumns] = useState<Array<{ key: string; label: string }>>([]);
    const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>> ([]);
    const [presets, setPresets] = useState<Array<{ name: string; data: any }>>([]);

    // Grouped fields for organization
    const fieldOptions = [
        { value: 'parcel_code', label: 'Parcel Code' },
        { value: 'tracking_no', label: 'Tracking No' },
        { value: 'parcel_status', label: 'Status' },
        { value: 'sender', label: 'Sender' },
        { value: 'size', label: 'Size' },
        { value: 'location', label: 'Location' },
        { value: 'created_at', label: 'Arrival Date' },
        { value: 'schedule', label: 'Schedule' },
        { value: 'time_slot', label: 'Time Slot' },
        { value: 'fee', label: 'Fee (RM)' },
        { value: 'student_name', label: 'Student Name' },
        { value: 'student_matric', label: 'Matric' },
        { value: 'payment_status', label: 'Payment Status' },
    ];

    const groupedFields = useMemo(() => {
        const byKey = (keys: string[]) => fieldOptions.filter((f) => keys.includes(f.value));
        return [
            { key: 'parcel', title: 'Parcel Details', items: byKey(['parcel_code', 'tracking_no', 'parcel_status', 'sender', 'size', 'location']) },
            { key: 'timeline', title: 'Timeline', items: byKey(['created_at', 'schedule', 'time_slot']) },
            { key: 'student', title: 'Student', items: byKey(['student_name', 'student_matric']) },
            { key: 'financial', title: 'Financial', items: byKey(['fee', 'payment_status']) },
        ];
    }, []);

    const statusOptions = ['Pending Payment', 'Approved', 'Ready for Collection', 'Collected', 'Unclaimed'];

    const toggleField = (val: string) => {
        setSelectedFields((prev) => (prev.includes(val) ? prev.filter((f) => f !== val) : [...prev, val]));
    };

    const toggleStatus = (val: string) => {
        setSelectedStatuses((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]));
    };

    const applyDatePreset = (preset: 'today' | 'thisWeek' | 'thisMonth' | 'last30') => {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
        if (preset === 'today') {
            const s = fmt(d);
            setStartDate(s);
            setEndDate(s);
            return;
        }
        if (preset === 'thisWeek') {
            const day = d.getDay();
            const diffToMonday = (day + 6) % 7; // Monday=0
            const start = new Date(d);
            start.setDate(d.getDate() - diffToMonday);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            setStartDate(fmt(start));
            setEndDate(fmt(end));
            return;
        }
        if (preset === 'thisMonth') {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            setStartDate(fmt(start));
            setEndDate(fmt(end));
            return;
        }
        if (preset === 'last30') {
            const start = new Date(d);
            start.setDate(d.getDate() - 30);
            setStartDate(fmt(start));
            setEndDate(fmt(d));
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem('exportPresets');
            if (saved) {
                setPresets(JSON.parse(saved));
            }
        } catch {}
    }, []);

    const savePresetsToStorage = (list: Array<{ name: string; data: any }>) => {
        setPresets(list);
        try {
            localStorage.setItem('exportPresets', JSON.stringify(list));
        } catch {}
    };

    const currentConfig = useMemo(() => ({
        startDate,
        endDate,
        format,
        fileName,
        selectedFields,
        selectedStatuses,
        sizeFilter,
        senderFilter,
        paymentFilter,
    }), [startDate, endDate, format, fileName, selectedFields, selectedStatuses, sizeFilter, senderFilter, paymentFilter]);

    const savePreset = () => {
        const name = prompt('Preset name');
        if (!name) return;
        const next = presets.filter((p) => p.name !== name).concat({ name, data: currentConfig });
        savePresetsToStorage(next);
    };

    const applyPreset = (name: string) => {
        const p = presets.find((x) => x.name === name);
        if (!p) return;
        const cfg = p.data || {};
        setStartDate(cfg.startDate || '');
        setEndDate(cfg.endDate || '');
        setFormat(cfg.format || 'csv');
        setFileName(cfg.fileName || defaultFilename);
        setSelectedFields(Array.isArray(cfg.selectedFields) ? cfg.selectedFields : selectedFields);
        setSelectedStatuses(Array.isArray(cfg.selectedStatuses) ? cfg.selectedStatuses : []);
        setSizeFilter(cfg.sizeFilter || '');
        setSenderFilter(cfg.senderFilter || '');
        setPaymentFilter(cfg.paymentFilter || '');
    };

    const deletePreset = (name: string) => {
        if (!confirm(`Delete preset "${name}"?`)) return;
        const next = presets.filter((p) => p.name !== name);
        savePresetsToStorage(next);
    };

    const selectAllFields = () => setSelectedFields(fieldOptions.map((f) => f.value));
    const clearAllFields = () => setSelectedFields([]);
    const selectGroup = (keys: string[]) => setSelectedFields((prev) => Array.from(new Set([...prev, ...keys])));
    const clearGroup = (keys: string[]) => setSelectedFields((prev) => prev.filter((f) => !keys.includes(f)));

    const handleExport = () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        selectedStatuses.forEach((s) => params.append('status[]', s));
        if (sizeFilter) params.append('size', sizeFilter);
        if (senderFilter) params.append('sender', senderFilter);
        if (paymentFilter) params.append('payment', paymentFilter);
        selectedFields.forEach((f) => params.append('fields[]', f));
        if (format) params.append('format', format);
        if (fileName) params.append('filename', fileName);

        // Open CSV download in new tab
        const url = `/staff/parcels/export/bulk?${params.toString()}`;
        window.open(url, '_blank');
        setShowExport(false);
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        setPreviewError('');
        setPreviewRows([]);
        setPreviewColumns([]);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            selectedStatuses.forEach((s) => params.append('status[]', s));
            if (sizeFilter) params.append('size', sizeFilter);
            if (senderFilter) params.append('sender', senderFilter);
            if (paymentFilter) params.append('payment', paymentFilter);
            selectedFields.forEach((f) => params.append('fields[]', f));
            params.append('preview', '1');
            params.append('limit', '20');
            params.append('format', 'json');
            const res = await fetch(`/staff/parcels/export/bulk?${params.toString()}`, { method: 'GET' });
            if (!res.ok) throw new Error(`Preview failed (${res.status})`);
            const json = await res.json();
            setPreviewColumns(json.columns || []);
            setPreviewRows(json.rows || []);
        } catch (e: any) {
            setPreviewError(e?.message || 'Failed to load preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6 duration-500 animate-in fade-in-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                        <p className="text-muted-foreground">Welcome back! Here's what's happening with your parcels today.</p>
                    </div>
                    <Button onClick={() => setShowExport(true)} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>

                {showExport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-5xl rounded-lg border bg-card p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Export Parcels</h3>
                                <button onClick={() => setShowExport(false)} className="rounded p-1 hover:bg-muted">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Date Range */}
                                <div>
                                    <div className="mb-2 text-sm font-medium">Select Date Range</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">Start</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border px-2 py-2" />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">End</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border px-2 py-2" />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-xs text-muted-foreground">Quick presets:</span>
                                        <button onClick={() => applyDatePreset('today')} className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80">Today</button>
                                        <button onClick={() => applyDatePreset('thisWeek')} className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80">This Week</button>
                                        <button onClick={() => applyDatePreset('thisMonth')} className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80">This Month</button>
                                        <button onClick={() => applyDatePreset('last30')} className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80">Last 30 Days</button>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div>
                                    <div className="mb-2 text-sm font-medium">Filters</div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">Status</label>
                                            <div className="flex flex-wrap gap-2">
                                                {statusOptions.map((s) => (
                                                    <label key={s} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${selectedStatuses.includes(s) ? 'bg-secondary' : ''}`}>
                                                        <input type="checkbox" className="hidden" checked={selectedStatuses.includes(s)} onChange={() => toggleStatus(s)} />
                                                        <span>{s}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="mb-1 block text-xs text-muted-foreground">Size</label>
                                                <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="w-full rounded-md border px-2 py-2">
                                                    <option value="">All</option>
                                                    <option value="Small">Small</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Large">Large</option>
                                                    <option value="Extra Large">Extra Large</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs text-muted-foreground">Payment</label>
                                                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full rounded-md border px-2 py-2">
                                                    <option value="">All</option>
                                                    <option value="verified">Verified</option>
                                                    <option value="unverified">Unverified</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">Sender (contains)</label>
                                            <input value={senderFilter} onChange={(e) => setSenderFilter(e.target.value)} className="w-full rounded-md border px-2 py-2" placeholder="e.g. SHOPEE" />
                                        </div>
                                    </div>
                                </div>

                                {/* Format + Filename */}
                                <div>
                                    <div className="mb-2 text-sm font-medium">Format & File</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">Format</label>
                                            <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full rounded-md border px-2 py-2">
                                                <option value="csv">CSV</option>
                                                <option value="pdf">PDF</option>
                                                <option value="json">JSON</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-muted-foreground">File name</label>
                                            <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full rounded-md border px-2 py-2" placeholder="parcels_export_YYYYMMDD" />
                                        </div>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="md:col-span-2">
                                    <div className="mb-2 text-sm font-medium">Choose Fields</div>
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <input value={fieldSearch} onChange={(e) => setFieldSearch(e.target.value)} className="w-full max-w-xs rounded-md border px-2 py-2" placeholder="Search fields..." />
                                        <div className="ml-auto flex gap-2">
                                            <button onClick={selectAllFields} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">Select All</button>
                                            <button onClick={clearAllFields} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">Deselect All</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                        {groupedFields.map((grp) => {
                                            const keys = grp.items.map((i) => i.value);
                                            const filtered = grp.items.filter((i) => i.label.toLowerCase().includes(fieldSearch.toLowerCase()));
                                            return (
                                                <div key={grp.key} className="rounded-md border p-2">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-xs font-semibold uppercase text-muted-foreground">{grp.title}</div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => selectGroup(keys)} className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/80">All</button>
                                                            <button onClick={() => clearGroup(keys)} className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/80">None</button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {filtered.map((f) => (
                                                            <label key={f.value} className={`flex items-center gap-2 rounded p-1 ${selectedFields.includes(f.value) ? 'bg-muted' : ''}`}>
                                                                <input type="checkbox" checked={selectedFields.includes(f.value)} onChange={() => toggleField(f.value)} />
                                                                <span className="text-sm">{f.label}</span>
                                                            </label>
                                                        ))}
                                                        {filtered.length === 0 && (
                                                            <div className="text-xs text-muted-foreground">No fields</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Presets & Actions */}
                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <div className="mr-auto flex items-center gap-2">
                                    <div className="text-sm font-medium">Presets</div>
                                    <select className="rounded-md border px-2 py-2" onChange={(e) => e.target.value && applyPreset(e.target.value)} value="">
                                        <option value="" disabled>
                                            Apply preset...
                                        </option>
                                        {presets.map((p) => (
                                            <option key={p.name} value={p.name}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {presets.length > 0 && (
                                        <button
                                            className="rounded-md border px-2 py-2 text-xs hover:bg-muted"
                                            onClick={() => {
                                                const name = prompt('Delete which preset?', presets[0]?.name || '');
                                                if (name) deletePreset(name);
                                            }}
                                        >
                                            Delete preset
                                        </button>
                                    )}
                                    <button className="rounded-md border px-2 py-2 text-xs hover:bg-muted" onClick={savePreset}>
                                        Save current as preset
                                    </button>
                                </div>
                                <button className="rounded-md border px-4 py-2 hover:bg-muted" onClick={() => setShowExport(false)}>
                                    Cancel
                                </button>
                                <button onClick={handlePreview} className="rounded-md border px-4 py-2 hover:bg-muted">
                                    Preview
                                </button>
                                <Button onClick={handleExport} className="flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Export {format.toUpperCase()}
                                </Button>
                            </div>

                            {/* Preview Table */}
                            {(previewLoading || previewError || previewRows.length > 0) && (
                                <div className="mt-4 max-h-80 overflow-auto rounded-md border">
                                    {previewLoading && <div className="p-4 text-sm text-muted-foreground">Loading preview…</div>}
                                    {previewError && <div className="p-4 text-sm text-red-500">{previewError}</div>}
                                    {!previewLoading && !previewError && previewRows.length > 0 && (
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-muted">
                                                <tr>
                                                    {previewColumns.map((c) => (
                                                        <th key={c.key} className="px-3 py-2 text-left font-medium">
                                                            {c.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewRows.map((row, i) => (
                                                    <tr key={i} className="border-t">
                                                        {previewColumns.map((c) => (
                                                            <td key={c.key} className="px-3 py-1">
                                                                {row[c.key] ?? ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <AnimatedChart delay={100}>
                        <OverviewCard
                            title="Total Parcels"
                            value={data.overview.totalParcels}
                            icon={Package}
                            bgColor="bg-blue-100 dark:bg-blue-500/20"
                            iconColor="text-blue-600 dark:text-blue-400"
                            trend="up"
                            trendValue="+12%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={200}>
                        <OverviewCard
                            title="Newly Arrived"
                            value={data.overview.newlyArrived}
                            icon={Clock}
                            bgColor="bg-yellow-100 dark:bg-yellow-500/20"
                            iconColor="text-yellow-600 dark:text-yellow-400"
                            trend="up"
                            trendValue="+8%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={300}>
                        <OverviewCard
                            title="Ready for Collection"
                            value={data.overview.readyForCollection}
                            icon={CheckCircle}
                            bgColor="bg-green-100 dark:bg-green-500/20"
                            iconColor="text-green-600 dark:text-green-400"
                            trend="down"
                            trendValue="-3%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={400}>
                        <OverviewCard
                            title="Unclaimed"
                            value={data.overview.unclaimed}
                            icon={AlertCircle}
                            bgColor="bg-red-100 dark:bg-red-500/20"
                            iconColor="text-red-600 dark:text-red-400"
                            trend="down"
                            trendValue="-15%"
                        />
                    </AnimatedChart>
                </div>

                {/* Main Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Daily Operations Overview */}
                    <AnimatedChart delay={500}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Operations Overview</CardTitle>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('arrivals')}
                                        className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                            activeTab === 'arrivals'
                                                ? 'bg-secondary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Daily Parcels Arrivals This Week
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('collected')}
                                        className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                            activeTab === 'collected'
                                                ? 'bg-secondary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Daily Parcels Collected
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    {(() => {
                                        const chartData = activeTab === 'arrivals' ? data.dailyArrivals : data.dailyCollected;
                                        // compute dynamic max across both series (thisYear and lastYear)
                                        const rawMax = Math.max(1, ...chartData.flatMap((d) => [Number(d.thisYear || 0), Number(d.lastYear || 0)]));
                                        // add 10% padding and round up to nearest 10 for nicer ticks
                                        const padded = Math.ceil(rawMax * 1.1);
                                        let roundedMax = Math.max(10, Math.ceil(padded / 10) * 10);
                                        // Ensure tick values are integers: choose a step that's an integer
                                        const step = Math.ceil(roundedMax / 4);
                                        roundedMax = step * 4; // make max divisible by 4
                                        const ticks = [0, step, step * 2, step * 3, step * 4];

                                        return (
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="3%" stopColor="#FFFFFF" stopOpacity={0.8} />
                                                        <stop offset="98%" stopColor="#FF029A" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis dataKey="day" />
                                                <YAxis domain={[0, roundedMax]} ticks={ticks} />
                                                <Tooltip
                                                    formatter={(value) => [`${Number(value).toLocaleString()}`, 'Count']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Legend />
                                                <Area
                                                    type="monotone"
                                                    dataKey="thisYear"
                                                    stroke="#374151"
                                                    fillOpacity={1}
                                                    fill="url(#colorThisYear)"
                                                    name="This year"
                                                />
                                            </AreaChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedChart>

                    {/* Parcel Senders Distribution */}
                    <AnimatedChart delay={600}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Parcel Senders Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(() => {
                                        const maxValue = Math.max(...data.parcelSenders.map((s) => s.value), 1);
                                        return data.parcelSenders.map((sender, index) => (
                                            <div key={sender.name} className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{sender.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-secondary transition-all duration-1000 ease-out"
                                                            style={{
                                                                width: `${(sender.value / maxValue) * 100}%`,
                                                                animationDelay: `${index * 100}ms`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-sm text-muted-foreground">{sender.value}</span>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </AnimatedChart>
                </div>

                {/* Bottom Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Parcel Size */}
                    <AnimatedChart delay={700}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Parcel Size</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    {(() => {
                                        const rawMax = Math.max(1, ...data.parcelSize.map((d) => Number(d.count || 0)));
                                        const padded = Math.ceil(rawMax * 1.1);
                                        // round up to nearest 10 for nicer ticks, but allow small ranges
                                        let roundedMax = Math.max(10, Math.ceil(padded / 10) * 10);
                                        // choose integer step divisible into 4 parts
                                        const step = Math.max(1, Math.ceil(roundedMax / 4));
                                        roundedMax = step * 4;
                                        const ticks = [0, step, step * 2, step * 3, step * 4];

                                        return (
                                            <BarChart data={data.parcelSize}>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis dataKey="size" />
                                                <YAxis domain={[0, roundedMax]} ticks={ticks} />
                                                <Tooltip
                                                    formatter={(value) => [`${Number(value).toLocaleString()}`, 'Count']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="#FF029A" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedChart>

                    {/* Parcel Status Distribution */}
                    <AnimatedChart delay={800}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Parcel Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={data.parcelStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {data.parcelStatus.map((entry, index) => {
                                                // Professional color palette
                                                const colors = ['#6366F1', '#FF029A', '#7B40F2', '#34c759', '#191818'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value}%`, 'Percentage']}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedChart>

                    {/* Collection Time Distribution */}
                    <AnimatedChart delay={900}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Time Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    {(() => {
                                        const rawMax = Math.max(1, ...data.collectionTime.map((d) => Number(d.count || 0)));
                                        const padded = Math.ceil(rawMax * 1.1);
                                        let roundedMax = Math.max(10, Math.ceil(padded / 10) * 10);
                                        const step = Math.max(1, Math.ceil(roundedMax / 4));
                                        roundedMax = step * 4;
                                        const ticks = [0, step, step * 2, step * 3, step * 4];

                                        return (
                                            <BarChart data={data.collectionTime}>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                {/**
                                                 Custom multi-line tick so long timeslot labels like
                                                 "9:00 AM - 10:00 AM" show fully across two lines.
                                                 interval=0 forces all ticks to render.
                                                */}
                                                <XAxis
                                                    dataKey="time"
                                                    height={60}
                                                    interval={0}
                                                    tick={({ x, y, payload }) => {
                                                        const parts = String(payload.value).split(' - ');
                                                        return (
                                                            <text x={x} y={y + 18} textAnchor="middle" fill="#6B7280" style={{ fontSize: 12 }}>
                                                                {parts.length === 2 ? (
                                                                    <>
                                                                        <tspan x={x} dy={0}>
                                                                            {parts[0]}
                                                                        </tspan>
                                                                        <tspan x={x} dy={16}>
                                                                            -
                                                                        </tspan>
                                                                        <tspan x={x} dy={16}>
                                                                            {parts[1]}
                                                                        </tspan>
                                                                    </>
                                                                ) : (
                                                                    parts.map((part, i) => (
                                                                        <tspan key={i} x={x} dy={i === 0 ? 0 : 16}>
                                                                            {part}
                                                                        </tspan>
                                                                    ))
                                                                )}
                                                            </text>
                                                        );
                                                    }}
                                                />
                                                <YAxis domain={[0, roundedMax]} ticks={ticks} />
                                                <Tooltip
                                                    formatter={(value) => [`${Number(value).toLocaleString()}`, 'Count']}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="#FF029A" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedChart>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
