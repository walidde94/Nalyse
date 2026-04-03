import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toast';
import { AnalysisView } from '../analysis/AnalysisView';
import {
    Zap, AlertCircle, RefreshCw, Database, Terminal, Shield, CreditCard, Cloud, Users, BarChart,
    Plus, X, Loader2, CheckCircle2, ArrowRight, Settings2, Trash2, ExternalLink, Radio, Wifi,
    Globe, Sparkles, Cable, Server, ChevronRight
} from 'lucide-react';
import { API_URL } from '../../config';

interface RemoteSource {
    id: string;
    name: string;
    type: 'postgresql' | 'mysql' | 'rest_api' | 's3_bucket' | 'stripe' | 'salesforce' | 'hubspot' | 'google_analytics';
    config: any;
    status: string;
    lastSyncedAt?: string;
}

/* ─── Connector Metadata ────────────────────────────────────── */
const CONNECTOR_META: Record<string, { label: string; color: string; gradient: string; icon: any; description: string }> = {
    stripe:            { label: 'Stripe',            color: '#635BFF', gradient: 'linear-gradient(135deg, #635BFF, #7C3AED)', icon: CreditCard, description: 'Payments, subscriptions, invoices & revenue data' },
    salesforce:        { label: 'Salesforce',        color: '#00A1E0', gradient: 'linear-gradient(135deg, #00A1E0, #0EA5E9)', icon: Cloud,      description: 'CRM pipeline, leads, contacts & opportunities' },
    hubspot:           { label: 'HubSpot',           color: '#FF7A59', gradient: 'linear-gradient(135deg, #FF7A59, #F97316)', icon: Users,      description: 'Marketing automation, contacts & deal flow' },
    google_analytics:  { label: 'Google Analytics',  color: '#E37400', gradient: 'linear-gradient(135deg, #E37400, #F59E0B)', icon: BarChart,   description: 'Traffic, sessions, conversions & audience data' },
    postgresql:        { label: 'PostgreSQL',        color: '#336791', gradient: 'linear-gradient(135deg, #336791, #3B82F6)', icon: Database,   description: 'Direct SQL access to your PostgreSQL tables' },
    mysql:             { label: 'MySQL',             color: '#E48E00', gradient: 'linear-gradient(135deg, #E48E00, #F59E0B)', icon: Database,   description: 'Direct SQL access to your MySQL tables' },
    rest_api:          { label: 'REST API',          color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)', icon: Terminal,   description: 'Pull any JSON API endpoint into Nalyse' },
    s3_bucket:         { label: 'S3 Bucket',         color: '#FF9900', gradient: 'linear-gradient(135deg, #FF9900, #F97316)', icon: Server,     description: 'Connect S3-compatible object storage' },
};

/* ─── Connector Card ────────────────────────────────────────── */
const ConnectorCard = ({ source, onEdit, onDelete, onGoLive }: { source: RemoteSource; onEdit: () => void; onDelete: () => void; onGoLive: () => void }) => {
    const meta = CONNECTOR_META[source.type] || CONNECTOR_META.rest_api;
    const Icon = meta.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            whileHover={{ y: -4, boxShadow: `0 24px 48px -12px ${meta.color}25` }}
            transition={{ duration: 0.3 }}
            style={{
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
            }}
        >
            {/* Top Gradient Stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: meta.gradient }} />

            {/* Ambient Glow */}
            <div style={{
                position: 'absolute', top: '-20%', right: '-10%', width: '180px', height: '180px',
                background: `radial-gradient(circle, ${meta.color}10, transparent 70%)`,
                borderRadius: '50%', pointerEvents: 'none'
            }} />

            <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: meta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 20px -4px ${meta.color}40`,
                        }}>
                            <Icon size={22} style={{ color: '#fff' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: meta.color, marginBottom: '2px' }}>
                                {meta.label}
                            </div>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{source.name}</h4>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
                            background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
                            cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s'
                        }}><Settings2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
                            background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
                            cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s'
                        }}><Trash2 size={14} /></button>
                    </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connected & Healthy</span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '16px' }} />

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); onGoLive(); }}
                        style={{
                            padding: '8px 20px', borderRadius: '10px', border: 'none',
                            background: meta.gradient, color: '#fff', fontSize: '12px', fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: `0 4px 16px -2px ${meta.color}40`,
                            textTransform: 'uppercase', letterSpacing: '0.06em'
                        }}
                    >
                        <Zap size={13} style={{ fill: '#fff' }} /> Go Live
                    </motion.button>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Last Sync</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleTimeString() : 'Never'}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ─── Available Connector Picker Card ───────────────────────── */
const AvailableConnectorCard = ({ type, onClick }: { type: string; onClick: () => void }) => {
    const meta = CONNECTOR_META[type];
    if (!meta) return null;
    const Icon = meta.icon;

    return (
        <motion.button
            whileHover={{ y: -3, scale: 1.02, boxShadow: `0 16px 32px -8px ${meta.color}20` }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                padding: '20px', borderRadius: '16px', border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)', cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative',
                overflow: 'hidden', transition: 'border-color 0.2s',
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: meta.gradient, opacity: 0.6 }} />
            <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: `${meta.color}15`, border: `1px solid ${meta.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={20} style={{ color: meta.color }} />
            </div>
            <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{meta.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{meta.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: meta.color }}>
                Configure <ChevronRight size={12} />
            </div>
        </motion.button>
    );
};

/* ═══════════════════════════════════════════════════════════════ */
export const ConnectorsView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [sources, setSources] = useState<RemoteSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingSource, setEditingSource] = useState<RemoteSource | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<RemoteSource['type']>('stripe');
    const [newUrl, setNewUrl] = useState('');
    const [newRootKey, setNewRootKey] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [newHost, setNewHost] = useState('');

    // Live View State
    const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
    const [activeSourceName, setActiveSourceName] = useState('');
    const [activeSourceId, setActiveSourceId] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoSync, setAutoSync] = useState(false);

    const fetchSources = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/sources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setSources(await res.json());
        } catch (e) {
            addToast('Failed to load connectors', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, addToast]);

    useEffect(() => { fetchSources(); }, [fetchSources]);

    const resetForm = () => {
        setNewName(''); setNewUrl(''); setNewRootKey(''); setNewApiKey(''); setNewHost('');
        setEditingSource(null); setIsAdding(false); setShowPicker(false);
    };

    const handleAdd = async () => {
        if (!newName) return;
        setLoading(true);
        try {
            let config: any = {};
            if (newType === 'rest_api') {
                config = { url: newUrl, rootKey: newRootKey, apiKey: newApiKey };
            } else if (['stripe', 'salesforce', 'hubspot', 'google_analytics'].includes(newType)) {
                config = { apiKey: newApiKey };
            } else {
                config = { host: newHost || 'localhost', database: 'customer_db' };
            }

            const method = editingSource ? 'PUT' : 'POST';
            const url = editingSource ? `${API_URL}/api/sources/${editingSource.id}` : `${API_URL}/api/sources`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newName, type: newType, config })
            });

            if (res.ok) {
                await fetchSources();
                resetForm();
                addToast(editingSource ? 'Connector updated' : 'Connector established — data pipeline is live!', 'success');
            } else {
                addToast('Failed to save connector', 'error');
            }
        } catch (e) {
            addToast('Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (source: RemoteSource) => {
        setEditingSource(source);
        setNewName(source.name);
        setNewType(source.type);
        setNewUrl(source.config?.url || '');
        setNewRootKey(source.config?.rootKey || '');
        setNewApiKey(source.config?.apiKey || '');
        setNewHost(source.config?.host || '');
        setIsAdding(true);
        setShowPicker(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Disconnect this data source? All live analysis will be stopped.')) return;
        try {
            const res = await fetch(`${API_URL}/api/sources/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) { addToast('Source disconnected', 'success'); fetchSources(); }
        } catch (e) { addToast('Failed to delete source', 'error'); }
    };

    const runLiveAnalysis = useCallback(async (id?: string, name?: string) => {
        const targetId = id || activeSourceId;
        const targetName = name || activeSourceName;
        if (!targetId) return;
        setIsRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/api/sources/${targetId}/analyze`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActiveAnalysis(data.analysis);
                if (targetName) setActiveSourceName(targetName);
                setActiveSourceId(targetId);
            }
        } catch (e) { console.error('Sync failed', e); }
        finally { setIsRefreshing(false); }
    }, [activeSourceId, activeSourceName, token]);

    // WebSocket
    useEffect(() => {
        const socket = io(API_URL);
        socket.on('live_update', (payload: any) => {
            if (autoSync && activeSourceId && (payload.sourceId === activeSourceId || !payload.sourceId)) {
                runLiveAnalysis(activeSourceId, activeSourceName);
            }
        });
        return () => { socket.disconnect(); };
    }, [activeSourceId, activeSourceName, autoSync, runLiveAnalysis]);

    const meta = CONNECTOR_META[newType] || CONNECTOR_META.stripe;

    /* ─── Live Analysis View ────────────────────────────────── */
    if (activeAnalysis) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => { setActiveAnalysis(null); setAutoSync(false); }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '8px 16px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            ← Back
                        </button>
                        <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Radio size={14} style={{ color: '#34d399' }} /> Live: {activeSourceName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Auto-Sync</span>
                            <div
                                onClick={() => setAutoSync(!autoSync)}
                                style={{
                                    width: '32px', height: '16px', borderRadius: '20px', cursor: 'pointer', position: 'relative',
                                    background: autoSync ? '#34d399' : 'var(--bg-surface)', border: `1px solid ${autoSync ? '#34d399' : 'var(--border-default)'}`,
                                    transition: 'all 0.3s', boxShadow: autoSync ? '0 0 12px rgba(52,211,153,0.3)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: '1px', left: autoSync ? '17px' : '1px', transition: 'left 0.3s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>
                        {isRefreshing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <Loader2 size={12} className="animate-spin" style={{ color: '#3b82f6' }} />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6' }}>Syncing...</span>
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => runLiveAnalysis(activeSourceId, activeSourceName)}
                        disabled={isRefreshing}
                        style={{
                            padding: '8px 20px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
                            fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: isRefreshing ? 0.5 : 1
                        }}
                    >
                        <RefreshCw size={13} /> Refresh
                    </motion.button>
                </header>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <AnalysisView analysis={activeAnalysis} onClose={() => setActiveAnalysis(null)} />
                </div>
            </div>
        );
    }

    /* ─── Main View ─────────────────────────────────────────── */
    return (
        <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {/* ── Hero Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    padding: '32px 36px', borderRadius: '24px', marginBottom: '32px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                }}
            >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)' }} />
                <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '18px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 12px 24px -4px rgba(59,130,246,0.4)',
                        }}>
                            <Cable size={26} style={{ color: '#fff' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Live Data Connectors
                                </h1>
                                <span style={{
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 900,
                                    textTransform: 'uppercase', letterSpacing: '0.12em',
                                    background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'
                                }}>Phase 6</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 500, maxWidth: '500px' }}>
                                1-click integrations for Stripe, Salesforce, HubSpot & more. Data flows automatically every hour.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{sources.length}</div>
                            <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginTop: '2px' }}>Active</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                                {sources.filter(s => s.lastSyncedAt).length}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginTop: '2px' }}>Synced</div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setShowPicker(true)}
                            style={{
                                padding: '12px 24px', borderRadius: '14px', border: 'none',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
                                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 8px 24px -4px rgba(59,130,246,0.35)',
                            }}
                        >
                            <Plus size={16} /> New Connector
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ── Connector Picker Modal ── */}
            <AnimatePresence>
                {showPicker && !isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{
                            padding: '28px', borderRadius: '20px', marginBottom: '24px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Choose a Platform</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 500 }}>Select a SaaS platform or database to connect</p>
                            </div>
                            <button onClick={() => setShowPicker(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {Object.keys(CONNECTOR_META).map(type => (
                                <AvailableConnectorCard
                                    key={type}
                                    type={type}
                                    onClick={() => {
                                        setNewType(type as RemoteSource['type']);
                                        setNewName('');
                                        setNewApiKey('');
                                        setNewUrl('');
                                        setNewRootKey('');
                                        setNewHost('');
                                        setIsAdding(true);
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Configuration Form ── */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        style={{
                            padding: '28px', borderRadius: '20px', marginBottom: '24px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: meta.gradient }} />

                        {/* Form Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px', background: meta.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {(() => { const Icon = meta.icon; return <Icon size={20} style={{ color: '#fff' }} />; })()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                        {editingSource ? `Edit ${meta.label}` : `Connect ${meta.label}`}
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{meta.description}</p>
                                </div>
                            </div>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: meta.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                                    Integration Name
                                </label>
                                <input
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    placeholder={`e.g. Acme Corp ${meta.label}`}
                                    style={{
                                        padding: '12px 16px', borderRadius: '12px',
                                        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                        color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                                        outline: 'none', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = meta.color}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Platform</label>
                                <select value={newType} onChange={e => setNewType(e.target.value as any)} style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, outline: 'none',
                                }}>
                                    <optgroup label="SaaS Platforms">
                                        <option value="stripe">Stripe</option>
                                        <option value="salesforce">Salesforce</option>
                                        <option value="hubspot">HubSpot</option>
                                        <option value="google_analytics">Google Analytics</option>
                                    </optgroup>
                                    <optgroup label="Databases">
                                        <option value="postgresql">PostgreSQL</option>
                                        <option value="mysql">MySQL</option>
                                        <option value="rest_api">REST API</option>
                                        <option value="s3_bucket">S3 Bucket</option>
                                    </optgroup>
                                </select>
                            </div>

                            {['stripe', 'salesforce', 'hubspot', 'google_analytics'].includes(newType) && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: meta.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Shield size={10} style={{ color: '#34d399' }} /> Secret API Key / OAuth Token
                                    </label>
                                    <input
                                        type="password" value={newApiKey} onChange={e => setNewApiKey(e.target.value)}
                                        placeholder="sk_live_..."
                                        style={{
                                            padding: '12px 16px', borderRadius: '12px',
                                            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none',
                                        }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                        <Shield size={11} style={{ color: '#34d399' }} />
                                        <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>AES-256 encrypted before storage</span>
                                    </div>
                                </div>
                            )}

                            {newType === 'rest_api' && (
                                <>
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: meta.color }}>Endpoint URL</label>
                                        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://api.example.com/v1/data"
                                            style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Bearer Token (optional)</label>
                                        <input type="password" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} placeholder="Bearer ..."
                                            style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Root Data Key (optional)</label>
                                        <input value={newRootKey} onChange={e => setNewRootKey(e.target.value)} placeholder="e.g. results, products, data"
                                            style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            {['postgresql', 'mysql'].includes(newType) && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: meta.color }}>Database Host</label>
                                    <input value={newHost} onChange={e => setNewHost(e.target.value)} placeholder="e.g. db.example.com"
                                        style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleAdd} disabled={loading || !newName}
                            style={{
                                width: '100%', marginTop: '20px', padding: '14px', borderRadius: '14px',
                                border: 'none', background: meta.gradient, color: '#fff',
                                fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: (!newName || loading) ? 0.5 : 1,
                                boxShadow: `0 8px 24px -4px ${meta.color}40`,
                            }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                            {loading ? 'Authenticating…' : (editingSource ? 'Save Changes' : 'Establish Secure Connection')}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Active Connectors Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                <AnimatePresence>
                    {sources.map(s => (
                        <ConnectorCard
                            key={s.id}
                            source={s}
                            onEdit={() => handleEdit(s)}
                            onDelete={() => handleDelete(s.id)}
                            onGoLive={() => { setAutoSync(true); runLiveAnalysis(s.id, s.name); }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Empty State ── */}
            {sources.length === 0 && !isAdding && !showPicker && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        padding: '72px 32px', borderRadius: '24px', textAlign: 'center',
                        background: 'var(--bg-surface)', border: '1px dashed var(--border-default)',
                        position: 'relative', overflow: 'hidden',
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(59,130,246,0.04), transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{
                        display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative', zIndex: 1
                    }}>
                        {['stripe', 'salesforce', 'hubspot', 'google_analytics'].map((t, i) => {
                            const m = CONNECTOR_META[t];
                            const Icon = m.icon;
                            return (
                                <motion.div
                                    key={t}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        width: '52px', height: '52px', borderRadius: '16px',
                                        background: m.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginLeft: i > 0 ? '-12px' : 0, zIndex: 10 - i,
                                        boxShadow: `0 8px 20px -4px ${m.color}50`, border: '2px solid var(--bg-surface)',
                                    }}
                                >
                                    <Icon size={22} style={{ color: '#fff' }} />
                                </motion.div>
                            );
                        })}
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', position: 'relative', zIndex: 1 }}>No Active Connectors</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                        Connect Stripe, Salesforce, HubSpot, or any database to stream live data directly into the Nalyse AI engine.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowPicker(true)}
                        style={{
                            padding: '12px 32px', borderRadius: '14px', border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
                            fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 8px 24px -4px rgba(59,130,246,0.35)',
                            position: 'relative', zIndex: 1
                        }}
                    >
                        <Cable size={16} /> Connect Your First Source
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
};
