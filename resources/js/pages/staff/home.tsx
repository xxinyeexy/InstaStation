import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    LineChart, 
    Line, 
    Area, 
    AreaChart, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import { 
    Package, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Download,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

interface DashboardProps {
    overview: {
        totalParcels: number;
        newlyArrived: number;
        readyForCollection: number;
        unclaimed: number;
    };
    dailyOperations: Array<{
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
    trendValue 
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
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-3xl font-bold text-foreground">
                                {animatedValue.toLocaleString()}
                            </p>
                            {trend && trendValue && (
                                <div className={`flex items-center gap-1 text-sm ${
                                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    <span>{trendValue}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div 
                        className={`p-3 rounded-lg ${bgColor}`}
                        style={{ backgroundColor: bgColor }}
                    >
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

    return (
        <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {children}
        </div>
    );
};

export default function StaffHome() {
    const { props } = usePage<{ props: DashboardProps }>();
    const data = props as DashboardProps;
    const [activeTab, setActiveTab] = useState('arrivals');

    const handleExport = () => {
        // Implement export functionality
        console.log('Exporting dashboard data...');
    };

    return (
        <AppSidebarLayout>
            <div className="space-y-6 animate-in fade-in-0 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your parcels today.
                        </p>
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
                            bgColor="bg-blue-100"
                            iconColor="text-blue-600"
                            trend="up"
                            trendValue="+12%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={200}>
                        <OverviewCard
                            title="Newly Arrived"
                            value={data.overview.newlyArrived}
                            icon={Clock}
                            bgColor="bg-yellow-100"
                            iconColor="text-yellow-600"
                            trend="up"
                            trendValue="+8%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={300}>
                        <OverviewCard
                            title="Ready for Collection"
                            value={data.overview.readyForCollection}
                            icon={CheckCircle}
                            bgColor="bg-green-100"
                            iconColor="text-green-600"
                            trend="down"
                            trendValue="-3%"
                        />
                    </AnimatedChart>
                    <AnimatedChart delay={400}>
                        <OverviewCard
                            title="Unclaimed"
                            value={data.overview.unclaimed}
                            icon={AlertCircle}
                            bgColor="bg-red-100"
                            iconColor="text-red-600"
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
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setActiveTab('arrivals')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                            activeTab === 'arrivals' 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Daily Parcels Arrivals This Week
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('status')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                            activeTab === 'status' 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Operating Status
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={data.dailyOperations}>
                                        <defs>
                                            <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#374151" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#374151" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))', 
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
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
                                        <Line
                                            type="monotone"
                                            dataKey="lastYear"
                                            stroke="#9CA3AF"
                                            strokeDasharray="5 5"
                                            name="Last year"
                                        />
                                    </AreaChart>
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
                                    {data.parcelSenders.map((sender, index) => (
                                        <div key={sender.name} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{sender.name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                                        style={{ 
                                                            width: `${(sender.value / 50) * 100}%`,
                                                            animationDelay: `${index * 100}ms`
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground w-8">{sender.value}</span>
                                            </div>
                                        </div>
                                    ))}
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
                                    <BarChart data={data.parcelSize}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="size" />
                                        <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                                        <Tooltip 
                                            formatter={(value) => [`${value.toLocaleString()}`, 'Count']}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))', 
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            fill="#8B5CF6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
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
                                            {data.parcelStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => [`${value}%`, 'Percentage']}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))', 
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
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
                                    <BarChart data={data.collectionTime}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="time" />
                                        <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                                        <Tooltip 
                                            formatter={(value) => [`${value.toLocaleString()}`, 'Count']}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))', 
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            fill="#374151"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedChart>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
