import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server, Activity, Users, Database, Shield, Zap,
    Clock, RefreshCcw, HardDrive, FileText, MonitorPlay, Wifi, LogIn, ChevronRight, Award, ChevronDown
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
// import { api } from '../../services/api';
import { API_URL } from '../../config';

interface PlatformAnalyticsData {
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalFiles: number;
        totalAnalyses: number;
        totalStorageBytes: number;
        uploads7d: number;
        analyses7d: number;
    };
    analysisPerformance: {
        totalAnalyses: number;
        completed: number;
        failed: number;
        successRate: number;
        avgProcessingTimeMs: number;
        p95ProcessingTimeMs: number;
        minProcessingTimeMs?: number;
        medianProcessingTimeMs?: number;
        timeline: Array<{ date: string; completed: number; failed: number; total: number; avgTime: number }>;
        timeDistribution: Array<{ range: string; count: number }>;
    };
    userActivity: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        plan: string;
        isActive: boolean;
        createdAt: string;
        lastLoginAt: string;
        fileCount: number;
        analysisCount: number;
        storageUsed: number;
        accountAgeDays: number;
    }>;
    uploadTimeline: Array<{ date: string; uploads: number }>;
    fileTypes: Array<{ name: string; value: number }>;
}

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

// Colors for charts and glass
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const SUCCESS_COLOR = '#10b981';
const DANGER_COLOR = '#ef4444';

export const AdminAnalyticsView = () => {
    const { token } = useAuth();
    const [data, setData] = useState<PlatformAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'users' | 'storage'>('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = async () => {
        if (!token) return;
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/api/platform/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load platform data');
            const resData = await res.json();
            setData(resData);
            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            console.error('Failed to fetch platform analytics', err);
            setError(err.message || 'Failed to load platform data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Auto refresh every 60s
        return () => clearInterval(interval);
    }, [token]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex items-center justify-center h-full font-sans">
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-8 max-w-lg text-center backdrop-blur-md">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2 tracking-tight">Access Denied or Error</h3>
                    <p className="text-red-400/80 mb-6">{error}</p>
                    <button onClick={fetchData} className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-medium transition-colors">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overview, analysisPerformance, userActivity, uploadTimeline, fileTypes } = data;

    // Custom Tooltips for charts
    const GlassTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background-dark/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                    <p className="text-white/60 text-xs font-semibold mb-3 tracking-wider uppercase">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-white/80 text-sm font-medium">{entry.name}</span>
                            </div>
                            <span className="text-white font-bold text-sm">
                                {entry.name.includes('Time') ? formatTime(entry.value)
                                    : entry.name.includes('Storage') ? formatBytes(entry.value)
                                        : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const tabs = [
        { id: 'overview', label: 'Platform Pulse', icon: <Activity className="w-4 h-4" /> },
        { id: 'performance', label: 'Engine Performance', icon: <Zap className="w-4 h-4" /> },
        { id: 'users', label: 'Users & Sessions', icon: <Users className="w-4 h-4" /> },
        { id: 'storage', label: 'Storage & Internet', icon: <Wifi className="w-4 h-4" /> },
    ] as const;

    return (
        <div className="h-full flex flex-col bg-background font-sans overflow-hidden relative">
            {/* Soft background ambient glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 relative z-10 custom-scrollbar">

                {/* ══ HEADER ══ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold tracking-widest uppercase mb-4">
                            <Server className="w-3.5 h-3.5" />
                            Core Telemetry
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                            Platform Command
                            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse mt-2 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        </h1>
                        <p className="text-white/60 text-lg max-w-2xl font-medium">
                            Real-time structural health, internet usage, and deep architectural telemetry across your instance.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-100'
                                    : 'text-white/50 hover:text-white hover:bg-white/5 scale-95 hover:scale-100'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══ LAST REFRESH BAR ══ */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-8 text-sm">
                    <div className="flex items-center gap-3 text-white/50 font-medium pl-2">
                        <Clock className="w-4 h-4" />
                        Latest sync: <span className="text-white/80">{lastRefresh.toLocaleTimeString()}</span>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Syncing...' : 'Force Sync'}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >

                        {/* ═════════ TAB: OVERVIEW ═════════ */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Top KPI Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <MetricCard
                                        title="Active Sessions"
                                        value={overview.activeUsers}
                                        sub={`${overview.totalUsers} total registered`}
                                        icon={<Users className="w-6 h-6 text-blue-400" />}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Neural Analyses"
                                        value={overview.totalAnalyses}
                                        sub={`${overview.analyses7d} in last 7 days`}
                                        icon={<Activity className="w-6 h-6 text-primary" />}
                                        color="primary"
                                    />
                                    <MetricCard
                                        title="Engine Success Rate"
                                        value={`${analysisPerformance.successRate}%`}
                                        sub={`${analysisPerformance.failed} failures historically`}
                                        icon={<Award className="w-6 h-6 text-emerald-400" />}
                                        color="emerald"
                                    />
                                    <MetricCard
                                        title="P95 Response Time"
                                        value={formatTime(analysisPerformance.p95ProcessingTimeMs)}
                                        sub={`Avg is ${formatTime(analysisPerformance.avgProcessingTimeMs)}`}
                                        icon={<Zap className="w-6 h-6 text-amber-400" />}
                                        color="amber"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Activity Timeline */}
                                    <div className="col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
                                            <Activity className="w-5 h-5 text-primary" />
                                            Live Platform Activity
                                        </h3>
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={uploadTimeline.map((item, i) => ({
                                                    ...item,
                                                    analyses: analysisPerformance.timeline[i]?.total || 0
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                                    <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }} />
                                                    <Area type="monotone" dataKey="uploads" name="Internet Uploads" fill="url(#colorUploads)" stroke={COLORS[0]} strokeWidth={3} fillOpacity={1} />
                                                    <Line type="monotone" dataKey="analyses" name="Engine Computations" stroke={COLORS[1]} strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: '#1e1e2d' }} activeDot={{ r: 6, strokeWidth: 0, fill: COLORS[1] }} />
                                                    <defs>
                                                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Data Types */}
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
                                            <Database className="w-5 h-5 text-blue-400" />
                                            Data Typography
                                        </h3>
                                        {fileTypes.length > 0 ? (
                                            <div className="h-[250px] w-full flex justify-center mt-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={fileTypes}
                                                            innerRadius={65}
                                                            outerRadius={95}
                                                            paddingAngle={8}
                                                            dataKey="value"
                                                            stroke="none"
                                                            cornerRadius={8}
                                                        >
                                                            {fileTypes.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<GlassTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-[250px] flex items-center justify-center text-white/30">No data found</div>
                                        )}
                                        <div className="mt-4 space-y-3">
                                            {fileTypes.map((type, i) => (
                                                <div key={type.name} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                        <span className="text-white/70 font-medium">{type.name}</span>
                                                    </div>
                                                    <span className="text-white font-bold">{type.value} FILES</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═════════ TAB: ENGINE PERFORMANCE ═════════ */}
                        {activeTab === 'performance' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <MetricCard
                                        title="Peak Engine Speed"
                                        value={formatTime(analysisPerformance.minProcessingTimeMs || 0)}
                                        sub="Fastest processing record"
                                        icon={<Zap className="w-6 h-6 text-yellow-400" />}
                                        color="yellow"
                                    />
                                    <MetricCard
                                        title="Median Speed"
                                        value={formatTime(analysisPerformance.medianProcessingTimeMs || 0)}
                                        sub="Baseline operation tier"
                                        icon={<MonitorPlay className="w-6 h-6 text-blue-400" />}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Processing Failures"
                                        value={analysisPerformance.failed.toString()}
                                        sub="Total historically dropped"
                                        icon={<Shield className="w-6 h-6 text-red-500" />}
                                        color="red"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
                                            <Clock className="w-5 h-5 text-indigo-400" />
                                            Analysis Timing Distribution
                                        </h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analysisPerformance.timeDistribution} margin={{ top: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="range" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                                    <Bar dataKey="count" name="Analyses Count" radius={[6, 6, 0, 0]}>
                                                        {analysisPerformance.timeDistribution.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
                                            <Activity className="w-5 h-5 text-emerald-400" />
                                            Success vs Failure Index
                                        </h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analysisPerformance.timeline}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                    <Tooltip content={<GlassTooltip />} />
                                                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                                                    <Area type="monotone" dataKey="completed" name="Successful" stackId="1" stroke={SUCCESS_COLOR} fill={SUCCESS_COLOR} fillOpacity={0.4} />
                                                    <Area type="monotone" dataKey="failed" name="Failed" stackId="1" stroke={DANGER_COLOR} fill={DANGER_COLOR} fillOpacity={0.6} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═════════ TAB: USERS & LOGINS ═════════ */}
                        {activeTab === 'users' && (
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                                        <LogIn className="w-6 h-6 text-primary" />
                                        User Sessions & Identity Tracking
                                    </h3>
                                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-bold tracking-wide">
                                        {userActivity.length} IDENTITIES INDEXED
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-background-dark/30">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest">Identity</th>
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest text-center">Plan & Role</th>
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Age (Days)</th>
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Computations</th>
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Volatile Files</th>
                                                <th className="p-5 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Last Session</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {userActivity.map((user, i) => (
                                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${user.isActive ? 'bg-gradient-to-br from-primary to-blue-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-white/10'}`}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm tracking-wide">{user.name}</p>
                                                                <p className="text-white/40 text-xs mt-0.5">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <div className="flex flex-col gap-1.5 items-center">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${user.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/10 text-white/70 border border-white/10'}`}>
                                                                {user.plan}
                                                            </span>
                                                            <span className="text-white/50 text-xs">{user.role}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right font-medium text-white/80">{user.accountAgeDays}</td>
                                                    <td className="p-5 text-right">
                                                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                            {user.analysisCount}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right font-medium text-white/80">{user.fileCount}</td>
                                                    <td className="p-5 text-right">
                                                        <span className="text-white/60 text-sm whitespace-nowrap">
                                                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ═════════ TAB: STORAGE & INTERNET ═════════ */}
                        {activeTab === 'storage' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <MetricCard
                                        title="Allocated Size"
                                        value={formatBytes(overview.totalStorageBytes)}
                                        sub="Global system footprint"
                                        icon={<HardDrive className="w-6 h-6 text-indigo-400" />}
                                        color="indigo"
                                    />
                                    <MetricCard
                                        title="Volume Count"
                                        value={overview.totalFiles.toString()}
                                        sub="Distinct file entities"
                                        icon={<FileText className="w-6 h-6 text-fuchsia-400" />}
                                        color="fuchsia"
                                    />
                                    <MetricCard
                                        title="Traffic (7D)"
                                        value={overview.uploads7d.toString()}
                                        sub="Upload events last week"
                                        icon={<Wifi className="w-6 h-6 text-sky-400" />}
                                        color="sky"
                                    />
                                    <MetricCard
                                        title="Bandwidth Peak"
                                        value="Nominal"
                                        sub="Internet congestion state"
                                        icon={<Activity className="w-6 h-6 text-emerald-400" />}
                                        color="emerald"
                                    />
                                </div>

                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight">
                                        <Database className="w-5 h-5 text-primary" />
                                        User Data Volume Matrix
                                    </h3>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={userActivity.slice(0, 10)} margin={{ left: 20, right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13 }} axisLine={false} tickLine={false} dy={10} />
                                                <YAxis
                                                    stroke="rgba(255,255,255,0.3)"
                                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-10}
                                                    tickFormatter={(val) => formatBytes(val)}
                                                />
                                                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                                <Bar dataKey="storageUsed" name="Storage Allocation" radius={[8, 8, 0, 0]}>
                                                    {userActivity.slice(0, 10).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Reusable Metric Card matching the theme
function MetricCard({ title, value, sub, icon, color }: any) {
    const activeColorMap: Record<string, string> = {
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        primary: 'bg-primary/10 border-primary/20 text-primary',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        red: 'bg-red-500/10 border-red-500/20 text-red-400',
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
        sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    };
    const activeColor = activeColorMap[color] || 'bg-white/5 border-white/10 text-white';

    const glowColorMap: Record<string, string> = {
        blue: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        primary: 'shadow-[0_0_30px_rgba(139,92,246,0.1)]',
        emerald: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]',
        amber: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]',
        red: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]',
        indigo: 'shadow-[0_0_30px_rgba(99,102,241,0.1)]',
        fuchsia: 'shadow-[0_0_30px_rgba(217,70,239,0.1)]',
        sky: 'shadow-[0_0_30px_rgba(14,165,233,0.1)]',
        yellow: 'shadow-[0_0_30px_rgba(234,179,8,0.1)]',
    };
    const glowColor = glowColorMap[color] || '';

    return (
        <div className={`relative overflow-hidden rounded-3xl p-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 ${glowColor} group hover:bg-white/[0.05] transition-all duration-300`}>
            <div className={`absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className={`w-12 h-12 rounded-2xl ${activeColor} flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <p className="text-white/50 text-sm font-semibold mb-1 tracking-wide uppercase">{title}</p>
            <h4 className="text-3xl font-black text-white tracking-tight mb-2">{value}</h4>
            <p className="text-white/40 text-xs font-medium bg-black/20 rounded-lg px-2.5 py-1.5 inline-block">
                {sub}
            </p>
        </div>
    );
}
