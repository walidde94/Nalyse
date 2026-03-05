import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    AlertTriangle,
    Target,
    Zap,
    ArrowRight,
    Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { API_URL } from '../../config';

interface PulseMetrics {
    revenue: string;
    revenueGrowth: string;
    anomalies: number;
    roi: string;
    projects: number;
    revenueLabel?: string;
}

interface PulseCardProps {
    title: string;
    value: string;
    subValue: string;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
    category: string;
    onClick?: () => void;
}

const PulseCard = ({ title, value, subValue, trend, icon, color, category, onClick }: PulseCardProps) => (
    <div className="widget-premium group cursor-pointer card"
        onClick={onClick}
        style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${color}15, transparent)`, zIndex: 0 }} />

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div style={{ padding: '10px', borderRadius: '12px', background: `${color}10`, color: color }}>
                {icon}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>{category}</span>
        </div>

        <div className="relative z-10">
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>{title}</h4>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="font-data" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {subValue}
                </span>
            </div>
            {/* SM-04: Micro-sparkline Detail */}
            <div style={{ height: '32px', width: '100%', marginTop: '12px', opacity: 0.4 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                        d={trend === 'up' ? "M0 25 Q 25 10, 50 15 T 100 5" : "M0 5 Q 25 20, 50 15 T 100 25"}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </div>

        <button className="flex items-center gap-2 mt-4 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
            View Analysis <ArrowRight size={12} />
        </button>
    </div>
);

export const EnterprisePulse = ({ onNexusRequest }: { onNexusRequest?: () => void }) => {
    const [metrics, setMetrics] = useState<PulseMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                if (!token) return;

                const res = await fetch(`${API_URL}/api/pulse`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error("Failed to fetch pulse", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPulse();
        // Poll every 30s
        const interval = setInterval(fetchPulse, 30000);
        return () => clearInterval(interval);
    }, []);

    const displayRevenue = metrics?.revenue || '...';
    const displayGrowth = metrics?.revenueGrowth || '0%';
    const displayAnomalies = metrics?.anomalies ?? 0;
    const displayROI = metrics?.roi || '$0.00';
    const displayFindings = metrics?.projects ?? 0;
    const revenueLabel = metrics?.revenueLabel || 'Revenue Velocity';

    return (
        <div className="flex-col gap-6 mb-12">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-h2" style={{ fontSize: '24px', letterSpacing: '-0.02em', marginBottom: 0 }}>Enterprise <span className="text-gradient">Pulse</span></h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-breathe"></div>
                            <span className="tech-text" style={{ fontSize: '8px', color: 'var(--success)' }}>LIVE</span>
                        </div>
                    </div>
                    <p className="text-sec" style={{ fontSize: '14px' }}>Real-time strategic synthesis across your workspace.</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl">
                    <button className="btn btn-ghost btn-sm px-4 bg-[var(--bg-card)] shadow-sm text-[var(--primary)]" style={{ borderRadius: '8px' }} onClick={onNexusRequest}>Insights</button>
                    <button className="btn btn-ghost btn-sm px-4" style={{ borderRadius: '8px' }}>Action Log</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <PulseCard
                    title={revenueLabel}
                    value={displayRevenue}
                    subValue={displayGrowth}
                    trend="up"
                    category="Growth"
                    color="#10b981"
                    icon={<TrendingUp size={20} />}
                    onClick={onNexusRequest}
                />
                <PulseCard
                    title="Anomalies Detected"
                    value={String(displayAnomalies)}
                    subValue={displayAnomalies > 5 ? 'Critical severity' : 'Normal range'}
                    trend="down"
                    category="Risk"
                    color="#ef4444"
                    icon={<AlertTriangle size={20} />}
                    onClick={onNexusRequest}
                />
                <PulseCard
                    title="Projected ROI"
                    value={displayROI}
                    subValue="Optimizable savings"
                    trend="up"
                    category="Efficiency"
                    color="#8b5cf6"
                    icon={<Zap size={20} />}
                    onClick={onNexusRequest}
                />
                <PulseCard
                    title="Strategic Findings"
                    value={String(displayFindings)}
                    subValue="Verified by Oracle"
                    trend="neutral"
                    category="Strategy"
                    color="#3b82f6"
                    icon={<Target size={20} />}
                    onClick={onNexusRequest}
                />
            </div>

            <div className="gradient-border flex items-center justify-between p-8 mt-4" style={{ border: 'none' }}>
                <div className="flex items-center gap-6">
                    <div className="pulse" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--primary-glow)' }}>
                        <Search size={28} color="white" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 800, fontSize: '16px' }}>Talk to your Data</h4>
                        <p className="text-sm opacity-70">Ask Nexus AI about correlations across your entire workspace.</p>
                    </div>
                </div>
                <button className="btn btn-primary px-6" style={{ borderRadius: '12px', fontWeight: 800 }} onClick={onNexusRequest}>Start Natural Language Query</button>
            </div>
        </div>
    );
};
