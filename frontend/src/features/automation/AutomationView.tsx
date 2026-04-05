import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
    Activity, Zap, Shield, Bot, Bell, Terminal, Play, Square,
    RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowUpRight,
    ArrowDownRight, Eye, Trash2, Plus, LineChart, FileText, Send, Clock
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

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
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

const StatusBadge = ({ status }: { status: boolean }) => {
    const s = status ? { label: 'ACTIVE', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' }
        : { label: 'PAUSED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
    return (
        <span style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: s.color,
            background: s.bg, border: `1px solid ${s.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            {s.label}
        </span>
    );
};

/* ─── Main View ───────────────────────────────────────────── */

export const AutomationView = () => {
    const { addToast } = useToast();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'webhooks' | 'alerts'>('overview');

    // Schedules State
    const [schedules, setSchedules] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ name: '', cronExpression: '0 9 * * *', email: '' });

    const fetchSchedules = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setSchedules(await res.json());
        } catch (e) {
            console.error('Failed to load schedules');
        }
    }, [token]);

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    const handleCreateWorkflow = async () => {
        if (!newSchedule.name || !newSchedule.email) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newSchedule.name,
                    cronExpression: newSchedule.cronExpression,
                    config: { deliverTo: newSchedule.email, format: 'pdf' },
                    isActive: true
                })
            });
            if (res.ok) {
                addToast('Scheduled report created', 'success');
                setIsCreating(false);
                setNewSchedule({ name: '', cronExpression: '0 9 * * *', email: '' });
                fetchSchedules();
            }
        } catch (e) {
            addToast('Creation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await fetch(`${API_URL}/api/automation/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            fetchSchedules();
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this automated report?')) return;
        try {
            await fetch(`${API_URL}/api/automation/schedules/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('Report deleted', 'success');
            fetchSchedules();
        } catch (e) { }
    };

    // Mock data for overview
    const stats = useMemo(() => [
        { label: 'Avg Success Rate', value: '99.8%', trend: '+0.1%', up: true, data: [65, 78, 72, 85, 92, 88, 98], color: '#10b981' },
        { label: 'Active Schedules', value: schedules.filter(s => s.isActive).length.toString(), trend: '+1', up: true, data: [2, 3, 3, 4, 5, 5, schedules.length], color: '#6366f1' },
        { label: 'Documents Sent', value: '412', trend: '+42%', up: true, data: [80, 95, 110, 105, 115, 412], color: '#f59e0b' },
        { label: 'Failed Deliveries', value: '0', trend: '-2', up: false, data: [2, 1, 0, 0, 0, 0], color: '#ef4444' },
    ], [schedules]);

    const performanceData = useMemo(() => [
        { time: '00:00', success: 45, fail: 2 }, { time: '04:00', success: 52, fail: 1 },
        { time: '08:00', success: 85, fail: 0 }, { time: '12:00', success: 78, fail: 0 },
        { time: '16:00', success: 92, fail: 1 }, { time: '20:00', success: 88, fail: 1 },
        { time: '23:59', success: 95, fail: 0 },
    ], []);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', background: 'var(--bg-app)', position: 'relative' }}>
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40vw', height: '40vh', background: 'radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '30vw', height: '30vh', background: 'radial-gradient(circle, rgba(16,185,129,0.03), transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

            <div className="fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>

                {/* ─── Premium Header ────────────────────────────────────────── */}
                <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(52,211,153,0.2))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={24} style={{ color: '#818cf8' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #34d399 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                                Automated Reporting
                            </h1>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: '4px 0 0 0' }}>
                                Schedule Enterprise AI Dashboards · Distribute via Email or Webhooks
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="glass-button" style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, gap: '8px', display: 'flex', alignItems: 'center' }} onClick={fetchSchedules}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <button style={{
                            padding: '10px 22px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                            gap: '8px', display: 'flex', alignItems: 'center', background: '#818cf8', color: '#fff',
                            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                        }} onClick={() => { setActiveTab('workflows'); setIsCreating(true); }}>
                            <Plus size={16} /> New Schedule
                        </button>
                    </div>
                </div>

                {/* ─── Tabs ────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                        { id: 'overview', label: 'Overview', icon: <Layers size={14} /> },
                        { id: 'workflows', label: 'Schedules', icon: <Clock size={14} /> },
                        { id: 'webhooks', label: 'Webhooks', icon: <Activity size={14} /> },
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

                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fade-in">
                        {/* ─── Stat Grid ────────────────────────────────── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {stats.map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className="glass-panel hover-glow" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div className="glass-panel w-2/3" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <LineChart size={18} color="#818cf8" /> Delivery Availability (24h)
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="successColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                        <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#successColor)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-panel w-1/3" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>System Health</h3>
                                <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ScoreRing value={99.9} label="Optimal" size={140} />
                                </div>
                                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 800 }}>WORKER QUEUE</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>0 Pending</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'workflows' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fade-in flex-col gap-6">

                        {isCreating && (
                            <div className="glass-panel p-8 rounded-2xl border border-[var(--primary)]/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden animate-slide-down">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--success)]"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-h3 m-0 flex items-center gap-3"><Clock className="text-primary" /> Create Scheduled Report</h3>
                                    <button className="btn btn-ghost btn-icon" onClick={() => setIsCreating(false)}>✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex-col gap-2">
                                        <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Report Name</label>
                                        <input className="input" placeholder="e.g. Daily Executive Briefing" value={newSchedule.name} onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })} />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label className="text-xs font-bold text-tertiary tracking-widest uppercase">CRON Schedule</label>
                                        <select className="input" value={newSchedule.cronExpression} onChange={e => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}>
                                            <option value="0 9 * * *">Daily at 9:00 AM</option>
                                            <option value="0 17 * * *">Daily at 5:00 PM</option>
                                            <option value="0 9 * * 1">Weekly on Mondays (9:00 AM)</option>
                                            <option value="0 9 1 * *">Monthly on the 1st</option>
                                        </select>
                                    </div>
                                    <div className="flex-col gap-2 col-span-2">
                                        <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Delivery Recipients</label>
                                        <input className="input" placeholder="executives@company.com" value={newSchedule.email} onChange={e => setNewSchedule({ ...newSchedule, email: e.target.value })} />
                                        <p className="text-[10px] text-tertiary mt-1 flex items-center gap-1"><Shield size={10} className="text-success" /> AI-generated PDF reports will be dispatched automatically via Email.</p>
                                    </div>
                                </div>
                                <button className="btn btn-primary w-full mt-6 py-3" onClick={handleCreateWorkflow} disabled={loading}>
                                    {loading ? 'Orchestrating Workflow...' : 'Schedule Automated Dispatch'}
                                </button>
                            </div>
                        )}

                        <div className="glass-panel rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Report Name</th>
                                        <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Delivery Schedule</th>
                                        <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Last Run</th>
                                        <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map(run => (
                                        <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="group hover:bg-white/5 transition-colors">
                                            <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                                                        <FileText size={16} className="text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {run.name}
                                                        <span className="text-[10px] text-tertiary font-normal">To: {run.config?.deliverTo}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded font-data text-xs text-secondary tracking-widest">{run.cronExpression}</span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <StatusBadge status={run.isActive} />
                                            </td>
                                            <td style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                                                {run.lastRun ? new Date(run.lastRun).toLocaleString() : 'Pending Queue'}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px', opacity: 1 }} className="group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleToggleStatus(run.id, run.isActive)} className="btn btn-ghost btn-icon w-8 h-8 rounded-lg hover:bg-white/10" title={run.isActive ? "Pause" : "Resume"}>
                                                        {run.isActive ? <Square size={14} className="text-secondary" /> : <Play size={14} className="text-success" />}
                                                    </button>
                                                    <button onClick={() => handleDelete(run.id)} className="btn btn-ghost btn-icon w-8 h-8 rounded-lg hover:bg-danger-subtle text-danger" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedules.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center text-tertiary">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Clock size={32} className="opacity-20 mb-2" />
                                                    No scheduled reports found. Click "New Schedule" to create one.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

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
            `}</style>
        </div>
    );
};
