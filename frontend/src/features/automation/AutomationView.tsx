import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, Zap, Shield, Bot, Bell, Terminal, Play, Square,
    RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowUpRight,
    ArrowDownRight, Eye, Trash2, Plus, LineChart, FileText, Send, Clock,
    Mail, Globe, FileCode, History, Settings2, MoreVertical, ExternalLink, X, Download
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
    const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'history' | 'reports'>('overview');

    // State
    const [schedules, setSchedules] = useState<any[]>([]);
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [globalHistory, setGlobalHistory] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [historyScheduleId, setHistoryScheduleId] = useState<string | null>(null);

    // Form State
    const [newSchedule, setNewSchedule] = useState({
        name: '',
        cronExpression: '0 9 * * *',
        deliverTo: '',
        dashboardId: '',
        analysisId: '',
        format: 'pdf',
        deliveryChannel: 'email',
        modules: {
            infrastructure: true,
            analysis: true,
            audit: true,
            business: true
        }
    });

    const fetchData = useCallback(async () => {
        try {
            const [sRes, dRes, aRes, stRes, hRes] = await Promise.all([
                fetch(`${API_URL}/api/automation/schedules`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/dashboards`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/analyses`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/history`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (sRes.ok) setSchedules(await sRes.json());
            if (dRes.ok) setDashboards(await dRes.json());
            if (aRes.ok) setAnalyses(await aRes.json());
            if (stRes.ok) setStats(await stRes.json());
            if (hRes.ok) setGlobalHistory(await hRes.json());
        } catch (e) {
            console.error('Failed to load data');
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateWorkflow = async () => {
        if (!newSchedule.name || !newSchedule.deliverTo) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newSchedule.name,
                    cronExpression: newSchedule.cronExpression,
                    dashboardId: newSchedule.dashboardId || null,
                    config: { 
                        deliverTo: newSchedule.deliverTo, 
                        format: newSchedule.format,
                        deliveryChannel: newSchedule.deliveryChannel
                    },
                    isActive: true
                })
            });
            if (res.ok) {
                addToast('Scheduled report created', 'success');
                setIsCreating(false);
                setNewSchedule({
                    name: '',
                    cronExpression: '0 9 * * *',
                    deliverTo: '',
                    dashboardId: '',
                    analysisId: '',
                    format: 'pdf',
                    deliveryChannel: 'email',
                    modules: {
                        infrastructure: true,
                        analysis: true,
                        audit: true,
                        business: true
                    }
                });
                fetchData();
            }
        } catch (e) {
            addToast('Creation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTrigger = async (id: string) => {
        addToast('Triggering immediate execution...', 'info');
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules/${id}/trigger`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Execution started', 'success');
                setTimeout(fetchData, 2000);
            }
        } catch (e) {
            addToast('Trigger failed', 'error');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await fetch(`${API_URL}/api/automation/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            fetchData();
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
            fetchData();
        } catch (e) { }
    };

    const handleViewReport = (url: string) => {
        if (!url) {
            addToast('Report file not found', 'error');
            return;
        }
        window.open(`${API_URL}${url}?token=${token}`, '_blank');
    };

    const handleDownloadReport = async (runId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/automation/reports/${runId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Nalyse_Report_${runId.substring(0, 8)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            addToast('Download failed. Please try again.', 'error');
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };

    // Stats Mapping
    const statsDataArray = useMemo(() => [
        { label: 'Avg Success Rate', value: `${stats?.successRate || 100}%`, trend: '+0.1%', up: true, data: [65, 78, 72, 85, 92, 88, 98], color: '#10b981' },
        { label: 'Active Schedules', value: (stats?.activeSchedules || 0).toString(), trend: '+1', up: true, data: [2, 3, 3, 4, 5, 5, schedules.length], color: '#6366f1' },
        { label: 'Executions (24h)', value: (stats?.totalExecutions || 0).toString(), trend: '+12%', up: true, data: [10, 15, 12, 18, 22, 25], color: '#f59e0b' },
        { label: 'Deliveries Failed', value: (stats?.failedDeliveries || 0).toString(), trend: '-100%', up: false, data: [2, 1, 0, 0, 0, 0], color: '#ef4444' },
    ], [stats, schedules]);

    const performanceData = useMemo(() => stats?.chartData || [
        { time: '00:00', success: 0, fail: 0 }, { time: '04:00', success: 0, fail: 0 },
        { time: '08:00', success: 0, fail: 0 }, { time: '12:00', success: 0, fail: 0 },
        { time: '16:00', success: 0, fail: 0 }, { time: '20:00', success: 0, fail: 0 },
        { time: '23:59', success: 0, fail: 0 },
    ], [stats]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', background: 'var(--bg-app)', position: 'relative' }}>
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40vw', height: '40vh', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
            
            <div className="fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>

                {/* ─── Header ────────────────────────────────────────── */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '56px', height: '56px', borderRadius: '18px', 
                            background: 'linear-gradient(135deg, #6366f1, #10b981)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px -6px rgba(99,102,241,0.4)'
                        }}>
                            <Zap size={28} style={{ color: '#fff' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Automated Reporting</h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0', fontWeight: 500 }}>AI Orchestration for Enterprise Data Distribution</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="glass-button" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }} onClick={fetchData}>
                            <RefreshCw size={16} /> Sync
                        </button>
                        <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            style={{ 
                                padding: '10px 24px', borderRadius: '12px', background: '#6366f1', color: '#fff', 
                                border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)'
                            }}
                            onClick={() => { setActiveTab('workflows'); setIsCreating(true); }}
                        >
                            <Plus size={18} /> New Schedule
                        </motion.button>
                    </div>
                </div>

                {/* ─── Tabs ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                        { id: 'overview', label: 'Overview', icon: <Layers size={16} /> },
                        { id: 'workflows', label: 'Schedules', icon: <Clock size={16} /> },
                        { id: 'history', label: 'Execution History', icon: <History size={16} /> },
                        { id: 'reports', label: 'Reports', icon: <FileCode size={16} /> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none',
                                background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: activeTab === tab.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                            {statsDataArray.map((s, i) => (
                                <div key={s.label} className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: s.up ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {s.trend}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                                        <Spark data={s.data} color={s.color} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart Area */}
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div className="glass-panel" style={{ flex: 2, padding: '28px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <LineChart size={20} style={{ color: '#10b981' }} /> Real-time Delivery Performance
                                </h3>
                                <div style={{ height: '320px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData}>
                                            <defs>
                                                <linearGradient id="colorSuc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} />
                                            <Tooltip contentStyle={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                                            <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSuc)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ flex: 1, padding: '28px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <ScoreRing value={parseFloat(stats?.successRate || '100')} label="Reliability" size={160} stroke={12} />
                                <div style={{ marginTop: '28px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: '8px' }}>Active Node</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Cluster-Alpha-Orchestrator</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '12px', padding: '6px 12px', background: 'rgba(52,211,153,0.1)', borderRadius: '20px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>Uptime 100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'workflows' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {isCreating && (
                            <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.03)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Settings2 size={22} style={{ color: '#6366f1' }} /> Configure Scheduled Dispatch
                                    </h3>
                                    <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Report Identity</label>
                                        <input 
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                            placeholder="e.g. Sales Executive Monthly"
                                            value={newSchedule.name}
                                            onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CRON Orchestration</label>
                                        <select 
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                            value={newSchedule.cronExpression}
                                            onChange={e => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
                                        >
                                            <option value="0 9 * * *">Every Day at 9:00 AM</option>
                                            <option value="0 18 * * *">Every Day at 6:00 PM</option>
                                            <option value="0 0 * * 1">Every Monday at Midnight</option>
                                            <option value="0 9 1 * *">First Day of Month (9:00 AM)</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Data Source (Dashboard)</label>
                                            <select 
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                                value={newSchedule.dashboardId}
                                                onChange={e => setNewSchedule({ ...newSchedule, dashboardId: e.target.value, analysisId: '' })}
                                            >
                                                <option value="">None / Full System</option>
                                                {dashboards.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Intelligence Context (Analysis)</label>
                                            <select 
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                                value={newSchedule.analysisId}
                                                onChange={e => setNewSchedule({ ...newSchedule, analysisId: e.target.value, dashboardId: '' })}
                                            >
                                                <option value="">None / System Logs</option>
                                                {analyses.filter(a => a.status === 'completed').map(a => (
                                                    <option key={a.id} value={a.id}>{a.file?.filename || 'Unnamed Insight'}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Delivery Endpoint</label>
                                        <input 
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                            placeholder={newSchedule.deliveryChannel === 'email' ? "exec@company.com" : "https://webhooks.site/..."}
                                            value={newSchedule.deliverTo}
                                            onChange={e => setNewSchedule({ ...newSchedule, deliverTo: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Dossier Modules (Select Content)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {Object.entries(newSchedule.modules).map(([key, val]) => (
                                                <button key={key}
                                                    onClick={() => setNewSchedule({
                                                        ...newSchedule, 
                                                        modules: { ...newSchedule.modules, [key]: !val }
                                                    })}
                                                    style={{ 
                                                        padding: '10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, 
                                                        background: val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                                        border: `1px solid ${val ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                                        color: val ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                                        cursor: 'pointer', textTransform: 'uppercase', textAlign: 'left'
                                                    }}
                                                >
                                                    {val ? '✓' : '○'} {key}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Channel</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button 
                                                onClick={() => setNewSchedule({...newSchedule, deliveryChannel: 'email'})}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: newSchedule.deliveryChannel === 'email' ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                                            >
                                                <Mail size={16} /> Email
                                            </button>
                                            <button 
                                                onClick={() => setNewSchedule({...newSchedule, deliveryChannel: 'webhook'})}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: newSchedule.deliveryChannel === 'webhook' ? '#10b981' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                                            >
                                                <Globe size={16} /> Webhook
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Artifact Format</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {['pdf', 'csv', 'json'].map(f => (
                                                <button key={f}
                                                    onClick={() => setNewSchedule({...newSchedule, format: f})}
                                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: newSchedule.format === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800, fontSize: '11px' }}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    onClick={handleCreateWorkflow} disabled={loading}
                                >
                                    {loading ? <RefreshCw className="animate-spin" /> : 'Authorize & Start Automation'}
                                </motion.button>
                            </div>
                        )}

                        <div className="glass-panel" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Reporting Pipeline</th>
                                        <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Scale & Trigger</th>
                                        <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Last Live sync</th>
                                        <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Orchestration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={18} style={{ color: '#6366f1' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{s.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {s.config?.deliveryChannel === 'email' ? <Mail size={10} /> : <Globe size={10} />}
                                                            {s.config?.deliverTo}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 800, width: 'fit-content', fontFamily: 'var(--font-mono)' }}>
                                                    {s.cronExpression}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
                                                    Format: {s.config?.format || 'PDF'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}><StatusBadge status={s.isActive} /></td>
                                            <td style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                                                {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : '---'}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleTrigger(s.id)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: 'none', color: '#10b981', cursor: 'pointer' }} title="Test Now"><Play size={14} /></button>
                                                    <button onClick={() => handleToggleStatus(s.id, s.isActive)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{s.isActive ? <Square size={14} /> : <Play size={14} />}</button>
                                                    <button onClick={() => handleDelete(s.id)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-panel" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} style={{ color: '#f59e0b' }} /> Global Execution Logs
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {globalHistory.map((run: any) => (
                                    <div key={run.id} style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ 
                                                width: '36px', height: '36px', borderRadius: '10px', 
                                                background: run.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {run.status === 'success' ? <CheckCircle2 size={18} style={{ color: '#10b981' }} /> : <AlertTriangle size={18} style={{ color: '#ef4444' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{run.schedule?.name}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{new Date(run.startedAt).toLocaleString()} • {run.durationMs || 0}ms</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: run.status === 'success' ? '#10b981' : '#ef4444' }}>{run.status}</span>
                                            {run.status === 'success' && <button style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer' }}><Eye size={16} /></button>}
                                        </div>
                                    </div>
                                ))}
                                {globalHistory.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>No orchestration history recorded yet.</div>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {globalHistory.filter((r: any) => (r.status === 'success' || r.status === 'pending') && r.schedule).map((report: any) => (
                                <div key={report.id} className="glass-panel" style={{ 
                                    padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    {report.status === 'pending' && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                            <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Generating Intelligence...</div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                                            <FileCode size={24} />
                                        </div>
                                        <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontSize: '10px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                                            {report.schedule?.config?.format || 'PDF'}
                                        </div>
                                    </div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{report.schedule?.name || 'Untitled Report'}</h4>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', fontWeight: 500 }}>
                                        {report.status === 'pending' ? 'Initiated now' : `Generated ${formatDate(report.startedAt)}`}
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            disabled={report.status === 'pending'}
                                            className="glass-button" 
                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: report.status === 'pending' ? 0.5 : 1 }}
                                            onClick={() => handleViewReport(report.outputUrl)}
                                        >
                                            <Eye size={14} /> Preview
                                        </button>
                                        <button 
                                            disabled={report.status === 'pending'}
                                            className="glass-button" 
                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', opacity: report.status === 'pending' ? 0.5 : 1 }}
                                            onClick={() => handleDownloadReport(report.id)}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {globalHistory.filter((r: any) => (r.status === 'success' || r.status === 'pending') && r.schedule).length === 0 && (
                                <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <FileCode size={40} style={{ opacity: 0.2 }} />
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff' }}>Zero artifacts produced yet.</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 32px' }}>
                                        You haven't generated any intelligence dossiers. Start by triggering an existing schedule or create a new one.
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                        <button className="glass-button" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }} onClick={() => setActiveTab('workflows')}>
                                            View Schedules
                                        </button>
                                        {schedules.length > 0 && (
                                            <button 
                                                className="glass-button" 
                                                style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none' }}
                                                onClick={() => handleTrigger(schedules[0].id)}
                                            >
                                                Run First Schedule
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

            </div>

            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }
                .glass-button {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .glass-button:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    border-color: rgba(255,255,255,0.2);
                }
                input, select {
                    transition: all 0.2s ease;
                }
                input:focus, select:focus {
                    border-color: #6366f1 !important;
                    background: rgba(255,255,255,0.08) !important;
                    box-shadow: 0 0 15px rgba(99,102,241,0.1);
                }
            `}</style>
        </div>
    );
};
