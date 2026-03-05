import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Legend, ComposedChart, Line
} from 'recharts';
import {
    Activity, Zap, Shield, Target, Brain, Clock, Cpu,
    Gauge, LineChart, Sparkles, Bell, Bot, Terminal,
    Play, Pause, Square, RefreshCw, Layers, CheckCircle2,
    AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronRight, Eye, Trash2, Plus
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

/* ─── Premium UI Components ───────────────────────────────── */

const Spark = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeJoin="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#spark-grad-${color.replace('#', '')})`} />
        </svg>
    );
};

const ScoreRing = ({ value, label, size = 100, stroke = 8 }: { value: number; label: string; size?: number; stroke?: number }) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(value, 100) / 100) * circ;
    const color = value >= 90 ? '#10b981' : value >= 70 ? '#6366f1' : value >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} strokeLinecap="round" />
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{ fontSize: size * 0.22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}%</div>
                <div style={{ fontSize: size * 0.09, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        active: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        paused: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
        error: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
        idle: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' }
    };
    const s = styles[status.toLowerCase()] || styles.idle;
    return (
        <span style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: s.color,
            background: s.bg, border: `1px solid ${s.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            {status}
        </span>
    );
};

/* ─── Main View ───────────────────────────────────────────── */

export const AutomationView = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'webhooks' | 'alerts'>('overview');

    // Mock data for initial styling
    const stats = useMemo(() => [
        { label: 'Avg Success Rate', value: '98.4%', trend: '+2.1%', up: true, data: [65, 78, 72, 85, 92, 88, 98], color: '#10b981' },
        { label: 'Active Workflows', value: '12', trend: '+1', up: true, data: [8, 9, 9, 10, 12, 11, 12], color: '#6366f1' },
        { label: 'Total Executions', value: '1,242', trend: '+12%', up: true, data: [800, 950, 1100, 1050, 1150, 1242], color: '#f59e0b' },
        { label: 'Failed Tasks', value: '3', trend: '-2', up: false, data: [5, 8, 4, 3, 2, 3], color: '#ef4444' },
    ], []);

    const recentRuns = useMemo(() => [
        { id: 1, name: 'Daily Market Synthesis', status: 'Active', lastRun: '2h ago', nextRun: '22h 15m', type: 'Schedule' },
        { id: 2, name: 'Stripe Webhook Handler', status: 'Active', lastRun: '15m ago', nextRun: 'Real-time', type: 'Webhook' },
        { id: 3, name: 'Anomaly Alert Engine', status: 'Paused', lastRun: '1d ago', nextRun: '-', type: 'Alert' },
        { id: 4, name: 'Bulk PDF Extraction', status: 'Error', lastRun: '4h ago', nextRun: 'Manual', type: 'Batch' },
    ], []);

    const performanceData = useMemo(() => [
        { time: '00:00', success: 45, fail: 2 },
        { time: '04:00', success: 52, fail: 1 },
        { time: '08:00', success: 85, fail: 4 },
        { time: '12:00', success: 78, fail: 2 },
        { time: '16:00', success: 92, fail: 3 },
        { time: '20:00', success: 88, fail: 1 },
        { time: '23:59', success: 95, fail: 0 },
    ], []);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', background: 'var(--bg-app)', position: 'relative' }}>

            {/* Ambient Background Glows */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40vw', height: '40vh', background: 'radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '30vw', height: '30vh', background: 'radial-gradient(circle, rgba(16,185,129,0.03), transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>

                {/* ─── Header ───────────────────────────────────── */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.1))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                            }}>
                                <Zap size={24} color="#818cf8" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>Automation Hub</h1>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                    Enterprise Workflow Orchestration · Real-time Webhooks · Intelligent Alerting
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="glass-button" style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, gap: '8px', display: 'flex', alignItems: 'center' }}>
                            <RefreshCw size={14} /> Sync Status
                        </button>
                        <button style={{
                            padding: '10px 22px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                            gap: '8px', display: 'flex', alignItems: 'center', background: '#818cf8', color: '#fff',
                            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                        }}>
                            <Plus size={16} /> New Workflow
                        </button>
                    </div>
                </div>

                {/* ─── Stat Grid ────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {stats.map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: s.up ? '#10b981' : '#ef4444' }}>
                                    {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {s.trend}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                                <Spark data={s.data} color={s.color} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Tabs ────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                        { id: 'overview', label: 'Overview', icon: <Layers size={14} /> },
                        { id: 'workflows', label: 'Workflows', icon: <Bot size={14} /> },
                        { id: 'webhooks', label: 'Webhooks', icon: <Activity size={14} /> },
                        { id: 'alerts', label: 'Alert Rules', icon: <Bell size={14} /> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '8px 18px', borderRadius: '8px', border: 'none',
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>

                    {/* ─── Left Column ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Status Table */}
                        <div className="glass-panel" style={{ padding: '0', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Recent Activity</h3>
                                <button style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Workflow</th>
                                        <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Type</th>
                                        <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Last Run</th>
                                        <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRuns.map(run => (
                                        <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>{run.name}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{run.type}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}><StatusBadge status={run.status} /></td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{run.lastRun}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Eye size={16} /></button>
                                                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Play size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Performance Chart */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <LineChart size={18} color="#818cf8" /> Success Metrics (24h)
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="successColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="failColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#successColor)" />
                                    <Area type="monotone" dataKey="fail" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#failColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ─── Right Column ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Health Score */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>System Health</h3>
                            <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ScoreRing value={94} label="Optimal" size={140} />
                            </div>
                            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)' }}>
                                    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>UPTIME</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>99.9%</div>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 800 }}>LATENCY</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>12ms</div>
                                </div>
                            </div>
                        </div>

                        {/* Resource Radar */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Resource Allocation</h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'CPU', A: 45, fullMark: 100 },
                                    { subject: 'RAM', A: 68, fullMark: 100 },
                                    { subject: 'API', A: 92, fullMark: 100 },
                                    { subject: 'DB', A: 32, fullMark: 100 },
                                    { subject: 'Net', A: 55, fullMark: 100 },
                                ]}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }} />
                                    <Radar name="Active" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recent Alerts */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bell size={16} color="#ef4444" /> Active Alerts
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { id: 1, title: 'Execution Timeout', meta: 'Workflow #421', severity: 'High' },
                                    { id: 2, title: 'Webhook Retries', meta: 'Stripe API', severity: 'Med' },
                                ].map(alert => (
                                    <div key={alert.id} style={{
                                        padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.05)',
                                        border: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: '12px'
                                    }}>
                                        <AlertTriangle size={18} color="#ef4444" />
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{alert.title}</div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{alert.meta}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .glass-button {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .glass-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 2s linear infinite; }
            `}</style>
        </div>
    );
};
