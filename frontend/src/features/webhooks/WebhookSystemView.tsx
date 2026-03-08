import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Webhook, Key, Plus, Trash2, Play, Pause, CheckCircle2, XCircle,
    Clock, Zap, ExternalLink, Copy, Check, Loader2, RefreshCw,
    Shield, Activity, AlertTriangle, Globe, Code2, ChevronDown
} from 'lucide-react';
import { API_URL } from '../../config';

interface WebhookItem {
    id: string; url: string; events: string[]; secret: string;
    status: string; createdAt: string; lastTriggered: string | null;
    deliveries: number; failureRate: number;
}

export const WebhookSystemView = ({ token }: { token?: string }) => {
    const [activeTab, setActiveTab] = useState<'webhooks' | 'apikeys' | 'logs'>('webhooks');
    const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const headers: any = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [whRes, logRes, evtRes, keyRes] = await Promise.all([
                fetch(`${API_URL}/api/webhooks`, { headers }).then(r => r.json()).catch(() => ({ webhooks: [] })),
                fetch(`${API_URL}/api/webhooks/logs`, { headers }).then(r => r.json()).catch(() => ({ logs: [] })),
                fetch(`${API_URL}/api/webhooks/events`, { headers }).then(r => r.json()).catch(() => ({ events: [] })),
                fetch(`${API_URL}/api/apikeys`, { headers }).then(r => r.json()).catch(() => []),
            ]);
            setWebhooks(whRes.webhooks || []);
            setLogs(logRes.logs || []);
            setEvents(evtRes.events || []);
            setApiKeys(Array.isArray(keyRes) ? keyRes : keyRes.keys || []);
        } catch { }
        setLoading(false);
    };

    const createWebhook = async () => {
        if (!newUrl.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/webhooks`, {
                method: 'POST', headers,
                body: JSON.stringify({ url: newUrl, events: selectedEvents })
            });
            const data = await res.json();
            if (data.success) { setWebhooks(prev => [...prev, data.webhook]); setShowCreate(false); setNewUrl(''); setSelectedEvents([]); }
        } catch { }
    };

    const toggleWebhook = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/webhooks/${id}/toggle`, { method: 'PATCH', headers });
            const data = await res.json();
            if (data.success) setWebhooks(prev => prev.map(w => w.id === id ? data.webhook : w));
        } catch { }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/webhooks/${id}`, { method: 'DELETE', headers });
            setWebhooks(prev => prev.filter(w => w.id !== id));
        } catch { }
    };

    const testWebhook = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/webhooks/${id}/test`, { method: 'POST', headers });
            const data = await res.json();
            if (data.success) setLogs(prev => [data.delivery, ...prev]);
        } catch { }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const timeAgo = (ts: string | null) => {
        if (!ts) return 'Never';
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', position: 'relative', minHeight: '100%' }}>
            {/* Atmosphere */}
            <div style={{ position: 'absolute', top: '10%', right: '20%', width: '40vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(245, 158, 11, 0.06), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(245, 158, 11, 0.5)' }}>
                            <Webhook size={22} color="#fff" />
                        </div>
                        API & Webhook Engine
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontWeight: 500, marginLeft: '52px' }}>
                        Manage API keys, configure webhook endpoints, and monitor delivery health.
                    </p>
                </div>
                <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)' }}>
                    <Plus size={16} /> New Webhook
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                {[
                    { id: 'webhooks', label: 'Webhook Endpoints', icon: <Webhook size={15} />, count: webhooks.length },
                    { id: 'apikeys', label: 'API Keys', icon: <Key size={15} />, count: apiKeys.length },
                    { id: 'logs', label: 'Delivery Logs', icon: <Activity size={15} />, count: logs.length },
                ].map(t => {
                    const isActive = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px',
                            background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            {t.icon} {t.label}
                            <span style={{ background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>{t.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Create Webhook Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', marginBottom: '24px', position: 'relative', zIndex: 1 }}
                    >
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Register Webhook Endpoint</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Payload URL</label>
                                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://api.example.com/webhooks" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Subscribe to Events</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {events.map(ev => {
                                        const selected = selectedEvents.includes(ev.id);
                                        return (
                                            <button key={ev.id} onClick={() => setSelectedEvents(selected ? selectedEvents.filter(e => e !== ev.id) : [...selectedEvents, ev.id])}
                                                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', border: `1px solid ${selected ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, background: selected ? 'rgba(245, 158, 11, 0.15)' : 'transparent', color: selected ? '#f59e0b' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                                                {ev.id}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={createWebhook} disabled={!newUrl.trim()} style={{ background: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: newUrl.trim() ? 1 : 0.5 }}>Create Webhook</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                            <Loader2 className="animate-spin" size={32} color="#f59e0b" />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Integration Engine...</span>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                            {/* ─── WEBHOOKS ──────────────────────────────── */}
                            {activeTab === 'webhooks' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {webhooks.map((wh, i) => (
                                        <motion.div key={wh.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: wh.status === 'active' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'rgba(255,255,255,0.1)' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <Globe size={14} color="#f59e0b" />
                                                        <code style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{wh.url}</code>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {wh.events.map((ev: string) => (
                                                            <span key={ev} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{ev}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => testWebhook(wh.id)} title="Test" style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }}><Zap size={14} /></button>
                                                    <button onClick={() => toggleWebhook(wh.id)} title={wh.status === 'active' ? 'Pause' : 'Resume'} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                                                        {wh.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                    <button onClick={() => deleteWebhook(wh.id)} title="Delete" style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: wh.status === 'active' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        {wh.status === 'active' ? <CheckCircle2 size={12} /> : <Pause size={12} />} {wh.status}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Deliveries</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{wh.deliveries}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Failure Rate</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: wh.failureRate > 5 ? '#ef4444' : '#10b981', marginTop: '4px' }}>{wh.failureRate}%</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Last Triggered</div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{timeAgo(wh.lastTriggered)}</div>
                                                </div>
                                                <div style={{ marginLeft: 'auto' }}>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Secret</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                        <code style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{wh.secret.substring(0, 16)}...</code>
                                                        <button onClick={() => copyToClipboard(wh.secret, wh.id)} style={{ background: 'none', border: 'none', color: copiedId === wh.id ? '#10b981' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}>
                                                            {copiedId === wh.id ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* ─── API KEYS ─────────────────────────────── */}
                            {activeTab === 'apikeys' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Key size={16} color="#f59e0b" /> Service API Keys
                                        </h3>
                                        <button style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <Plus size={14} /> Generate Key
                                        </button>
                                    </div>

                                    {apiKeys.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {apiKeys.map((k: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <Shield size={16} color="#f59e0b" />
                                                    <code style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{k.key || k.id || 'nal_key_•••••'}</code>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{k.scope || 'full_access'}</span>
                                                    <button style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                            <Key size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                            <p style={{ fontSize: '13px' }}>No API keys generated yet. Create one to start integrating.</p>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px' }}>
                                        <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Code2 size={14} color="#f59e0b" /> Quick Start
                                        </h4>
                                        <pre style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                            {`curl -X GET ${API_URL}/api/v1/analysis \\
  -H "Authorization: Bearer nal_key_YOUR_KEY" \\
  -H "Content-Type: application/json"`}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* ─── DELIVERY LOGS ─────────────────────────── */}
                            {activeTab === 'logs' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {logs.map((log, i) => (
                                        <motion.div key={log.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                            style={{ display: 'grid', gridTemplateColumns: '80px 1fr 180px 100px 100px', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{
                                                    fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                                    padding: '4px 8px', borderRadius: '4px',
                                                    background: log.status < 300 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: log.status < 300 ? '#10b981' : '#ef4444'
                                                }}>{log.status}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{log.event}</div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{timeAgo(log.timestamp)}</div>
                                            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: log.duration > 2000 ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{log.duration}ms</div>
                                            <div style={{ textAlign: 'right' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>Inspect</button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
