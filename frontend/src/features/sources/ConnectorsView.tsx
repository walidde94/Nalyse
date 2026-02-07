import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toast';
import { AnalysisView } from '../analysis/AnalysisView';

interface RemoteSource {
    id: string;
    name: string;
    type: 'postgresql' | 'mysql' | 'rest_api' | 's3_bucket';
    config: any;
    status: string;
    lastSyncedAt?: string;
}

import { Zap, AlertCircle, RefreshCw, Database, Terminal, Shield } from 'lucide-react';
import { API_URL } from '../../config';

export const ConnectorsView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [sources, setSources] = useState<RemoteSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingSource, setEditingSource] = useState<RemoteSource | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'postgresql' | 'rest_api'>('rest_api');
    const [newUrl, setNewUrl] = useState('');
    const [newRootKey, setNewRootKey] = useState('');

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
        if (!newName || (newType === 'rest_api' && !newUrl)) return;
        setLoading(true);
        try {
            const config = newType === 'rest_api' ? { url: newUrl, rootKey: newRootKey } : { host: 'localhost', database: 'customer_db' };
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
                addToast(editingSource ? 'Connector updated' : 'Connector established', 'success');
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
        setNewType(source.type === 'rest_api' ? 'rest_api' : 'postgresql');
        if (source.type === 'rest_api') {
            setNewUrl(source.config.url || '');
            setNewRootKey(source.config.rootKey || '');
        }
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
            // Only update if it refers to our current active source
            if (autoSync && activeSourceId && (payload.sourceId === activeSourceId || !payload.sourceId)) {
                runLiveAnalysis(activeSourceId, activeSourceName);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeSourceId, activeSourceName, autoSync, runLiveAnalysis]);

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
                    <h1 className="text-h1">Data Connectors</h1>
                    <p className="text-sec">Connect external databases and APIs for real-time strategic monitoring.</p>
                </div>
                {!isAdding && <button className="btn btn-primary" onClick={() => setIsAdding(true)}>+ New Remote Connection</button>}
            </div>

            {isAdding && (
                <div className="card p-8 flex-col gap-6 glass animate-slide-down">
                    <div className="flex justify-between items-center">
                        <h3 className="text-h3">{editingSource ? 'Edit Connector' : 'Configure Source'}</h3>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setIsAdding(false); setEditingSource(null); }}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex-col gap-2">
                            <label className="text-xs font-bold text-tertiary">CONNECTION NAME</label>
                            <input className="input" placeholder="e.g. Production ERP" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-xs font-bold text-tertiary">SOURCE TYPE</label>
                            <select className="input" value={newType} onChange={e => setNewType(e.target.value as any)}>
                                <option value="rest_api">REST API (JSON)</option>
                                <option value="postgresql">PostgreSQL (Remote)</option>
                                <option value="mysql">MySQL (Remote)</option>
                            </select>
                        </div>
                        {newType === 'rest_api' && (
                            <>
                                <div className="col-span-2 flex-col gap-2">
                                    <label className="text-xs font-bold text-tertiary">ENDPOINT URL</label>
                                    <input className="input" placeholder="https://api.yourcompany.com/v1/data" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                                </div>
                                <div className="col-span-2 flex-col gap-2">
                                    <label className="text-xs font-bold text-tertiary">ROOT DATA KEY (OPTIONAL)</label>
                                    <input className="input" placeholder="e.g. results, products, data" value={newRootKey} onChange={e => setNewRootKey(e.target.value)} />
                                    <p className="text-[10px] text-tertiary">If your API returns an object like {`{ "data": [...] }`}, enter "data" here.</p>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="btn btn-primary btn-lg w-full mt-4" onClick={handleAdd} disabled={loading}>{loading ? 'Applying Changes...' : (editingSource ? 'Save Changes' : 'Connect Source')}</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources.map(s => (
                    <div key={s.id} className="card p-6 flex-col gap-4 border-l-4 border-primary relative group">
                        <div className="flex justify-between items-start">
                            <div className="flex-col">
                                <span className="text-[10px] font-black uppercase text-primary">{s.type.replace('_', ' ')}</span>
                                <h4 className="font-bold text-lg">{s.name}</h4>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] pulse-success"></div>
                                    <span className="tech-text" style={{ fontSize: '9px', color: 'var(--success)' }}>HEALTHY</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="btn btn-icon btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-tertiary hover:bg-bg-app"
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
                        </div>
                        <div className="flex-col gap-1 text-xs text-sec">
                            {s.type === 'rest_api' ? <code>{(s.config?.url || '').substring(0, 30)}...</code> : <span>Host: {s.config?.host}</span>}
                        </div>
                        <div className="flex justify-between items-center mt-4 border-t border-subtle pt-4">
                            <button className="btn btn-primary btn-sm active-press" onClick={() => {
                                setAutoSync(true);
                                runLiveAnalysis(s.id, s.name);
                            }}>Go Live</button>
                            <div className="flex flex-col items-end">
                                <span className="tech-text" style={{ fontSize: '8px', opacity: 0.5 }}>Last Sync</span>
                                <span className="font-data" style={{ fontSize: '10px' }}>{s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleTimeString() : 'Never'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {sources.length === 0 && !isAdding && (
                    <div className="col-span-3 py-20 text-center border-2 border-dashed border-subtle rounded-3xl opacity-50">
                        <h3 className="text-h3 mb-2">No Active Connectors</h3>
                        <p className="text-sec">Link your server or cloud data to see real-time insights.</p>
                    </div>
                )}
            </div>
        </div >
    );
};
