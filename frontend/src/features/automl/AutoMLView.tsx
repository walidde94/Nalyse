import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis 
} from 'recharts';
import {
    BrainCircuit, Network, Database, Layers, Sparkles, RefreshCw, BoxSelect
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

// ─── Theme Colors ──────────────────────────────────────────────
const CLUSTER_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#60a5fa', '#38bdf8'];

// ─── Custom Tooltip ──────────────────────────────────────────
const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-default)',
            padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)',
            minWidth: '180px', color: 'var(--text-primary)'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: data.color }} />
            <p style={{ color: data.color, fontSize: '11px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Cluster {data.cluster + 1}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Feature X ({data.xLabel}):</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{data.x.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Feature Y ({data.yLabel}):</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{data.y.toFixed(2)}</span>
            </div>
        </div>
    );
};

// ─── Components ──────────────────────────────────────────────
const LOAD_STEPS = ['Analyzing dataset schema…', 'Normalizing feature vectors…', 'Initializng K-Means centroids…', 'Iterating nearest-neighbor boundaries…', 'Assigning optimal clusters…'];

interface Props {
    files: { id: string; filename: string; size: number; createdAt: string }[];
    token: string;
}

export const AutoMLView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const [selectedFile, setSelectedFile] = useState('');
    const [featureX, setFeatureX] = useState('');
    const [featureY, setFeatureY] = useState('');
    const [kClusters, setKClusters] = useState('3');
    
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [clusterData, setClusterData] = useState<any[]>([]);
    const [availableColumns, setAvailableColumns] = useState<{name: string, type: string}[]>([]);

    const handleFileChange = async (fileId: string) => {
        setSelectedFile(fileId);
        setAvailableColumns([]);
        if (!fileId) return;

        try {
            const res = await fetch(`${API_URL}/api/files/${fileId}/preview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableColumns(data.columns || []);
                const numerics = (data.columns || []).filter((c: any) => c.type === 'numeric');
                if (numerics.length >= 2) {
                    setFeatureX(numerics[0].name);
                    setFeatureY(numerics[1].name);
                }
            }
        } catch (e) {
            console.error('Failed to load file schema', e);
        }
    };

    const runClustering = useCallback(async () => {
        if (!selectedFile || !featureX || !featureY) {
            addToast('Select a dataset and at least two features.', 'error');
            return;
        }

        setLoading(true);
        setLoadStep(0);

        try {
            const response = await fetch(`${API_URL}/api/files/${selectedFile}/cluster`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    featureX,
                    featureY,
                    clusters: parseInt(kClusters) || 3
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Clustering failed on server');
            }

            const result = await response.json();

            // Artificial delay for UI elegance
            for (let i = 0; i < LOAD_STEPS.length; i++) {
                setLoadStep(i);
                await new Promise(r => setTimeout(r, 400));
            }

            // Decorate data with colors
            const decorated = result.data.map((d: any) => ({
                ...d,
                color: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length],
                xLabel: featureX,
                yLabel: featureY
            }));

            setClusterData(decorated);
            addToast(`Successfully synthesized ${kClusters} algorithmic clusters`, 'success');

        } catch (e: any) {
            if (e.message === 'FILE_NOT_FOUND') {
                addToast('Server storage reset. Please re-upload this dataset to enable AutoML.', 'error');
            } else {
                addToast(e.message || 'AutoML failed', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedFile, featureX, featureY, kClusters, token, addToast]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(217,70,239,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(217,70,239,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BrainCircuit size={24} style={{ color: '#d946ef' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AutoML Intelligence
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Unsupervised K-Means Clustering • Automated Segmentation • Boundary Discovery
                        </p>
                    </div>
                </div>
            </div>

            {/* Configuration Panel */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #d946ef, #3b82f6)' }} />
                
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Network size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Clustering Parameters</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    {/* Dataset Selection */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Dataset</label>
                        <select value={selectedFile} onChange={e => handleFileChange(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFile ? 'rgba(217,70,239,0.4)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="">Select dataset…</option>
                            {files.map(f => <option key={f.id} value={f.id}>{(f as any).originalName || f.filename}</option>)}
                        </select>
                    </div>

                    {/* Feature Vectors */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>Feature 1 (X)</label>
                            <select value={featureX} onChange={e => setFeatureX(e.target.value)} disabled={!availableColumns.length}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, opacity: availableColumns.length ? 1 : 0.5 }}>
                                {availableColumns.filter(c => c.type === 'numeric').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>Feature 2 (Y)</label>
                            <select value={featureY} onChange={e => setFeatureY(e.target.value)} disabled={!availableColumns.length}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, opacity: availableColumns.length ? 1 : 0.5 }}>
                                {availableColumns.filter(c => c.type === 'numeric').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Math Setup */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>K (Optimal Clusters)</label>
                        <select value={kClusters} onChange={e => setKClusters(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n.toString()}>{n} Clusters</option>)}
                        </select>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runClustering}
                        disabled={loading || !selectedFile || !featureX || !featureY}
                        style={{ padding: '10px 24px', height: '40px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #d946ef, #3b82f6)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFile || !featureX) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(217,70,239,0.25)', whiteSpace: 'nowrap' }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {loading ? 'Synthesizing…' : 'Run AutoML'}
                    </motion.button>
                </div>
            </div>

            {/* Loading Modal Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(217,70,239,0.15)', borderTop: '3px solid #d946ef' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '300px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} /> : i === loadStep ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d946ef', boxShadow: '0 0 10px #d946ef' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Chart */}
            {!loading && clusterData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <BoxSelect size={18} style={{ color: '#3b82f6' }} />
                                <span style={{ fontSize: '14px', fontWeight: 700 }}>Segment Boundary Map: <span style={{ color: 'var(--text-secondary)' }}>K-Means Convergence</span></span>
                            </div>
                        </div>
                        
                        <div style={{ height: '500px', padding: '20px 40px 20px 20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' />
                                    <XAxis type="number" dataKey="x" name={featureX} stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis type="number" dataKey="y" name={featureY} stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <ZAxis type="number" range={[50, 50]} />
                                    <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                    
                                    <Scatter data={clusterData}>
                                        {clusterData.map((d, i) => (
                                            <Cell key={i} fill={d.color} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Empty State */}
            {!loading && clusterData.length === 0 && (
                <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(217,70,239,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(217,70,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Layers size={40} style={{ color: '#d946ef', opacity: 0.8 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Launch Unsupervised AutoML</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Drop in complex, unorganized data. Select multiple feature vectors, and Nalyse will automatically calculate spatial clusters to expose hidden strategic segments!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoMLView;
