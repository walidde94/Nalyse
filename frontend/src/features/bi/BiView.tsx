import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

interface BiViewProps {
    data: any[];
    useCase: string;
    onClose: () => void;
}

export const BiView = ({ data, useCase, onClose }: BiViewProps) => {

    const { kpis, charts, title } = useMemo(() => {
        if (!data || data.length === 0) return { kpis: [], charts: [], title: 'Dashboard' };

        try {
            switch (useCase) {
                case 'sales': {
                    const totalRev = data.reduce((sum, r) => sum + (r.Revenue || 0), 0);
                    const totalUnits = data.reduce((sum, r) => sum + (r['Units Sold'] || 0), 0);
                    const avgDeal = totalRev / (data.length || 1);

                    // Trend (Simplified: Group by Date)
                    const trendMap = data.reduce((acc: any, r: any) => {
                        acc[r.Date] = (acc[r.Date] || 0) + (r.Revenue || 0);
                        return acc;
                    }, {});
                    const trendData = Object.keys(trendMap).map(d => ({ Date: d, Revenue: trendMap[d] })).sort((a, b) => a.Date.localeCompare(b.Date));

                    // Product Group
                    const prodMap = data.reduce((acc: any, r: any) => {
                        acc[r.Product] = (acc[r.Product] || 0) + (r.Revenue || 0);
                        return acc;
                    }, {});
                    const productData = Object.keys(prodMap).map(p => ({ Product: p, Revenue: prodMap[p] }));

                    return {
                        title: 'Sales & Revenue Overview',
                        kpis: [
                            { label: 'Total Revenue', value: `$${totalRev?.toLocaleString()}`, color: 'var(--success)' },
                            { label: 'Units Sold', value: totalUnits?.toLocaleString(), color: 'var(--primary)' },
                            { label: 'Avg Deal Size', value: `$${Math.round(avgDeal)?.toLocaleString()}`, color: 'var(--primary)' },
                        ],
                        charts: [
                            { type: 'line', title: 'Revenue Trend', data: trendData, x: 'Date', y: 'Revenue', color: '#6366f1' },
                            { type: 'bar', title: 'Revenue by Product', data: productData, x: 'Product', y: 'Revenue', color: '#10b981' }
                        ]
                    };
                }
                case 'marketing': {
                    const totalSpend = data.reduce((sum, r) => sum + (r.Spend || 0), 0);
                    const totalLeads = data.reduce((sum, r) => sum + (r.Leads || 0), 0);
                    const avgCpl = data.reduce((sum, r) => sum + (r['Cost Per Lead'] || 0), 0) / (data.length || 1);

                    const channelMap = data.reduce((acc: any, r: any) => {
                        acc[r.Channel] = (acc[r.Channel] || 0) + (r.Spend || 0);
                        return acc;
                    }, {});
                    const channelData = Object.keys(channelMap).map(c => ({ Channel: c, value: channelMap[c] }));

                    const campMap = data.reduce((acc: any, r: any) => {
                        acc[r.Campaign] = (acc[r.Campaign] || 0) + (r.Leads || 0);
                        return acc;
                    }, {});
                    const campaignData = Object.keys(campMap).map(c => ({ Campaign: c, Leads: campMap[c] }));

                    return {
                        title: 'Marketing ROI Dashboard',
                        kpis: [
                            { label: 'Total Spend', value: `$${totalSpend?.toLocaleString()}`, color: 'var(--warning)' },
                            { label: 'Total Leads', value: totalLeads?.toLocaleString(), color: 'var(--success)' },
                            { label: 'Avg CPL', value: `$${Math.round(avgCpl)}`, color: 'var(--primary)' },
                        ],
                        charts: [
                            { type: 'pie', title: 'Spend by Channel', data: channelData, x: 'Channel', y: 'value' },
                            { type: 'bar', title: 'Leads by Campaign', data: campaignData, x: 'Campaign', y: 'Leads', color: '#ec4899' }
                        ]
                    };
                }
                case 'supply': {
                    const totalStock = data.reduce((sum, r) => sum + (r['Stock Level'] || 0), 0);
                    const lowStockItems = data.filter((r: any) => (r['Stock Level'] || 0) < (r['Reorder Point'] || 0)).length;

                    const supMap = data.reduce((acc: any, r: any) => {
                        const s = r.Supplier;
                        if (!acc[s]) acc[s] = { count: 0, sum: 0 };
                        acc[s].count++;
                        acc[s].sum += (r['Delivery Time (Days)'] || 0);
                        return acc;
                    }, {});
                    const deliveryData = Object.keys(supMap).map(s => ({ Supplier: s, Days: supMap[s].sum / supMap[s].count }));

                    const stockData = [...data].sort((a, b) => (a['Stock Level'] || 0) - (b['Stock Level'] || 0)).slice(0, 5);

                    return {
                        title: 'Supply Chain Command Center',
                        kpis: [
                            { label: 'Total Inventory Units', value: totalStock?.toLocaleString(), color: 'var(--primary)' },
                            { label: 'Items Below Reorder', value: lowStockItems, color: lowStockItems > 0 ? 'var(--danger)' : 'var(--success)' },
                            { label: 'Active Suppliers', value: Object.keys(supMap).length.toString(), color: 'var(--primary)' },
                        ],
                        charts: [
                            { type: 'bar', title: 'Delivery Time by Supplier (Days)', data: deliveryData, x: 'Supplier', y: 'Days', color: '#f59e0b' },
                            { type: 'bar', title: 'Lowest Stock Items', data: stockData, x: 'Product Name', y: 'Stock Level', color: '#ef4444' }
                        ]
                    };
                }
                case 'retention': {
                    const totalUsers = data.length;
                    const avgRetention = data.reduce((sum, r) => sum + (r['Retention Score'] || 0), 0) / (totalUsers || 1);

                    const planMap = data.reduce((acc: any, r: any) => {
                        const p = r.Plan;
                        if (!acc[p]) acc[p] = { count: 0, sum: 0 };
                        acc[p].count++;
                        acc[p].sum += (r['Retention Score'] || 0);
                        return acc;
                    }, {});
                    const retentionDist = Object.keys(planMap).map(p => ({ Plan: p, Score: planMap[p].sum / planMap[p].count }));

                    return {
                        title: 'Customer Retention Analysis',
                        kpis: [
                            { label: 'Avg Retention Score', value: Math.round(avgRetention), color: avgRetention > 75 ? 'var(--success)' : avgRetention > 50 ? 'var(--warning)' : 'var(--danger)' },
                            { label: 'Total Users Analyzed', value: totalUsers, color: 'var(--primary)' },
                        ],
                        charts: [
                            { type: 'bar', title: 'Retention Score by Plan', data: retentionDist, x: 'Plan', y: 'Score', color: '#8b5cf6' }
                        ]
                    };
                }
                case 'product': {
                    const totalActive = data.reduce((sum, r) => sum + (r['Active Users'] || 0), 0);
                    const avgSession = data.reduce((sum, r) => sum + (r['Avg Session (min)'] || 0), 0) / (data.length || 1);
                    const avgAdoption = data.reduce((sum, r) => sum + (r['Adoption Rate'] || 0), 0) / (data.length || 1);

                    const featureData = data.map((r: any) => ({ Feature: r.Feature, Users: r['Active Users'] }));

                    return {
                        title: 'Product Analytics',
                        kpis: [
                            { label: 'Total Active Users', value: totalActive.toLocaleString(), color: 'var(--primary)' },
                            { label: 'Avg Session (min)', value: Math.round(avgSession) + 'm', color: 'var(--primary)' },
                            { label: 'Avg Feature Adoption', value: Math.round(avgAdoption) + '%', color: avgAdoption > 70 ? 'var(--success)' : avgAdoption > 40 ? 'var(--warning)' : 'var(--danger)' }
                        ],
                        charts: [
                            { type: 'bar', title: 'Active Users by Feature', data: featureData, x: 'Feature', y: 'Users', color: '#3b82f6' }
                        ]
                    };
                }
                case 'executive': {
                    const totalRev = data.reduce((sum, r) => sum + (r.Revenue || 0), 0);
                    const totalProfit = data.reduce((sum, r) => sum + (r.Profit || 0), 0);
                    const margin = (totalProfit / totalRev) * 100;

                    return {
                        title: 'Executive Summary',
                        kpis: [
                            { label: 'Total Revenue', value: '$' + totalRev.toLocaleString(), color: 'var(--success)' },
                            { label: 'Total Profit', value: '$' + totalProfit.toLocaleString(), color: totalProfit > 0 ? 'var(--success)' : 'var(--danger)' },
                            { label: 'Profit Margin', value: Math.round(margin) + '%', color: margin > 20 ? 'var(--success)' : margin > 10 ? 'var(--warning)' : 'var(--danger)' }
                        ],
                        charts: [
                            { type: 'line', title: 'Financial Overview', data: data, x: 'Month', y: 'Revenue', color: '#10b981' }
                        ]
                    };
                }
                default:
                    // Generic fallback for other use cases or unknown data
                    return {
                        title: `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} Dashboard`,
                        kpis: [
                            { label: 'Rows', value: data.length, color: 'var(--primary)' },
                            { label: 'Columns', value: Object.keys(data[0] || {}).length, color: 'var(--primary)' }
                        ],
                        charts: []
                    };
            }
        } catch (e: any) {
            console.error(e);
            return { kpis: [], charts: [], title: 'Error: ' + e.message };
        }
    }, [data, useCase]);

    return (
        <div className="flex-col h-full w-full animate-in" style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-bottom pb-4">
                <div className="flex items-center gap-4">
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-h2">{title}</h1>
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--success)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Live Data
                            </span>
                        </div>
                        <p className="text-sm text-secondary">Real-time business intelligence view</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={onClose}>Close View</button>
                    <button className="btn btn-primary" onClick={() => window.print()}>Export PDF</button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {kpis.map((kpi: any, i: number) => (
                    <div key={i} className="card flex-col gap-2 p-6">
                        <span className="text-sm text-secondary font-medium">{kpi.label}</span>
                        <div className="flex items-end gap-2">
                            <span className="text-display" style={{ fontSize: '36px' }}>{kpi.value}</span>
                            {kpi.change && <span className="text-sm font-bold mb-1" style={{ color: kpi.color }}>{kpi.change}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))' }}>
                {charts.map((chart: any, i: number) => (
                    <div key={i} className="card flex-col p-6 h-[400px]">
                        <h3 className="text-h3 mb-6">{chart.title}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            {chart.type === 'bar' ? (
                                <BarChart data={chart.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey={chart.x} stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />
                                    <Bar dataKey={chart.y} fill={chart.color} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : chart.type === 'line' ? (
                                <LineChart data={chart.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey={chart.x} stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />
                                    <Line type="monotone" dataKey={chart.y} stroke={chart.color} strokeWidth={3} dot={{ fill: chart.color }} />
                                </LineChart>
                            ) : (
                                <PieChart>
                                    <Pie data={chart.data} dataKey={chart.y} nameKey={chart.x} cx="50%" cy="50%" outerRadius={100} label>
                                        {chart.data.map((_: any, idx: number) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>

            {/* Data Preview */}
            <div className="card flex-col p-0 overflow-hidden">
                <div className="p-4 border-bottom bg-surface flex justify-between items-center">
                    <h3 className="text-h3 text-sm">Source Data Preview</h3>
                    <span className="text-xs text-secondary">{data.length} records</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 5).map((row: any, i: number) => (
                                <tr key={i}>
                                    {Object.values(row).map((v: any, j: number) => (
                                        <td key={j}>{v}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
