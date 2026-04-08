import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Webhook, Key, Plus, Trash2, Play, Pause, CheckCircle2, XCircle,
    Clock, Zap, ExternalLink, Copy, Check, Loader2, RefreshCw,
    Shield, Activity, AlertTriangle, Globe, Code2, ChevronDown, ChevronRight,
    RotateCw, Eye, EyeOff, Filter, TrendingUp, Server, Hash, BookOpen,
    Terminal, Send, ArrowRight, Info, Lock, Cpu, BarChart3
} from 'lucide-react';
import { API_URL } from '../../config';

interface WebhookItem {
    id: string; url: string; events: string[]; secret: string;
    status: string; description: string; createdAt: string;
    lastTriggered: string | null; deliveries: number;
    successCount: number; failureCount: number; failureRate: number;
    avgLatency: number; retryPolicy: { maxRetries: number; backoffMs: number };
}

interface LogItem {
    id: string; webhookId: string; event: string; status: number;
    duration: number; timestamp: string; attempt: number;
    requestHeaders?: any; requestBody?: string; responseBody?: string;
}

interface EventDef {
    id: string; label: string; category: string; description: string;
}

interface Stats {
    total: number; active: number; paused: number; totalDeliveries: number;
    totalFailures: number; overallFailureRate: string; avgLatency: number;
    deliveriesLast24h: number;
}

type Tab = 'overview' | 'webhooks' | 'apikeys' | 'logs' | 'docs';

export const WebhookSystemView = ({ token }: { token?: string }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [events, setEvents] = useState<EventDef[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [verifyExamples, setVerifyExamples] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
    const [docLang, setDocLang] = useState<'node' | 'python' | 'go'>('node');
    const [newKeyName, setNewKeyName] = useState('');

    const headers: any = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [whRes, logRes, evtRes, keyRes, statsRes, verifyRes] = await Promise.all([
                fetch(`${API_URL}/api/webhooks`, { headers }).then(r => r.json()).catch(() => ({ webhooks: [] })),
                fetch(`${API_URL}/api/webhooks/logs`, { headers }).then(r => r.json()).catch(() => ({ logs: [] })),
                fetch(`${API_URL}/api/webhooks/events`, { headers }).then(r => r.json()).catch(() => ({ events: [] })),
                fetch(`${API_URL}/api/apikeys`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${API_URL}/api/webhooks/stats`, { headers }).then(r => r.json()).catch(() => ({ stats: null })),
                fetch(`${API_URL}/api/webhooks/verify-example`, { headers }).then(r => r.json()).catch(() => ({ examples: null })),
            ]);
            setWebhooks(whRes.webhooks || []);
            setLogs(logRes.logs || []);
            setEvents(evtRes.events || []);
            setApiKeys(Array.isArray(keyRes) ? keyRes : keyRes.keys || []);
            setStats(statsRes.stats || null);
            setVerifyExamples(verifyRes.examples || null);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const createWebhook = async () => {
        if (!newUrl.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/webhooks`, {
                method: 'POST', headers,
                body: JSON.stringify({ url: newUrl, events: selectedEvents, description: newDesc })
            });
            const data = await res.json();
            if (data.success) { setWebhooks(prev => [...prev, data.webhook]); setShowCreate(false); setNewUrl(''); setNewDesc(''); setSelectedEvents([]); fetchAll(); }
        } catch { }
    };

    const toggleWebhook = async (id: string) => {
        const res = await fetch(`${API_URL}/api/webhooks/${id}/toggle`, { method: 'PATCH', headers }).then(r => r.json()).catch(() => null);
        if (res?.success) setWebhooks(prev => prev.map(w => w.id === id ? res.webhook : w));
    };

    const deleteWebhook = async (id: string) => {
        if (!confirm('Delete this webhook endpoint? This cannot be undone.')) return;
        await fetch(`${API_URL}/api/webhooks/${id}`, { method: 'DELETE', headers });
        setWebhooks(prev => prev.filter(w => w.id !== id));
    };

    const testWebhook = async (id: string) => {
        const res = await fetch(`${API_URL}/api/webhooks/${id}/test`, { method: 'POST', headers }).then(r => r.json()).catch(() => null);
        if (res?.success) { setLogs(prev => [res.delivery, ...prev]); fetchAll(); }
    };

    const rotateSecret = async (id: string) => {
        if (!confirm('Rotate secret? You must update the secret in your receiving server.')) return;
        const res = await fetch(`${API_URL}/api/webhooks/${id}/rotate-secret`, { method: 'POST', headers }).then(r => r.json()).catch(() => null);
        if (res?.success) setWebhooks(prev => prev.map(w => w.id === id ? res.webhook : w));
    };

    const createApiKey = async () => {
        if (!newKeyName.trim()) return;
        const res = await fetch(`${API_URL}/api/apikeys`, { method: 'POST', headers, body: JSON.stringify({ name: newKeyName }) }).then(r => r.json()).catch(() => null);
        if (res) { setApiKeys(prev => [...prev, res]); setNewKeyName(''); }
    };

    const revokeApiKey = async (key: string) => {
        if (!confirm('Revoke this key? Apps using it will break immediately.')) return;
        await fetch(`${API_URL}/api/apikeys/${key}`, { method: 'DELETE', headers });
        setApiKeys(prev => prev.filter(k => k.key !== key));
    };

    const copyText = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
    const toggleSecret = (id: string) => setVisibleSecrets(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const timeAgo = (ts: string | null) => {
        if (!ts) return 'Never';
        const d = Date.now() - new Date(ts).getTime();
        const m = Math.floor(d / 60000);
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const CopyBtn = ({ text, id }: { text: string; id: string }) => (
        <button onClick={() => copyText(text, id)} style={{ background: 'none', border: 'none', color: copiedId === id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex' }}>
            {copiedId === id ? <Check size={13} /> : <Copy size={13} />}
        </button>
    );

    const StatCard = ({ label, value, sub, color, icon: Icon }: any) => (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', flex: 1, minWidth: '220px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Icon size={60} color={color || 'var(--text-primary)'} /></div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>{sub}</div>}
        </div>
    );

    const Badge = ({ children, color = '#f59e0b' }: any) => (
        <span style={{ background: `${color}18`, border: `1px solid ${color}30`, color, fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</span>
    );

    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
        { id: 'overview', label: 'Health Overview', icon: <BarChart3 size={15} /> },
        { id: 'webhooks', label: 'Endpoints', icon: <Webhook size={15} />, count: webhooks.length },
        { id: 'apikeys', label: 'API Keys', icon: <Key size={15} />, count: apiKeys.length },
        { id: 'logs', label: 'Delivery Logs', icon: <Activity size={15} />, count: logs.length },
        { id: 'docs', label: 'Integration Guide', icon: <BookOpen size={15} /> },
    ];

    const eventsByCategory = events.reduce<Record<string, EventDef[]>>((acc, e) => { (acc[e.category] = acc[e.category] || []).push(e); return acc; }, {});

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', position: 'relative', minHeight: '100%' }}>
            <div style={{ position: 'absolute', top: '5%', right: '15%', width: '45vw', height: '45vh', background: 'radial-gradient(ellipse, rgba(245,158,11,0.05), transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px -6px rgba(245,158,11,0.5)' }}>
                            <Webhook size={22} color="#fff" />
                        </div>
                        API & Webhook Engine
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500, marginLeft: '54px' }}>
                        Production-grade event delivery, API key management, and real-time health monitoring.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchAll} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
                        <Plus size={16} /> New Webhook
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', position: 'relative', zIndex: 1, overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(t => {
                    const active = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px',
                            background: active ? 'var(--bg-surface)' : 'transparent',
                            border: `1px solid ${active ? 'var(--border-color)' : 'transparent'}`,
                            color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}>
                            {t.icon} {t.label}
                            {t.count !== undefined && <span style={{ background: active ? 'rgba(245,158,11,0.2)' : 'var(--bg-card)', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, color: active ? '#f59e0b' : 'var(--text-muted)' }}>{t.count}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px', marginBottom: '24px', position: 'relative', zIndex: 1, color: 'var(--text-primary)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={18} color="#f59e0b" /> Register Webhook Endpoint</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payload URL</label>
                                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://api.yourapp.com/webhooks/nalyse" style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description (optional)</label>
                                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Slack alerts, ERP sync, CI trigger..." style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscribe to Events</label>
                                {Object.entries(eventsByCategory).map(([cat, evts]) => (
                                    <div key={cat} style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {evts.map(ev => {
                                                const sel = selectedEvents.includes(ev.id);
                                                return <button key={ev.id} onClick={() => setSelectedEvents(sel ? selectedEvents.filter(e => e !== ev.id) : [...selectedEvents, ev.id])}
                                                    title={ev.description}
                                                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', border: `1px solid ${sel ? '#f59e0b' : 'var(--border-color)'}`, background: sel ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)', color: sel ? '#f59e0b' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                                                    {ev.id}
                                                </button>;
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={createWebhook} disabled={!newUrl.trim()} style={{ background: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: newUrl.trim() ? 1 : 0.5 }}>Create Webhook</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {loading ? (
                    <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                        <Loader2 className="animate-spin" size={32} color="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Engine...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                            {/* ═══ OVERVIEW ═══ */}
                            {activeTab === 'overview' && stats && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                        <StatCard label="Active Endpoints" value={stats.active} sub={`${stats.paused} paused`} color="#10b981" icon={Webhook} />
                                        <StatCard label="Total Deliveries" value={stats.totalDeliveries.toLocaleString()} sub={`${stats.deliveriesLast24h} last 24h`} color="#3b82f6" icon={Send} />
                                        <StatCard label="Failure Rate" value={`${stats.overallFailureRate}%`} sub={`${stats.totalFailures} failures`} color={Number(stats.overallFailureRate) > 5 ? '#ef4444' : '#10b981'} icon={AlertTriangle} />
                                        <StatCard label="Avg Latency" value={`${stats.avgLatency}ms`} sub="across all endpoints" color="#a855f7" icon={Clock} />
                                    </div>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Activity size={16} color="#3b82f6" /> Recent Activity</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {logs.slice(0, 6).map(log => (
                                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '4px', background: log.status < 300 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: log.status < 300 ? '#10b981' : '#ef4444' }}>{log.status}</span>
                                                    <code style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', flex: 1 }}>{log.event}</code>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log.duration}ms</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(log.timestamp)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ WEBHOOKS ═══ */}
                            {activeTab === 'webhooks' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {webhooks.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}><Webhook size={40} style={{ marginBottom: '12px', opacity: 0.3 }} /><p>No webhook endpoints configured yet.</p></div>}
                                    {webhooks.map((wh, i) => (
                                        <motion.div key={wh.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: wh.status === 'active' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'var(--text-disabled)' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <Globe size={14} color="#f59e0b" />
                                                        <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{wh.url}</code>
                                                    </div>
                                                    {wh.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '22px' }}>{wh.description}</div>}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginLeft: '22px' }}>
                                                        {wh.events.map(ev => <Badge key={ev}>{ev}</Badge>)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => testWebhook(wh.id)} title="Send test ping" style={{ background: 'rgba(59,130,246,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }}><Zap size={14} /></button>
                                                    <button onClick={() => rotateSecret(wh.id)} title="Rotate secret" style={{ background: 'rgba(168,85,247,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#a855f7', cursor: 'pointer' }}><RotateCw size={14} /></button>
                                                    <button onClick={() => toggleWebhook(wh.id)} title={wh.status === 'active' ? 'Pause' : 'Resume'} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                                        {wh.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                    <button onClick={() => deleteWebhook(wh.id)} title="Delete" style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                                                {[
                                                    { label: 'Status', value: wh.status, color: wh.status === 'active' ? '#10b981' : '#f59e0b', icon: wh.status === 'active' ? <CheckCircle2 size={12} /> : <Pause size={12} /> },
                                                    { label: 'Deliveries', value: wh.deliveries, mono: true, color: 'var(--text-primary)' },
                                                    { label: 'Success', value: wh.successCount, color: '#10b981', mono: true },
                                                    { label: 'Failed', value: wh.failureCount, color: wh.failureCount > 0 ? '#ef4444' : '#10b981', mono: true },
                                                    { label: 'Avg Latency', value: `${wh.avgLatency}ms`, mono: true, color: 'var(--text-primary)' },
                                                    { label: 'Last Triggered', value: timeAgo(wh.lastTriggered), color: 'var(--text-secondary)' },
                                                ].map((s, i) => (
                                                    <div key={i}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: s.color || 'var(--text-primary)', fontFamily: s.mono ? 'var(--font-mono)' : 'inherit', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {s.icon}{s.value}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ marginLeft: 'auto' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Secret</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        <code style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{visibleSecrets.has(wh.id) ? wh.secret : wh.secret.substring(0, 12) + '•••'}</code>
                                                        <button onClick={() => toggleSecret(wh.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}>{visibleSecrets.has(wh.id) ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                                                        <CopyBtn text={wh.secret} id={`sec-${wh.id}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* ═══ API KEYS ═══ */}
                            {activeTab === 'apikeys' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Key size={16} color="#f59e0b" /> Generate New Key</h3>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production Backend)" style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                                            <button onClick={createApiKey} disabled={!newKeyName.trim()} style={{ background: '#f59e0b', border: 'none', padding: '12px 20px', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: newKeyName.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}>Generate Key</button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}><Lock size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> Keys are shown once at creation. Store them securely — never expose in client-side code.</p>
                                    </div>
                                    {apiKeys.map((k: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                            <Shield size={16} color="#f59e0b" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{k.name || 'Unnamed Key'}</div>
                                                <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{k.key?.substring(0, 20)}•••</code>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : ''}</span>
                                            <CopyBtn text={k.key} id={`key-${i}`} />
                                            <button onClick={() => revokeApiKey(k.key)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                        </div>
                                    ))}
                                    {apiKeys.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}><Key size={32} style={{ marginBottom: '8px', opacity: 0.3 }} /><p style={{ fontSize: '13px' }}>No API keys. Generate one to start integrating.</p></div>}
                                </div>
                            )}

                            {/* ═══ LOGS ═══ */}
                            {activeTab === 'logs' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {logs.map((log, i) => (
                                        <motion.div key={log.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                                            <div onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 80px 80px 30px', alignItems: 'center', padding: '12px 16px', background: expandedLog === log.id ? 'var(--bg-surface-hover)' : 'var(--bg-card)', border: `1px solid ${expandedLog === log.id ? 'var(--border-color)' : 'var(--border-subtle)'}`, borderRadius: expandedLog === log.id ? '10px 10px 0 0' : '10px', gap: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '4px', background: log.status < 300 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: log.status < 300 ? '#10b981' : '#ef4444', textAlign: 'center' }}>{log.status}</span>
                                                <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{log.event}</code>
                                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{timeAgo(log.timestamp)}</span>
                                                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: log.duration > 2000 ? '#ef4444' : 'var(--text-muted)' }}>{log.duration}ms</span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>attempt {log.attempt}</span>
                                                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transform: expandedLog === log.id ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
                                            </div>
                                            {expandedLog === log.id && (
                                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Request Body</div>
                                                        <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>{log.requestBody || 'N/A'}</pre>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Response Body</div>
                                                        <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: log.status < 300 ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>{log.responseBody || 'N/A'}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {logs.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>No delivery logs yet.</div>}
                                </div>
                            )}

                            {/* ═══ INTEGRATION GUIDE ═══ */}
                            {activeTab === 'docs' && verifyExamples && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Quick Start */}
                                    <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16} color="#3b82f6" /> Quick Start — Receive Your First Webhook</h3>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                                            <p style={{ margin: '0 0 8px' }}>1. Create a webhook endpoint above pointing to your server (e.g. <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>https://yourapp.com/webhooks/nalyse</code>)</p>
                                            <p style={{ margin: '0 0 8px' }}>2. Select which events you want to subscribe to</p>
                                            <p style={{ margin: '0 0 8px' }}>3. Copy the generated <strong>signing secret</strong> and store it in your environment variables</p>
                                            <p style={{ margin: 0 }}>4. Use the verification code below to validate incoming webhook signatures</p>
                                        </div>
                                    </div>

                                    {/* Payload Format */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Code2 size={16} color="#a855f7" /> Webhook Payload Format</h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Every delivery includes these headers and JSON body:</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>Headers</div>
                                                <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{`Content-Type: application/json
X-Nalyse-Event: analysis.completed
X-Nalyse-Signature: sha256=a1b2c3...
X-Nalyse-Delivery: wl-1720000000`}</pre>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>Body (JSON)</div>
                                                <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{`{
  "event": "analysis.completed",
  "data": {
    "datasetId": "ds-abc-123",
    "filename": "sales_q4.csv",
    "rows": 14820,
    "insights": 7
  },
  "webhook_id": "wh-123",
  "timestamp": "2026-04-05T01:00:00Z"
}`}</pre>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature Verification */}
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}><Shield size={16} color="#10b981" /> Signature Verification — Real Example</h3>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {(['node', 'python', 'go'] as const).map(lang => (
                                                    <button key={lang} onClick={() => setDocLang(lang)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: docLang === lang ? '#10b981' : 'var(--border-color)', background: docLang === lang ? 'rgba(16,185,129,0.15)' : 'transparent', color: docLang === lang ? '#10b981' : 'var(--text-muted)', textTransform: 'capitalize' }}>{lang === 'node' ? 'Node.js' : lang === 'python' ? 'Python' : 'Go'}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'var(--bg-main)', padding: '20px', borderRadius: '10px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '500px' }}>{verifyExamples[docLang]}</pre>
                                            <button onClick={() => copyText(verifyExamples[docLang], `verify-${docLang}`)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: copiedId === `verify-${docLang}` ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {copiedId === `verify-${docLang}` ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Available Events */}
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Hash size={16} color="#f59e0b" /> Available Event Types</h3>
                                        {Object.entries(eventsByCategory).map(([cat, evts]) => (
                                            <div key={cat} style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{cat}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {evts.map(ev => (
                                                        <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                                                            <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--warning)', fontWeight: 700, minWidth: '180px' }}>{ev.id}</code>
                                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ev.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
