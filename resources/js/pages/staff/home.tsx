import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Download, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
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

    const handleExport = () => {
        // Implement export functionality
        console.log('Exporting dashboard data...');
    };

    return (
        <AppSidebarLayout>
            <div className="space-y-6 p-6 duration-500 animate-in fade-in-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                        <p className="text-muted-foreground">Welcome back! Here's what's happening with your parcels today.</p>
                    </div>
                    <Button onClick={handleExport} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>

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
                                                <Line type="monotone" dataKey="lastYear" stroke="#9CA3AF" strokeDasharray="5 5" name="Last year" />
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
