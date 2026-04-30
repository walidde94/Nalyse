import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
    ShieldAlert, Activity, Target, Brain, TrendingUp, TrendingDown, Zap,
    AlertTriangle, RefreshCw, CheckCircle2, Database, Filter, ArrowUpRight,
    ArrowDownRight, Minus, ChevronRight, Layers, BarChart3, Shield,
    Sparkles, Eye, Bell, Lightbulb, ArrowRight, X, Clock, Cpu
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import {
    runAnomalyDetection, fmt, pct, SEVERITY_COLORS, TYPE_COLORS, TYPE_LABELS,
    type DetectionResult, type DetectionConfig, type AnomalyPoint, type KpiSummary
} from './anomalyHelpers';
import { RCAPanel } from './RCAPanel';

/* ─── Mini Sparkline ──────────────────────────────────────── */
const Spark = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`as-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient></defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#as-${color.replace('#', '')})`} />
        </svg>
    );
};

/* ─── Score Ring ───────────────────────────────────────────── */
const ScoreRing = ({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (value / 100) * circ;
    const color = value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke='var(--border-default)' strokeWidth={stroke} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }} strokeLinecap="round" />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color}
                fontSize="18" fontWeight="800" fontFamily="var(--font-mono)" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {value}
            </text>
        </svg>
    );
};

/* ─── Custom Tooltip ──────────────────────────────────────── */
const AnomalyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-default)', padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)', minWidth: '180px', color: 'var(--text-primary)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #34d399)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', color: p.color, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── Loading Steps ───────────────────────────────────────── */
const LOAD_STEPS = ['Loading dataset…', 'Preprocessing data…', 'Running Z-Score analysis…', 'Running IQR detection…', 'Classifying anomalies…', 'Generating insights…'];

/* ─── Severity Badge ──────────────────────────────────────── */
const SeverityBadge = ({ severity }: { severity: string }) => (
    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: SEVERITY_COLORS[severity], background: `${SEVERITY_COLORS[severity]}15`, border: `1px solid ${SEVERITY_COLORS[severity]}30` }}>
        {severity}
    </span>
);

/* ═══════════════════════════════════════════════════════════ */
interface Props { files: { id: string; filename: string; size: number; createdAt: string; originalName?: string }[]; token: string; }

export const AnomalyDetectionView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const { t } = useLanguage();
    const [selectedFileId, setSelectedFileId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [sensitivity, setSensitivity] = useState(3);
    const [method, setMethod] = useState<'auto' | 'zscore' | 'iqr'>('auto');
    const [activeSection, setActiveSection] = useState<'overview' | 'timeline' | 'feed' | 'recommendations'>('overview');
    const [selectedMetric, setSelectedMetric] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [rcaAnomaly, setRcaAnomaly] = useState<AnomalyPoint | null>(null);

    const runDetection = useCallback(async () => {
        if (!selectedFileId) { addToast('Select a dataset first', 'error'); return; }
        setLoading(true); setLoadStep(0); setResult(null);
        try {
            setLoadStep(0);
            const res = await fetch(`${API_URL}/api/files/${selectedFileId}/analyze`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                if (errorBody.error === 'FILE_NOT_FOUND' || res.status === 422) {
                    throw new Error(errorBody.message || 'Dataset file is missing from the server. Please re-upload the file from the Dashboard.');
                }
                throw new Error(errorBody.error || 'Failed to load dataset');
            }
            setLoadStep(1);
            const analysis = await res.json();
            const data = analysis.sampleData || [];
            if (!data.length) throw new Error('No data found in dataset. The file may be empty or in an unsupported format. Try re-uploading from the Dashboard.');
            setLoadStep(2);
            await new Promise(r => setTimeout(r, 400));
            setLoadStep(3);
            await new Promise(r => setTimeout(r, 400));
            setLoadStep(4);
            const config: DetectionConfig = { method, sensitivity, windowSize: Math.max(10, Math.floor(data.length / 20)) };
            const detectionResult = runAnomalyDetection(data, config);
            setLoadStep(5);
            await new Promise(r => setTimeout(r, 300));
            setResult(detectionResult);
            if (detectionResult.kpis.length) setSelectedMetric(detectionResult.kpis[0].metric);
            addToast(`Detection complete: ${detectionResult.anomalies.length} anomalies found`, 'success');
        } catch (e: any) { addToast(e.message || 'Detection failed', 'error'); }
        finally { setLoading(false); }
    }, [selectedFileId, token, method, sensitivity, addToast]);

    const filteredAnomalies = useMemo(() => {
        if (!result) return [];
        let list = result.anomalies;
        if (selectedMetric) list = list.filter(a => a.metric === selectedMetric);
        if (severityFilter !== 'all') list = list.filter(a => a.severity === severityFilter);
        return list;
    }, [result, selectedMetric, severityFilter]);

    const timelineData = useMemo(() => {
        if (!result || !selectedMetric) return [];
        return result.timeSeriesData.map(p => ({
            name: p.timestamp.split('T')[1]?.slice(0, 8) || p.timestamp.slice(-8),
            value: p.values[selectedMetric] || 0,
            isAnomaly: p.isAnomaly && result.anomalies.some(a => a.index === p.index && a.metric === selectedMetric),
        })).slice(-200); // Last 200 points for performance
    }, [result, selectedMetric]);

    const radarData = useMemo(() =>
        result?.kpis.slice(0, 8).map(k => ({
            metric: k.metric.length > 14 ? k.metric.slice(0, 14) + '…' : k.metric,
            health: k.healthScore, anomalies: Math.min(100, k.anomalyCount * 5)
        })) || []
        , [result]);

    const selectedFile = files.find(f => f.id === selectedFileId);

    const mainContent = (
        <div id="anomaly-detection-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>

            {/* ─── Header ─────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {t('anomaly.neuralTitle')}
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {t('anomaly.neuralSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Control Panel ───────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #34d399)' }} />
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Cpu size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('anomaly.config')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    {/* File Select */}
                    <div style={{ flex: 2, minWidth: '220px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} /> {t('anomaly.dataset')}
                        </label>
                        <select value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFileId ? '#ef444444' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="">{t('lens.selectDataset')}</option>
                            {files.map(f => <option key={f.id} value={f.id}>{f.originalName || f.filename}</option>)}
                        </select>
                    </div>

                    {/* Method */}
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} /> {t('anomaly.method')}
                        </label>
                        <select value={method} onChange={e => setMethod(e.target.value as any)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="auto">{t('anomaly.autoEnsemble')}</option>
                            <option value="zscore">Z-Score</option>
                            <option value="iqr">IQR</option>
                        </select>
                    </div>

                    {/* Sensitivity */}
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} /> {t('anomaly.sensitivity')}
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} onClick={() => setSensitivity(s)}
                                    style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: sensitivity === s ? '1px solid #34d399' : '1px solid var(--border-default)', background: sensitivity === s ? 'rgba(52,211,153,0.12)' : 'var(--bg-main)', color: sensitivity === s ? '#34d399' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Run Button */}
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={runDetection}
                        disabled={loading || !selectedFileId}
                        style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: !selectedFileId ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(239,68,68,0.25)', whiteSpace: 'nowrap' as any, flexShrink: 0 }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
                        {loading ? t('common.detecting') || 'Detecting…' : t('anomaly.run')}
                    </motion.button>
                </div>
            </div>

            {/* ─── Loading ─────────────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid rgba(239,68,68,0.15)', borderTop: '3px solid #ef4444' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : i === loadStep ? <RefreshCw size={14} className="animate-spin" style={{ color: '#ef4444' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ RESULTS ═══════════════════════════════════════ */}
            {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                    {/* ─── Executive Summary ──────────────────────── */}
                    <div style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.06))', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <ScoreRing value={result.overallHealthScore} />
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                                <Brain size={16} style={{ color: '#ef4444' }} />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Detection Summary</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                Analyzed <strong>{result.totalDataPoints.toLocaleString()}</strong> data points across <strong>{result.kpis.length}</strong> KPIs.
                                Found <strong style={{ color: '#ef4444' }}>{result.anomalies.length}</strong> anomalies.
                                {result.anomalies.filter(a => a.severity === 'critical').length > 0 && ` ${result.anomalies.filter(a => a.severity === 'critical').length} critical alerts require immediate attention.`}
                                {' '}Overall system health: <strong style={{ color: result.overallHealthScore >= 80 ? '#34d399' : result.overallHealthScore >= 50 ? '#fbbf24' : '#f87171' }}>{result.overallHealthScore}%</strong>.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                            {[
                                { label: 'Critical', val: result.anomalies.filter(a => a.severity === 'critical').length, color: SEVERITY_COLORS.critical },
                                { label: 'High', val: result.anomalies.filter(a => a.severity === 'high').length, color: SEVERITY_COLORS.high },
                                { label: 'Medium', val: result.anomalies.filter(a => a.severity === 'medium').length, color: SEVERITY_COLORS.medium },
                                { label: 'Low', val: result.anomalies.filter(a => a.severity === 'low').length, color: SEVERITY_COLORS.low },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section Tabs ────────────────────────────── */}
                    <div className="flex items-center gap-2" style={{ marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {([
                            { id: 'overview' as const, label: 'KPI Overview', icon: <Target size={14} />, count: result.kpis.length },
                            { id: 'timeline' as const, label: 'Time Series', icon: <Activity size={14} /> },
                            { id: 'feed' as const, label: 'Anomaly Feed', icon: <Bell size={14} />, count: result.anomalies.length },
                            { id: 'recommendations' as const, label: 'Recommendations', icon: <Lightbulb size={14} />, count: result.recommendations.length },
                        ]).map(tab => (
                            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: activeSection === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: activeSection === tab.id ? 'var(--primary-subtle)' : 'var(--bg-secondary)', color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                                {tab.icon} {tab.label}
                                {tab.count !== undefined && <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* ─── KPI Overview ────────────────────────────── */}
                    {activeSection === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                                {result.kpis.map((kpi, i) => (
                                    <motion.div key={kpi.metric} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                                        onClick={() => { setSelectedMetric(kpi.metric); setActiveSection('timeline'); }}
                                        className="hover-glow" style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${kpi.healthScore >= 80 ? '#34d399' : kpi.healthScore >= 50 ? '#fbbf24' : '#ef4444'}, transparent)` }} />
                                        <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.metric}</span>
                                            <div className="flex items-center gap-2">
                                                <Spark data={kpi.sparkline} color={kpi.trend === 'up' ? '#34d399' : kpi.trend === 'down' ? '#f87171' : '#94a3b8'} />
                                                {kpi.trend === 'up' ? <ArrowUpRight size={15} style={{ color: '#34d399' }} /> : kpi.trend === 'down' ? <ArrowDownRight size={15} style={{ color: '#f87171' }} /> : <Minus size={15} style={{ color: '#94a3b8' }} />}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                            <div><div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>MEAN</div><div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{fmt(kpi.mean)}</div></div>
                                            <div><div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>STD DEV</div><div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{fmt(kpi.std)}</div></div>
                                            <div><div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>RANGE</div><div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmt(kpi.min)} – {fmt(kpi.max)}</div></div>
                                        </div>
                                        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-surface-hover)', marginBottom: '8px', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.healthScore}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                                                style={{ height: '100%', borderRadius: '2px', background: kpi.healthScore >= 80 ? '#34d399' : kpi.healthScore >= 50 ? '#fbbf24' : '#ef4444' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Health: <strong style={{ color: kpi.healthScore >= 80 ? '#34d399' : kpi.healthScore >= 50 ? '#fbbf24' : '#ef4444' }}>{kpi.healthScore}%</strong></span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: kpi.anomalyCount > 0 ? '#ef4444' : '#34d399', fontFamily: 'var(--font-mono)' }}>{kpi.anomalyCount} anomalies</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Radar Chart */}
                            {radarData.length > 2 && (
                                <div style={{ marginTop: '24px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} style={{ color: '#ef4444' }} /> Multi-Dimensional Health Radar</h3>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <RadarChart data={radarData}><PolarGrid stroke='var(--border-default)' /><PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} /><PolarRadiusAxis tick={false} axisLine={false} />
                                            <Radar name="Health Score" dataKey="health" stroke="#34d399" fill="#34d399" fillOpacity={0.15} strokeWidth={2} />
                                            <Radar name="Anomaly Density" dataKey="anomalies" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                                            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} /><Tooltip content={<AnomalyTooltip />} /></RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── Timeline ────────────────────────────────── */}
                    {activeSection === 'timeline' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: '14px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Metric:</span>
                                {result.kpis.map(k => (
                                    <button key={k.metric} onClick={() => setSelectedMetric(k.metric)}
                                        style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: selectedMetric === k.metric ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: selectedMetric === k.metric ? 'var(--primary-subtle)' : 'var(--bg-secondary)', color: selectedMetric === k.metric ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                        {k.metric} {k.anomalyCount > 0 && <span style={{ color: '#ef4444', marginLeft: '4px' }}>({k.anomalyCount})</span>}
                                    </button>
                                ))}
                            </div>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} style={{ color: '#f59e0b' }} /> {selectedMetric} · Time Series</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={timelineData} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                        <defs>
                                            <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                        <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 9 }} angle={-35} textAnchor="end" height={45} axisLine={false} tickLine={false} interval={Math.floor(timelineData.length / 15)} />
                                        <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<AnomalyTooltip />} />
                                        <Area type="monotone" dataKey="value" name={selectedMetric} stroke="#818cf8" fill="url(#anomalyGrad)" strokeWidth={2} dot={(props: any) => {
                                            if (!props.payload?.isAnomaly) return <circle key={props.key} cx={0} cy={0} r={0} fill="none" />;
                                            return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />;
                                        }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Anomaly Feed ─────────────────────────────── */}
                    {activeSection === 'feed' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: '14px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Filter:</span>
                                {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                                    <button key={sev} onClick={() => setSeverityFilter(sev)}
                                        style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: severityFilter === sev ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: severityFilter === sev ? 'var(--primary-subtle)' : 'var(--bg-secondary)', color: severityFilter === sev ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                        {sev} {sev !== 'all' && <span style={{ color: SEVERITY_COLORS[sev] }}>({result.anomalies.filter(a => a.severity === sev).length})</span>}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                                {filteredAnomalies.slice(0, 50).map((anomaly, i) => (
                                    <motion.div key={`${anomaly.index}-${anomaly.metric}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: `1px solid ${SEVERITY_COLORS[anomaly.severity]}20`, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: SEVERITY_COLORS[anomaly.severity] }} />
                                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                                            <div className="flex items-center gap-2">
                                                <SeverityBadge severity={anomaly.severity} />
                                                <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, color: TYPE_COLORS[anomaly.type], background: `${TYPE_COLORS[anomaly.type]}15`, border: `1px solid ${TYPE_COLORS[anomaly.type]}30` }}>{TYPE_LABELS[anomaly.type]}</span>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}><Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />{anomaly.timestamp}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>{anomaly.explanation}</p>
                                        <div className="flex items-center gap-4">
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Confidence: <strong style={{ color: anomaly.confidence > 80 ? '#34d399' : '#fbbf24' }}>{anomaly.confidence.toFixed(0)}%</strong></span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Z-Score: <strong style={{ fontFamily: 'var(--font-mono)' }}>{anomaly.zScore.toFixed(2)}</strong></span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setRcaAnomaly(anomaly); }}
                                                style={{
                                                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '4px 10px', borderRadius: 7, fontSize: '10px', fontWeight: 700,
                                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                                    color: '#818cf8', cursor: 'pointer', transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                                            >
                                                <Brain size={11} /> Explain Why
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {filteredAnomalies.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No anomalies match filter</div>}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Recommendations ──────────────────────────── */}
                    {activeSection === 'recommendations' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {result.recommendations.map((rec, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)', border: `1px solid ${SEVERITY_COLORS[rec.severity]}20`, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${SEVERITY_COLORS[rec.severity]}, transparent)` }} />
                                        <div className="flex items-center gap-3" style={{ marginBottom: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${SEVERITY_COLORS[rec.severity]}15`, border: `1px solid ${SEVERITY_COLORS[rec.severity]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {rec.actionType === 'escalate' ? <AlertTriangle size={16} style={{ color: SEVERITY_COLORS[rec.severity] }} /> : rec.actionType === 'investigate' ? <Eye size={16} style={{ color: SEVERITY_COLORS[rec.severity] }} /> : rec.actionType === 'automate' ? <Zap size={16} style={{ color: SEVERITY_COLORS[rec.severity] }} /> : <Activity size={16} style={{ color: SEVERITY_COLORS[rec.severity] }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="flex items-center gap-2"><span style={{ fontSize: '14px', fontWeight: 700 }}>{rec.title}</span><SeverityBadge severity={rec.severity} /></div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rec.actionType} · {rec.metric}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '44px' }}>{rec.description}</p>
                                    </motion.div>
                                ))}
                                {result.recommendations.length === 0 && (
                                    <div style={{ padding: '60px', textAlign: 'center' }}>
                                        <Shield size={40} style={{ color: '#34d399', margin: '0 auto 12px', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>All Clear</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No actionable recommendations at this time.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* ─── Empty State ─────────────────────────────────── */}
            {!loading && !result && (
                <div style={{ padding: '100px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.08))', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <ShieldAlert size={40} style={{ color: '#ef4444', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{t('anomaly.engineTitle')}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {t('anomaly.engineDesc')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );


    return (
        <>
            {mainContent}

            {/* RCA Slide-in Panel */}
            <AnimatePresence>
                {rcaAnomaly && result && (
                    <RCAPanel
                        anomaly={rcaAnomaly}
                        kpiSummary={result.kpis.find(k => k.metric === rcaAnomaly.metric)}
                        allKpis={result.kpis}
                        surroundingData={result.timeSeriesData
                            .filter(p => Math.abs(p.index - rcaAnomaly.index) <= 10)
                            .map(p => ({ ...p.values, _index: p.index, _timestamp: p.timestamp }))
                        }
                        datasetName={selectedFile?.filename || selectedFile?.originalName}
                        onClose={() => setRcaAnomaly(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default AnomalyDetectionView;
