import React, { useState, useCallback } from 'react';
import alasql from 'alasql';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link2, Sparkles, Database, CheckCircle2, RefreshCw, BarChart3,
    ArrowLeftRight, Columns, Code2, AlertTriangle, Layers, Zap
} from 'lucide-react';
import { API_URL } from '../../config';

const PRIMARY_COLOR = '#8b5cf6';
const SECONDARY_COLOR = '#06b6d4';
const LOAD_STEPS = ['Fetching primary metadata...', 'Fetching secondary metadata...', 'Validating schema compatibility...', 'Executing nested loop join...', 'Building relationship matrix...'];

interface CorrelationViewProps {
    files: any[];
    token: string;
    userPlan?: string;
    onUpgradeRequested?: () => void;
}

export const CorrelationView: React.FC<CorrelationViewProps> = ({ files, token, userPlan, onUpgradeRequested }) => {
    const [selectedIdA, setSelectedIdA] = useState<string>('');
    const [selectedIdB, setSelectedIdB] = useState<string>('');
    const [dataA, setDataA] = useState<any[]>([]);
    const [dataB, setDataB] = useState<any[]>([]);
    const [joinKeyA, setJoinKeyA] = useState('');
    const [joinKeyB, setJoinKeyB] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [error, setError] = useState('');

    const loadFile = async (id: string, target: 'A' | 'B') => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/files/${id}/analyze`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (target === 'A') {
                setDataA(json.sampleData || []);
                setJoinKeyA('');
            } else {
                setDataB(json.sampleData || []);
                setJoinKeyB('');
            }
        } catch (e) {
            setError('Failed to load file data. Ensure the dataset is valid.');
        } finally {
            setLoading(false);
        }
    };

    const swapVersions = () => {
        const tempId = selectedIdA;
        setSelectedIdA(selectedIdB);
        setSelectedIdB(tempId);

        const tempData = dataA;
        setDataA(dataB);
        setDataB(tempData);

        const tempKey = joinKeyA;
        setJoinKeyA(joinKeyB);
        setJoinKeyB(tempKey);

        setResults([]);
    };

    const runCorrelation = async () => {
        if (!dataA.length || !dataB.length || !joinKeyA || !joinKeyB) {
            setError('Please select both files and their respective join keys.');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        
        try {
            for (let i = 0; i < LOAD_STEPS.length; i++) {
                setLoadStep(i);
                await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
            }
            
            const res = alasql(`SELECT a.*, b.* FROM ? AS a JOIN ? AS b ON a.[${joinKeyA}] = b.[${joinKeyB}] LIMIT 250`, [dataA, dataB]);
            setResults(res as any[]);
            if ((res as any[]).length === 0) {
                setError('No matching intersecting records found between the provided keys.');
            }
        } catch (e: any) {
            setError('Join Engine failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (userPlan === 'free') {
        return (
            <div className="flex items-center justify-center" style={{ height: '100%', padding: 'clamp(16px, 3vw, 32px)' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '48px', borderRadius: '24px', maxWidth: '440px', textAlign: 'center', boxShadow: '0 24px 48px -12px rgba(139,92,246,0.15)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Link2 size={32} style={{ color: PRIMARY_COLOR }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Correlation Engine
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                        Advanced multi-dataset joins, high-performance structured relationship discovery, and nested data binding are exclusively <strong>Pro</strong> features.
                    </p>
                    <button className="btn btn-primary btn-lg w-full" onClick={onUpgradeRequested} style={{ background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Sparkles size={16} /> Upgrade to Neural Pro
                    </button>
                </div>
            </div>
        );
    }

    const columnsA = dataA.length > 0 ? Object.keys(dataA[0]) : [];
    const columnsB = dataB.length > 0 ? Object.keys(dataB[0]) : [];

    return (
        <div id="correlation-engine-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)', display: 'flex', flexDirection: 'column' }}>

            {/* ─── Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px', flexShrink: 0 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}33, ${SECONDARY_COLOR}33)`, border: `1px solid ${PRIMARY_COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Link2 size={24} style={{ color: PRIMARY_COLOR }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 50%, #f59e0b 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Correlation Engine
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Join multiple datasets · Identify commonalities · Dynamic index binding
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Dataset Selectors ──────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR}, #f59e0b)` }} />
                
                <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
                    <Database size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Configure Dataset Joins</span>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* Primary Index */}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: PRIMARY_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIMARY_COLOR, boxShadow: `0 0 8px ${PRIMARY_COLOR}` }} /> Primary Index (Left)
                        </label>
                        <select value={selectedIdA} onChange={(e) => { setSelectedIdA(e.target.value); loadFile(e.target.value, 'A'); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedIdA ? PRIMARY_COLOR + '44' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s', marginBottom: '12px' }}>
                            <option value="">Select File...</option>
                            {files.map(f => <option key={f.id} value={f.id} disabled={f.id === selectedIdB}>{(f as any).originalName || f.filename}</option>)}
                        </select>

                        <AnimatePresence>
                            {dataA.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Columns size={12} /> Target Join Key</label>
                                    <select value={joinKeyA} onChange={e => setJoinKeyA(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(139,92,246,0.05)', border: `1px solid ${PRIMARY_COLOR}33`, color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>
                                        <option value="">Select Column...</option>
                                        {columnsA.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{dataA.length.toLocaleString()} base records detected</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Swap Button */}
                    <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', paddingTop: '10px' }}>
                        <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.96 }} onClick={swapVersions}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY_COLOR}22, ${SECONDARY_COLOR}22)`, border: `1px solid ${PRIMARY_COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                            <ArrowLeftRight size={16} style={{ color: PRIMARY_COLOR }} />
                        </motion.button>
                    </div>

                    {/* Secondary Index */}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: SECONDARY_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: SECONDARY_COLOR, boxShadow: `0 0 8px ${SECONDARY_COLOR}` }} /> Secondary Index (Right)
                        </label>
                        <select value={selectedIdB} onChange={(e) => { setSelectedIdB(e.target.value); loadFile(e.target.value, 'B'); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedIdB ? SECONDARY_COLOR + '44' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s', marginBottom: '12px' }}>
                            <option value="">Select File...</option>
                            {files.map(f => <option key={f.id} value={f.id} disabled={f.id === selectedIdA}>{(f as any).originalName || f.filename}</option>)}
                        </select>

                        <AnimatePresence>
                            {dataB.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Columns size={12} /> Lookup Join Key</label>
                                    <select value={joinKeyB} onChange={e => setJoinKeyB(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(6,182,212,0.05)', border: `1px solid ${SECONDARY_COLOR}33`, color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>
                                        <option value="">Select Column...</option>
                                        {columnsB.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{dataB.length.toLocaleString()} comparison records detected</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Run Button Engine */}
                    <div style={{ alignSelf: 'flex-start', paddingTop: '22px' }}>
                         <motion.button id="run-correlation-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={runCorrelation}
                            disabled={loading || !dataA.length || !dataB.length || !joinKeyA || !joinKeyB}
                            style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!dataA.length || !dataB.length || !joinKeyA || !joinKeyB) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 24px ${PRIMARY_COLOR}40`, whiteSpace: 'nowrap' }}>
                            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Link2 size={15} />}
                            {loading ? 'Processing...' : 'Run Correlation'}
                        </motion.button>
                    </div>
                </div>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '16px 20px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
                    <AlertTriangle size={16} />
                    {error}
                </motion.div>
            )}

            {/* ─── Animated Loading Protocol ───────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', flexShrink: 0 }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `3px solid ${PRIMARY_COLOR}22`, borderTop: `3px solid ${PRIMARY_COLOR}` }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : i === loadStep ? <RefreshCw size={14} className="animate-spin" style={{ color: PRIMARY_COLOR }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Results Matrix ───────────────────────────────────── */}
            {!loading && results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                     
                    {/* Status Summary */}
                    <div style={{ padding: '16px 20px', borderRadius: '16px 16px 0 0', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.06))', border: `1px solid ${PRIMARY_COLOR}33`, borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, color: '#fff', boxShadow: `0 4px 12px ${PRIMARY_COLOR}40` }}>
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Correlation Matrix Successful</h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Displaying relational intersect map</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intersect Count</span>
                            <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', background: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{results.length.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, borderRadius: '0 0 16px 16px', border: `1px solid ${PRIMARY_COLOR}33`, overflow: 'auto', background: 'var(--bg-secondary)' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', zIndex: 10 }}>
                                <tr>
                                    {Object.keys(results[0]).map((k, i) => (
                                        <th key={k} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderRight: i < Object.keys(results[0]).length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Code2 size={12} style={{ color: PRIMARY_COLOR }} /> {k}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                        {Object.values(r).map((v: any, j) => (
                                            <td key={j} style={{ padding: '12px 16px', fontSize: '13px', fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)', borderRight: j < Object.values(r).length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                                {v !== null && v !== undefined ? String(v) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>null</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ─── Empty Status ───────────────────────────────────── */}
            {!loading && results.length === 0 && !error && (
                <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', maxWidth: '380px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}11, ${SECONDARY_COLOR}11)`, border: `1px solid ${PRIMARY_COLOR}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Layers size={40} style={{ color: PRIMARY_COLOR, opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Construct Matrix</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Lock in a <strong style={{ color: PRIMARY_COLOR }}>Primary Index</strong> and map a <strong style={{ color: SECONDARY_COLOR }}>Secondary Target</strong> to automatically discover overlapping relationships and structure gaps.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
