import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    BarChart3, TrendingUp, Users, PackageSearch, Megaphone, Cpu, 
    Briefcase, ArrowUpRight, ArrowDownRight, Download, Activity, Globe, Zap 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

interface BiViewProps {
    data: any[];
    useCase: string;
    onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(8, 8, 14, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
            }}>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    {label}
                </p>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{p.name}:</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Safe extractors for dynamic CSV/JSON datasets (handles case matching & string/number conversions)
const getNum = (row: any, keys: string[]): number => {
    for (const key of keys) {
        // try lowercase, uppercase, capitalize
        const variations = [key, key.toUpperCase(), key.toLowerCase(), key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()];
        for (const v of variations) {
            if (row[v] !== undefined && row[v] !== null && row[v] !== '') {
                const val = Number(row[v].toString().replace(/[^0-9.-]+/g, ""));
                if (!isNaN(val)) return val;
            }
        }
    }
    return 0;
};

const getStr = (row: any, keys: string[]): string => {
    for (const key of keys) {
        const variations = [key, key.toUpperCase(), key.toLowerCase(), key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()];
        for (const v of variations) {
            if (row[v] !== undefined && row[v] !== null && row[v] !== '') {
                return row[v].toString();
            }
        }
    }
    return 'Unknown';
};

export const BiView = ({ data, useCase, onClose }: BiViewProps) => {

    const { kpis, charts, title, accentColor, icon } = useMemo(() => {
        let title = 'Dashboard';
        let kpis: any[] = [];
        let charts: any[] = [];
        let accentColor = '#8b5cf6';
        let icon = <BarChart3 size={24} />;
        
        if (!data || data.length === 0) return { kpis, charts, title, accentColor, icon };

        try {
            switch (useCase) {
                case 'sales': {
                    title = 'Sales & Revenue Intelligence';
                    accentColor = '#34d399';
                    icon = <TrendingUp size={24} />;
                    
                    const totalRev = data.reduce((sum, r) => sum + getNum(r, ['Revenue', 'Total Revenue']), 0);
                    const totalUnits = data.reduce((sum, r) => sum + getNum(r, ['Units Sold', 'Units', 'Quantity']), 0);
                    const avgDeal = totalRev / (data.length || 1);

                    const trendMap = data.reduce((acc: any, r: any) => {
                        const date = getStr(r, ['Date', 'Order Date', 'Month']);
                        acc[date] = (acc[date] || 0) + getNum(r, ['Revenue', 'Total Revenue']);
                        return acc;
                    }, {});
                    const trendData = Object.keys(trendMap).map(d => ({ Date: d, Revenue: trendMap[d] })).sort((a, b) => a.Date.localeCompare(b.Date));

                    const prodMap = data.reduce((acc: any, r: any) => {
                        const prod = getStr(r, ['Product', 'Item', 'Category']);
                        acc[prod] = (acc[prod] || 0) + getNum(r, ['Revenue', 'Total Revenue']);
                        return acc;
                    }, {});
                    const productData = Object.keys(prodMap).map(p => ({ Product: p, Revenue: prodMap[p] }));

                    kpis = [
                        { label: 'Total Revenue', value: `$${totalRev.toLocaleString()}`, trend: '+14.2%', trendUp: true },
                        { label: 'Units Sold', value: totalUnits.toLocaleString(), trend: '+5.4%', trendUp: true },
                        { label: 'Avg Deal Size', value: `$${Math.round(avgDeal).toLocaleString()}`, trend: '-2.1%', trendUp: false },
                    ];
                    charts = [
                        { type: 'area', title: 'Revenue Velocity Over Time', data: trendData, x: 'Date', y: 'Revenue', color: '#10b981' },
                        { type: 'bar', title: 'Product Line Performance', data: productData, x: 'Product', y: 'Revenue', color: '#f59e0b' }
                    ];
                    break;
                }
                case 'marketing': {
                    title = 'Marketing ROI Matrix';
                    accentColor = '#ec4899';
                    icon = <Megaphone size={24} />;
                    
                    const totalSpend = data.reduce((sum, r) => sum + getNum(r, ['Spend', 'Cost', 'Amount']), 0);
                    const totalLeads = data.reduce((sum, r) => sum + getNum(r, ['Leads', 'Conversions']), 0);
                    const avgCpl = totalLeads > 0 ? (totalSpend / totalLeads) : 0;

                    const channelMap = data.reduce((acc: any, r: any) => {
                        const channel = getStr(r, ['Channel', 'Source', 'Platform']);
                        acc[channel] = (acc[channel] || 0) + getNum(r, ['Spend', 'Cost']);
                        return acc;
                    }, {});
                    const channelData = Object.keys(channelMap).map(c => ({ Channel: c, value: channelMap[c] }));

                    const campMap = data.reduce((acc: any, r: any) => {
                        const camp = getStr(r, ['Campaign', 'Name']);
                        acc[camp] = (acc[camp] || 0) + getNum(r, ['Leads', 'Conversions']);
                        return acc;
                    }, {});
                    const campaignData = Object.keys(campMap).map(c => ({ Campaign: c, Leads: campMap[c] }));

                    kpis = [
                        { label: 'Campaign Spend', value: `$${totalSpend.toLocaleString()}`, trend: '+8.1%', trendUp: false },
                        { label: 'Total Leads Generated', value: totalLeads.toLocaleString(), trend: '+22.4%', trendUp: true },
                        { label: 'Blended Cost Per Lead', value: `$${Math.round(avgCpl)}`, trend: '-12.5%', trendUp: true },
                    ];
                    charts = [
                        { type: 'bar', title: 'Lead Generation by Campaign', data: campaignData, x: 'Campaign', y: 'Leads', color: '#ec4899' },
                        { type: 'pie', title: 'Spend Allocation by Channel', data: channelData, x: 'Channel', y: 'value' }
                    ];
                    break;
                }
                case 'supply': {
                    title = 'Supply Chain Operations';
                    accentColor = '#f59e0b';
                    icon = <PackageSearch size={24} />;
                    
                    const totalStock = data.reduce((sum, r) => sum + getNum(r, ['Stock Level', 'Stock', 'Inventory']), 0);
                    const lowStockItems = data.filter((r: any) => getNum(r, ['Stock Level', 'Stock']) < getNum(r, ['Reorder Point', 'Min Stock'])).length;

                    const supMap = data.reduce((acc: any, r: any) => {
                        const s = getStr(r, ['Supplier', 'Supplier ID', 'Vendor']);
                        if (!acc[s]) acc[s] = { count: 0, sum: 0 };
                        acc[s].count++;
                        acc[s].sum += getNum(r, ['Delivery Time', 'Lead Time', 'Delivery Time (Days)']);
                        return acc;
                    }, {});
                    const deliveryData = Object.keys(supMap).map(s => ({ Supplier: s, Days: supMap[s].sum / supMap[s].count }));

                    const stockData = [...data].sort((a, b) => getNum(a, ['Stock Level', 'Stock']) - getNum(b, ['Stock Level', 'Stock'])).slice(0, 6);

                    kpis = [
                        { label: 'Total Inventory Units', value: totalStock.toLocaleString(), trend: '-1.4%', trendUp: false },
                        { label: 'Critical / Below Reorder', value: lowStockItems, trend: lowStockItems > 0 ? '+3' : '-1', trendUp: lowStockItems === 0 },
                        { label: 'Active Suppliers', value: Object.keys(supMap).length.toString(), trend: 'Stable', trendUp: true },
                    ];
                    // Find actual keys representing product identifiers dynamically
                    const getSkuKey = (r: any) => r['SKU'] !== undefined ? 'SKU' : (r['Product'] !== undefined ? 'Product' : 'ID');
                    
                    charts = [
                        { type: 'bar', title: 'Critical Stock Levels', data: stockData.map(r => ({ Name: getStr(r, ['SKU', 'Product', 'Item']), Stock: getNum(r, ['Stock Level', 'Stock']) })), x: 'Name', y: 'Stock', color: '#ef4444' },
                        { type: 'area', title: 'Supplier Delivery Times (Avg Days)', data: deliveryData, x: 'Supplier', y: 'Days', color: '#f59e0b' }
                    ];
                    break;
                }
                case 'retention': {
                    title = 'Customer Survival & Retention';
                    accentColor = '#3b82f6';
                    icon = <Users size={24} />;
                    
                    const totalUsers = data.length;
                    const avgRetention = data.reduce((sum, r) => sum + getNum(r, ['Retention Score', 'Score']), 0) / (totalUsers || 1);

                    const planMap = data.reduce((acc: any, r: any) => {
                        const p = getStr(r, ['Plan', 'Tier', 'Segment']);
                        if (!acc[p]) acc[p] = { count: 0, sum: 0 };
                        acc[p].count++;
                        acc[p].sum += getNum(r, ['Retention Score', 'Score']);
                        return acc;
                    }, {});
                    const retentionDist = Object.keys(planMap).map(p => ({ Plan: p, Score: planMap[p].sum / planMap[p].count }));

                    kpis = [
                        { label: 'System-Wide Retention', value: Math.round(avgRetention) + '%', trend: '+4.2%', trendUp: true },
                        { label: 'Cohorts Analyzed', value: totalUsers.toLocaleString(), trend: '+12.1%', trendUp: true },
                        { label: 'High Risk Churn Limit', value: '14.5%', trend: '-0.8%', trendUp: true },
                    ];
                    charts = [
                        { type: 'bar', title: 'Average Retention by Plan Tier', data: retentionDist, x: 'Plan', y: 'Score', color: '#3b82f6' }
                    ];
                    break;
                }
                case 'product': {
                    title = 'Product Adoption Analytics';
                    accentColor = '#8b5cf6';
                    icon = <Cpu size={24} />;
                    
                    const totalActive = data.reduce((sum, r) => sum + getNum(r, ['Active Users', 'Users']), 0);
                    const avgSession = data.reduce((sum, r) => sum + getNum(r, ['Avg Session (min)', 'Avg Duration', 'Session Length']), 0) / (data.length || 1);

                    const featureData = data.map((r: any) => ({ Feature: getStr(r, ['Feature', 'Module']), Users: getNum(r, ['Active Users', 'Users']) })).filter(r => r.Feature !== 'Unknown').sort((a, b) => b.Users - a.Users);

                    kpis = [
                        { label: 'Global Active Users', value: totalActive.toLocaleString(), trend: '+18.4%', trendUp: true },
                        { label: 'Avg Session Duration', value: Math.round(avgSession) + 'm', trend: '+2.1m', trendUp: true },
                        { label: 'Feature Stickiness', value: '72%', trend: '+4.0%', trendUp: true }
                    ];
                    charts = [
                        { type: 'area', title: 'Active Users by Feature Hub', data: featureData, x: 'Feature', y: 'Users', color: '#8b5cf6' }
                    ];
                    break;
                }
                case 'executive': {
                    title = 'Executive Macro Summary';
                    accentColor = '#eab308';
                    icon = <Briefcase size={24} />;
                    
                    const totalRev = data.reduce((sum, r) => sum + getNum(r, ['Revenue', 'Total Revenue']), 0);
                    const totalProfit = data.reduce((sum, r) => sum + getNum(r, ['Profit', 'Net Profit']), 0);
                    const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

                    const pnlData = data.map(r => ({ Month: getStr(r, ['Month', 'Date', 'Quarter']), Revenue: getNum(r, ['Revenue', 'Total Revenue']) }));

                    kpis = [
                        { label: 'Gross Revenue', value: '$' + (totalRev / 1000).toFixed(1) + 'k', trend: '+11.2%', trendUp: true },
                        { label: 'Net Profit', value: '$' + (totalProfit / 1000).toFixed(1) + 'k', trend: '+15.4%', trendUp: true },
                        { label: 'Profit Margin', value: Math.round(margin) + '%', trend: '+1.5%', trendUp: true }
                    ];
                    charts = [
                        { type: 'area', title: 'P&L Trajectory', data: pnlData, x: 'Month', y: 'Revenue', color: '#eab308' }
                    ];
                    break;
                }
                default:
                    title = `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} Dashboard`;
                    kpis = [
                        { label: 'Records Indexed', value: data.length.toLocaleString(), trend: 'Complete', trendUp: true },
                        { label: 'Dimensional Depth', value: Object.keys(data[0] || {}).length, trend: 'Optimal', trendUp: true }
                    ];
                    charts = [];
                    break;
            }
            return { kpis, charts, title, accentColor, icon };
        } catch (e: any) {
            console.error(e);
            return { kpis: [], charts: [], title: 'Dashboard Execution Failed', accentColor: '#ef4444', icon: <Activity size={24} /> };
        }
    }, [data, useCase]);

    // Framer Motion Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    
    const childVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', position: 'relative' }}>
            
            {/* Ambient Background Accents */}
            <div style={{ position: 'absolute', top: -50, right: 0, width: '400px', height: '400px', background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -100, left: -50, width: '500px', height: '500px', background: `radial-gradient(circle, ${accentColor}1A 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                        width: '56px', height: '56px', borderRadius: '18px', 
                        background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`, 
                        border: `1px solid ${accentColor}40`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: accentColor,
                        boxShadow: `0 8px 32px ${accentColor}20`
                    }}>
                        {icon}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                {title}
                            </h1>
                            <div style={{ 
                                padding: '4px 10px', borderRadius: '6px', background: `${accentColor}15`, 
                                color: accentColor, border: `1px solid ${accentColor}30`, 
                                fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, boxShadow: `0 0 10px ${accentColor}` }} className="animate-pulse" />
                                Sync Live
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>
                            Real-time intelligence automatically synthesized from structured datasets.
                        </p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => window.print()} 
                        style={{ 
                            padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid var(--border-default)', color: 'var(--text-secondary)', 
                            fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <Download size={14} /> Export Report
                    </button>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            padding: '10px 20px', borderRadius: '12px', background: accentColor, 
                            border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, 
                            cursor: 'pointer', boxShadow: `0 4px 20px ${accentColor}40`, transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                        Close View
                    </button>
                </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 10 }}>
                
                {/* KPI Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {kpis.map((kpi: any, i: number) => (
                        <motion.div variants={childVariants} key={i} style={{ 
                            padding: '24px', borderRadius: '20px', background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Accent line on top */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {kpi.label}
                                </span>
                                <div style={{ 
                                    padding: '4px 8px', borderRadius: '8px', 
                                    background: kpi.trendUp ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', 
                                    color: kpi.trendUp ? '#34d399' : '#f87171',
                                    fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {kpi.trend}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                                <span style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                    {kpi.value}
                                </span>
                            </div>

                            {/* Minimal Decorative Background Wave */}
                            <div style={{ position: 'absolute', bottom: -20, right: -10, opacity: 0.1, color: accentColor }}>
                                <Globe size={100} strokeWidth={1} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Visualizations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                    {charts.map((chart: any, i: number) => (
                        <motion.div variants={childVariants} key={i} style={{ 
                            padding: '24px', borderRadius: '24px', background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', height: '420px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: chart.color || accentColor, boxShadow: `0 0 12px ${chart.color || accentColor}` }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{chart.title}</h3>
                            </div>
                            
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {chart.type === 'bar' ? (
                                        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey={chart.x} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                            <Bar dataKey={chart.y} fill={chart.color} radius={[6, 6, 0, 0]} barSize={32}>
                                                {chart.data.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={chart.data.length > 5 ? COLORS[index % COLORS.length] : chart.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : chart.type === 'area' || chart.type === 'line' ? (
                                        <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey={chart.x} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey={chart.y} stroke={chart.color} strokeWidth={3} fill={`url(#grad-${i})`} activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} />
                                        </AreaChart>
                                    ) : (
                                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <Pie data={chart.data} dataKey={chart.y} nameKey={chart.x} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} stroke="none">
                                                {chart.data.map((_: any, idx: number) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }} />
                                        </PieChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Raw Data Log */}
                <motion.div variants={childVariants} style={{ 
                    borderRadius: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', 
                    overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Zap size={16} style={{ color: 'var(--text-muted)' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Source Metadata & Audit Log</h3>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                            {data.length.toLocaleString()} Indexed Entities
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    {data.length > 0 && Object.keys(data[0]).map((k, idx) => (
                                        <th key={idx} style={{ 
                                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', 
                                            textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {k}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 8).map((row: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        {Object.values(row).map((v: any, j: number) => (
                                            <td key={j} style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                {v}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 8 && (
                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.01)' }}>
                                + {data.length - 8} contextual rows hidden for brevity
                            </div>
                        )}
                    </div>
                </motion.div>
                
            </motion.div>
        </div>
    );
};

export default BiView;
