import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toast';
import { AnalysisView } from '../analysis/AnalysisView';

interface RemoteSource {
    id: string;
    name: string;
    type: 'postgresql' | 'mysql' | 'rest_api' | 's3_bucket' | 'stripe' | 'salesforce' | 'hubspot' | 'google_analytics';
    config: any;
    status: string;
    lastSyncedAt?: string;
}

import { Zap, AlertCircle, RefreshCw, Database, Terminal, Shield, CreditCard, Cloud, Users, BarChart } from 'lucide-react';
import { API_URL } from '../../config';

export const ConnectorsView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [sources, setSources] = useState<RemoteSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingSource, setEditingSource] = useState<RemoteSource | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<RemoteSource['type']>('rest_api');
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
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName, type: newType, config })
            });

            if (res.ok) {
                await fetchSources();
                setIsAdding(false);
                setEditingSource(null);
                setNewName('');
                setNewUrl('');
                setNewRootKey('');
                setNewApiKey('');
                setNewHost('');
                addToast(editingSource ? 'Connector updated' : 'Connector established', 'success');
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
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this data source? All live analysis will be stopped.')) return;
        try {
            const res = await fetch(`${API_URL}/api/sources/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Source disconnected', 'success');
                fetchSources();
            }
        } catch (e) {
            addToast('Failed to delete source', 'error');
        }
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
        } catch (e) {
            console.error('Sync failed', e);
        } finally {
            setIsRefreshing(false);
        }
    }, [activeSourceId, activeSourceName, token]);

    // WebSocket Instant Updates
    useEffect(() => {
        const socket = io(API_URL);

        socket.on('live_update', (payload: any) => {
            if (autoSync && activeSourceId && (payload.sourceId === activeSourceId || !payload.sourceId)) {
                runLiveAnalysis(activeSourceId, activeSourceName);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeSourceId, activeSourceName, autoSync, runLiveAnalysis]);

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'stripe': return <CreditCard size={20} className="text-[#635BFF]" />;
            case 'salesforce': return <Cloud size={20} className="text-[#00A1E0]" />;
            case 'hubspot': return <Users size={20} className="text-[#FF7A59]" />;
            case 'google_analytics': return <BarChart size={20} className="text-[#E37400]" />;
            case 'postgresql': return <Database size={20} className="text-[#336791]" />;
            case 'mysql': return <Database size={20} className="text-[#E48E00]" />;
            default: return <Terminal size={20} className="text-secondary" />;
        }
    };

    if (activeAnalysis) {
        return (
            <div className="flex-col h-full fade-in">
                <header className="flex justify-between items-center p-6 bg-bg-surface border-b border-subtle">
                    <div className="flex items-center gap-4">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setActiveAnalysis(null); setAutoSync(false); }}>← Back</button>
                        <h2 className="text-h2">Live Stream: {activeSourceName}</h2>
                        <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-bg-app rounded-full border border-subtle">
                            <span className="tech-text" style={{ fontSize: '9px', opacity: 0.6 }}>AUTO-SYNC</span>
                            <div
                                className={`w-8 h-4 rounded-full relative cursor-pointer transition-all duration-300 ${autoSync ? 'bg-primary shadow-[0_0_10px_var(--primary-glow)]' : 'bg-bg-card'}`}
                                onClick={() => setAutoSync(!autoSync)}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 ${autoSync ? 'translate-x-4' : 'translate-x-0'}`} style={{ boxShadow: autoSync ? '0 0 5px white' : 'none' }}></div>
                            </div>
                        </div>
                        {isRefreshing && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                                <span className="animate-spin text-primary">◌</span>
                                <span className="tech-text" style={{ fontSize: '9px', color: 'var(--primary)' }}>Analyzing Knowledge Stream...</span>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => runLiveAnalysis(activeSourceId, activeSourceName)} disabled={isRefreshing}>Refresh Now</button>
                </header>
                <div className="flex-1 overflow-auto">
                    <AnalysisView analysis={activeAnalysis} onClose={() => setActiveAnalysis(null)} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-col gap-8 fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Dubai, sans-serif' }}>
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]/20">
                            <Zap size={24} className="text-primary" />
                        </div>
                        <h1 className="text-h1 m-0">Advanced Data Connectors</h1>
                        <span className="px-2 py-0.5 bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30 rounded-full text-[10px] font-bold uppercase tracking-widest ml-2">Phase 4</span>
                    </div>
                    <p className="text-sec">Seamlessly integrate your enterprise SaaS applications and databases directly into the Nalyse AI engine.</p>
                </div>
                {!isAdding && <button className="btn btn-primary" onClick={() => {
                    setIsAdding(true);
                    setEditingSource(null);
                    setNewName('');
                    setNewType('stripe');
                    setNewApiKey('');
                    setNewUrl('');
                    setNewRootKey('');
                    setNewHost('');
                }}>+ New Integration</button>}
            </div>

            {isAdding && (
                <div className="card p-8 flex-col gap-6 glass animate-slide-down border border-[var(--primary)]/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--success)]"></div>
                    <div className="flex justify-between items-center">
                        <h3 className="text-h3">{editingSource ? 'Edit Integration' : 'Configure Integration'}</h3>
                        <button className="btn btn-icon btn-ghost hover:bg-white/5" onClick={() => { setIsAdding(false); setEditingSource(null); }}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex-col gap-2">
                            <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Integration Name</label>
                            <input className="input" placeholder="e.g. Acme Corp Stripe" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-xs font-bold text-tertiary tracking-widest uppercase">SaaS / Database Platform</label>
                            <select className="input font-bold" value={newType} onChange={e => setNewType(e.target.value as any)}>
                                <optgroup label="SaaS Platforms">
                                    <option value="stripe">Stripe</option>
                                    <option value="salesforce">Salesforce</option>
                                    <option value="hubspot">HubSpot</option>
                                    <option value="google_analytics">Google Analytics</option>
                                </optgroup>
                                <optgroup label="Custom / Databases">
                                    <option value="postgresql">PostgreSQL (Remote)</option>
                                    <option value="mysql">MySQL (Remote)</option>
                                    <option value="rest_api">REST API (JSON)</option>
                                </optgroup>
                            </select>
                        </div>

                        {['stripe', 'salesforce', 'hubspot', 'google_analytics'].includes(newType) && (
                            <div className="col-span-2 flex-col gap-2">
                                <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Secret API Key / OAuth Token</label>
                                <input type="password" className="input" placeholder="sk_live_..." value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
                                <div className="flex items-center gap-2 mt-1">
                                    <Shield size={12} className="text-success" />
                                    <p className="text-[10px] text-success m-0">Credentials are fully encrypted before storage.</p>
                                </div>
                            </div>
                        )}

                        {newType === 'rest_api' && (
                            <>
                                <div className="col-span-2 flex-col gap-2">
                                    <label className="text-xs font-bold text-tertiary tracking-widest uppercase">ENDPOINT URL</label>
                                    <input className="input" placeholder="https://api.yourcompany.com/v1/data" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Bearer Token (Optional)</label>
                                    <input type="password" className="input" placeholder="Bearer ..." value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-xs font-bold text-tertiary tracking-widest uppercase">ROOT DATA KEY (OPTIONAL)</label>
                                    <input className="input" placeholder="e.g. results, products, data" value={newRootKey} onChange={e => setNewRootKey(e.target.value)} />
                                </div>
                            </>
                        )}

                        {['postgresql', 'mysql'].includes(newType) && (
                            <div className="col-span-2 flex-col gap-2">
                                <label className="text-xs font-bold text-tertiary tracking-widest uppercase">Database Host</label>
                                <input className="input" placeholder="e.g. db.example.com" value={newHost} onChange={e => setNewHost(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary btn-lg w-full mt-4 flex items-center justify-center gap-2" onClick={handleAdd} disabled={loading}>
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Authenticating...' : (editingSource ? 'Save Integration' : 'Establish Secure Connection')}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources.map(s => (
                    <div key={s.id} className="card p-6 flex-col gap-4 relative group hover-glow border border-[var(--border-subtle)] hover:border-[var(--primary)]/30 transition-all overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[var(--primary)]/10 transition-colors"></div>

                        <div className="flex justify-between items-start z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] shadow-inner">
                                    {getSourceIcon(s.type)}
                                </div>
                                <div className="flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 mb-0.5">{s.type.replace('_', ' ')}</span>
                                    <h4 className="font-bold text-md leading-tight">{s.name}</h4>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    className="btn btn-icon btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-tertiary hover:bg-bg-app hover:text-white"
                                    onClick={() => handleEdit(s)}
                                    title="Edit Connector"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button
                                    className="btn btn-icon btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:bg-danger-subtle"
                                    onClick={() => handleDelete(s.id)}
                                    title="Disconnect Source"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] pulse-success"></div>
                            <span className="tech-text" style={{ fontSize: '9px', color: 'var(--success)' }}>CONNECTED & HEALTHY</span>
                        </div>

                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-[var(--border-subtle)] z-10">
                            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => {
                                setAutoSync(true);
                                runLiveAnalysis(s.id, s.name);
                            }}>
                                <Zap size={12} className="fill-white" /> Go Live
                            </button>
                            <div className="flex flex-col items-end">
                                <span className="tech-text" style={{ fontSize: '8px', opacity: 0.5 }}>LAST SYNC</span>
                                <span className="font-data font-bold mt-0.5" style={{ fontSize: '10px' }}>
                                    {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleTimeString() : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {sources.length === 0 && !isAdding && (
                    <div className="col-span-full py-24 text-center border border-dashed border-primary/20 bg-primary/5 rounded-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="flex -space-x-4 mb-2">
                                <div className="w-12 h-12 rounded-full bg-bg-app border-2 border-primary/30 flex items-center justify-center relative z-30 shadow-xl"><CreditCard size={20} className="text-[#635BFF]" /></div>
                                <div className="w-12 h-12 rounded-full bg-bg-app border-2 border-primary/30 flex items-center justify-center relative z-20 shadow-xl"><Cloud size={20} className="text-[#00A1E0]" /></div>
                                <div className="w-12 h-12 rounded-full bg-bg-app border-2 border-primary/30 flex items-center justify-center relative z-10 shadow-xl"><Users size={20} className="text-[#FF7A59]" /></div>
                            </div>
                            <h3 className="text-2xl font-black mt-2">No Active Connectors</h3>
                            <p className="text-secondary max-w-sm">Connect external SaaS platforms and databases to stream data directly into the AI analyzer.</p>
                            <button className="btn btn-primary mt-2" onClick={() => setIsAdding(true)}>Configure First Source</button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
