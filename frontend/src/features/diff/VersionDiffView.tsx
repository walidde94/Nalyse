import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
    LineChart, Line, PieChart, Pie
} from 'recharts';
import {
    GitCompareArrows, ArrowUpRight, ArrowDownRight, Minus, BarChart3, Activity, Layers,
    ArrowRight, CheckCircle2, XCircle, Filter, RefreshCw, Database, Zap, Target,
    Maximize2, ChevronRight, ArrowLeftRight, Columns, Table2, Brain, TrendingUp, TrendingDown,
    Shield, AlertTriangle, Download, Sparkles, Hash, Type, Calendar, Flame, Crown, Eye,
    BarChart2, Waves
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_URL } from '../../config';
import type { DiffMetric, ChartDiff, ColumnDiff, DiffSummary } from './diffHelpers';
import {
    fmt, pct, BASELINE_COLOR, COMPARISON_COLOR, NEGATIVE_COLOR, NEUTRAL_COLOR,
    buildDiffMetrics, buildChartDiffs, buildColumnDiffs, buildSummary
} from './diffHelpers';

// ─── Mini Sparkline SVG ──────────────────────────────────────
const Sparkline = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient></defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#sg-${color.replace('#', '')})`} />
        </svg>
    );
};

// ─── Custom Tooltip ──────────────────────────────────────────
const DiffTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-default)', padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)', minWidth: '200px', color: 'var(--text-primary)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
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

// ─── Animated Progress Ring ──────────────────────────────────
const ScoreRing = ({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color = value >= 70 ? '#34d399' : value >= 40 ? '#fbbf24' : '#f87171';
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

// ─── Loading Steps ───────────────────────────────────────────
const LOAD_STEPS = ['Fetching baseline…', 'Fetching comparison…', 'Computing deltas…', 'Building charts…', 'Generating insights…'];

// ═══════════════════════════════════════════════════════════════
interface Props { files: { id: string; filename: string; size: number; createdAt: string }[]; token: string; initialBaselineId?: string; initialComparisonId?: string; }

export const VersionDiffView = ({ files, token, initialBaselineId, initialComparisonId }: Props) => {
    const { addToast } = useToast();
    const { t } = useLanguage();
    const [baselineId, setBaselineId] = useState(initialBaselineId || '');
    const [comparisonId, setComparisonId] = useState(initialComparisonId || '');
    const hasAutoRun = useRef(false);
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [baselineAnalysis, setBaselineAnalysis] = useState<any>(null);
    const [comparisonAnalysis, setComparisonAnalysis] = useState<any>(null);
    const [diffMetrics, setDiffMetrics] = useState<DiffMetric[]>([]);
    const [chartDiffs, setChartDiffs] = useState<ChartDiff[]>([]);
    const [columnDiffs, setColumnDiffs] = useState<ColumnDiff[]>([]);
    const [summary, setSummary] = useState<DiffSummary | null>(null);
    const [activeChartView, setActiveChartView] = useState<'overlay' | 'side-by-side' | 'delta'>('overlay');
    const [expandedChart, setExpandedChart] = useState<number | null>(null);
    const [showOnlyChanged, setShowOnlyChanged] = useState(false);
    const [activeSection, setActiveSection] = useState<'kpi' | 'charts' | 'schema' | 'radar' | 'waterfall' | 'distributions' | 'movers'>('kpi');

    const fetchAnalysis = useCallback(async (fileId: string) => {
        const res = await fetch(`${API_URL}/api/files/${fileId}/analyze`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            if (errorBody.error === 'FILE_NOT_FOUND' || res.status === 422) {
                throw new Error(errorBody.message || 'Dataset file is missing. Please re-upload from the Dashboard.');
            }
            throw new Error(errorBody.error || 'Analysis failed');
        }
        return res.json();
    }, [token]);

    const swapVersions = () => { const t = baselineId; setBaselineId(comparisonId); setComparisonId(t); };

    const runComparison = useCallback(async () => {
        if (!baselineId || !comparisonId) { addToast('Select both versions', 'error'); return; }
        if (baselineId === comparisonId) { addToast('Must be different files', 'error'); return; }
        setLoading(true); setLoadStep(0);
        try {
            setLoadStep(0);
            const bAnalysis = await fetchAnalysis(baselineId);
            setLoadStep(1);
            const cAnalysis = await fetchAnalysis(comparisonId);
            setLoadStep(2);
            setBaselineAnalysis(bAnalysis); setComparisonAnalysis(cAnalysis);
            const bData = bAnalysis.sampleData || []; const cData = cAnalysis.sampleData || [];
            const metrics = buildDiffMetrics(bData, cData);
            setDiffMetrics(metrics);
            setLoadStep(3);
            setChartDiffs(buildChartDiffs(bAnalysis, cAnalysis));
            setColumnDiffs(buildColumnDiffs(bData, cData));
            setLoadStep(4);
            setSummary(buildSummary(metrics, bData, cData));
            addToast('Version comparison complete', 'success');
        } catch (e: any) { addToast(e.message || 'Comparison failed', 'error'); }
        finally { setLoading(false); }
    }, [baselineId, comparisonId, fetchAnalysis, addToast]);

    // Auto-run comparison when opened from Dashboard with pre-selected files
    useEffect(() => {
        if (initialBaselineId && initialComparisonId && !hasAutoRun.current && files.length > 0) {
            hasAutoRun.current = true;
            runComparison();
        }
    }, [initialBaselineId, initialComparisonId, files]);

    const visibleCharts = useMemo(() => showOnlyChanged ? chartDiffs.filter(c => c.mergedData.some(d => Math.abs(d.deltaPct) > 1)) : chartDiffs, [chartDiffs, showOnlyChanged]);

    // Radar data from metrics
    const radarData = useMemo(() => diffMetrics.slice(0, 8).map(m => ({
        metric: m.label.length > 12 ? m.label.slice(0, 12) + '…' : m.label,
        baseline: Math.abs(m.baselineValue), comparison: Math.abs(m.comparisonValue)
    })), [diffMetrics]);

    const baseFile = files.find(f => f.id === baselineId);
    const compFile = files.find(f => f.id === comparisonId);
    const hasResults = !loading && baselineAnalysis && comparisonAnalysis;

    const DirIcon = ({ dir }: { dir: string }) =>
        dir === 'up' ? <ArrowUpRight size={15} style={{ color: 'var(--success)' }} /> : dir === 'down' ? <ArrowDownRight size={15} style={{ color: 'var(--danger)' }} /> : <Minus size={15} style={{ color: NEUTRAL_COLOR }} />;

    const colIcon = (type: string) => type === 'numeric' ? <Hash size={12} /> : type === 'string' ? <Type size={12} /> : <Calendar size={12} />;

    // ───────────────────── RENDER ─────────────────────────────
    return (
        <div id="version-diff-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>

            {/* ─── Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(52,211,153,0.2))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitCompareArrows size={24} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #34d399 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {t('diff.title')}
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {t('diff.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Version Selectors ──────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24)' }} />
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Database size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('diff.baseline')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Baseline */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: BASELINE_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: BASELINE_COLOR, boxShadow: `0 0 8px ${BASELINE_COLOR}` }} /> {t('diff.baseline')}
                        </label>
                        <select id="diff-baseline-select" value={baselineId} onChange={e => setBaselineId(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${baselineId ? BASELINE_COLOR + '44' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s' }}>
                            <option value="">{t('diff.baselinePlaceholder')}</option>
                            {files.map(f => <option key={f.id} value={f.id} disabled={f.id === comparisonId}>{(f as any).originalName || f.filename} — {new Date(f.createdAt).toLocaleDateString()}</option>)}
                        </select>
                    </div>

                    {/* Swap Button */}
                    <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.96 }} onClick={swapVersions}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(52,211,153,0.12))', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '2px', flexShrink: 0 }}>
                        <ArrowLeftRight size={16} style={{ color: '#818cf8' }} />
                    </motion.button>

                    {/* Comparison */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: COMPARISON_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COMPARISON_COLOR, boxShadow: `0 0 8px ${COMPARISON_COLOR}` }} /> {t('diff.comparison')}
                        </label>
                        <select id="diff-comparison-select" value={comparisonId} onChange={e => setComparisonId(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${comparisonId ? COMPARISON_COLOR + '44' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s' }}>
                            <option value="">{t('diff.comparisonPlaceholder')}</option>
                            {files.map(f => <option key={f.id} value={f.id} disabled={f.id === baselineId}>{(f as any).originalName || f.filename} — {new Date(f.createdAt).toLocaleDateString()}</option>)}
                        </select>
                    </div>

                    {/* Run Button */}
                    <motion.button id="diff-run-compare-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={runComparison}
                        disabled={loading || !baselineId || !comparisonId}
                        style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #818cf8, #34d399)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!baselineId || !comparisonId) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(129,140,248,0.25)', whiteSpace: 'nowrap' as any, flexShrink: 0 }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <GitCompareArrows size={15} />}
                        {loading ? t('common.analyzing') || 'Analyzing…' : t('diff.run')}
                    </motion.button>
                </div>
            </div>

            {/* ─── Animated Loading ───────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid rgba(129,140,248,0.15)', borderTop: '3px solid #818cf8' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : i === loadStep ? <RefreshCw size={14} className="animate-spin" style={{ color: '#818cf8' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ RESULTS ══════════════════════════════════════════ */}
            {hasResults && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                    {/* ═══ REVOLUTIONARY EXECUTIVE COMMAND CENTER ═══════ */}
                    {summary && (
                        <div style={{ borderRadius: '20px', marginBottom: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden', position: 'relative' }}>
                            {/* Animated top gradient bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24, #f87171, #818cf8)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
                            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                                @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px rgba(129,140,248,0.2); } 50% { box-shadow: 0 0 20px rgba(129,140,248,0.4); } }
                                @keyframes countUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
                            `}</style>

                            {/* Row 1: Score + Narrative + Counters */}
                            <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', animation: 'pulseGlow 3s ease-in-out infinite', borderRadius: '50%' }}>
                                    <ScoreRing value={summary.overallScore} size={90} stroke={7} />
                                </div>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                                        <Brain size={16} style={{ color: '#818cf8' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Neural Diff Intelligence</span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: summary.riskLevel === 'critical' ? 'rgba(248,113,113,0.15)' : summary.riskLevel === 'high' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)', color: summary.riskLevel === 'critical' ? '#f87171' : summary.riskLevel === 'high' ? '#fbbf24' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            {summary.riskLevel} risk
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{summary.narrative}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                                    {[
                                        { label: 'Improved', val: summary.improved, icon: <TrendingUp size={14} />, color: '#34d399' },
                                        { label: 'Declined', val: summary.declined, icon: <TrendingDown size={14} />, color: '#f87171' },
                                        { label: 'Stable', val: summary.unchanged, icon: <Shield size={14} />, color: NEUTRAL_COLOR }
                                    ].map((s, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring' }} style={{ textAlign: 'center', padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', minWidth: '70px' }}>
                                            <div style={{ color: s.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                            <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color, animation: 'countUp 0.6s ease-out' }}>{s.val}</div>
                                            <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Row 2: Live Gauges Strip */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--border-subtle)' }}>
                                {[
                                    { label: 'Volatility', value: Math.min(100, Math.round(summary.volatilityIndex)), unit: '%', icon: <Flame size={13} />, color: summary.volatilityIndex > 30 ? '#f87171' : summary.volatilityIndex > 15 ? '#fbbf24' : '#34d399' },
                                    { label: 'Growth Rate', value: summary.dataGrowthRate, unit: '%', icon: <TrendingUp size={13} />, color: summary.dataGrowthRate >= 0 ? '#34d399' : '#f87171', fmt: true },
                                    { label: 'Schema Match', value: summary.schemaStability, unit: '%', icon: <Columns size={13} />, color: summary.schemaStability >= 90 ? '#34d399' : summary.schemaStability >= 70 ? '#fbbf24' : '#f87171' },
                                    { label: 'Drift Signals', value: summary.distributionShifts.length, unit: '', icon: <Waves size={13} />, color: summary.distributionShifts.length > 3 ? '#f87171' : summary.distributionShifts.length > 1 ? '#fbbf24' : '#34d399' }
                                ].map((g, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                                        style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ color: g.color, opacity: 0.8 }}>{g.icon}</div>
                                        <div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: g.color }}>
                                                {g.fmt ? pct(g.value) : `${g.value}${g.unit}`}
                                            </div>
                                            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.label}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Section Tabs ───────────────────────────────── */}
                    {/* ─── Enhanced Section Navigation ───────────────── */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                        {([
                            { id: 'kpi' as const, label: 'KPI Deltas', icon: <Target size={13} />, count: diffMetrics.length },
                            { id: 'waterfall' as const, label: 'Delta Waterfall', icon: <BarChart2 size={13} /> },
                            { id: 'movers' as const, label: 'Top Movers', icon: <Crown size={13} />, count: summary?.topMovers.length },
                            { id: 'charts' as const, label: 'Chart Overlays', icon: <BarChart3 size={13} />, count: chartDiffs.length },
                            { id: 'distributions' as const, label: 'Distribution Shifts', icon: <Waves size={13} />, count: summary?.distributionShifts.length },
                            { id: 'schema' as const, label: 'Schema Diff', icon: <Columns size={13} />, count: columnDiffs.length },
                            { id: 'radar' as const, label: 'Radar Analysis', icon: <Activity size={13} /> }
                        ]).map(tab => (
                            <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveSection(tab.id)}
                                style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: activeSection === tab.id ? 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(52,211,153,0.2))' : 'transparent', color: activeSection === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.25s', boxShadow: activeSection === tab.id ? '0 2px 8px rgba(129,140,248,0.15)' : 'none' }}>
                                {tab.icon} {tab.label}
                                {tab.count !== undefined && tab.count > 0 && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '6px', background: activeSection === tab.id ? 'rgba(129,140,248,0.2)' : 'var(--bg-main)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{tab.count}</span>}
                            </motion.button>
                        ))}
                    </div>

                    {/* ─── KPI Section ────────────────────────────────── */}
                    {activeSection === 'kpi' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                                {diffMetrics.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                                        className="hover-glow" style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${m.direction === 'up' ? 'var(--success)' : m.direction === 'down' ? 'var(--danger)' : NEUTRAL_COLOR}, transparent)` }} />
                                        <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</span>
                                            <div className="flex items-center gap-2">
                                                <Sparkline data={m.sparkline} color={m.direction === 'up' ? '#34d399' : m.direction === 'down' ? '#f87171' : '#94a3b8'} />
                                                <DirIcon dir={m.direction} />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '9px', fontWeight: 800, color: BASELINE_COLOR, letterSpacing: '0.08em' }}>BASELINE</div>
                                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{fmt(m.baselineValue)}</div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '9px', fontWeight: 800, color: COMPARISON_COLOR, letterSpacing: '0.08em' }}>COMPARE</div>
                                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{fmt(m.comparisonValue)}</div>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-surface-hover)', marginBottom: '8px', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.abs(m.changePercent))}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                                style={{ height: '100%', borderRadius: '2px', background: m.direction === 'up' ? 'var(--success)' : m.direction === 'down' ? 'var(--danger)' : NEUTRAL_COLOR }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="badge badge-sm" style={{ fontSize: '9px', borderColor: m.significance === 'high' ? 'var(--danger)' : m.significance === 'medium' ? 'var(--warning)' : 'var(--success)', color: m.significance === 'high' ? 'var(--danger)' : m.significance === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                                                {m.significance}
                                            </span>
                                            <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: m.direction === 'up' ? 'var(--success)' : m.direction === 'down' ? 'var(--danger)' : NEUTRAL_COLOR }}>
                                                {m.change >= 0 ? '+' : ''}{fmt(m.change)} ({pct(m.changePercent)})
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Charts Section ─────────────────────────────── */}
                    {activeSection === 'charts' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                <div className="flex items-center gap-2">
                                    {['overlay', 'side-by-side', 'delta'].map(v => (
                                        <button key={v} onClick={() => setActiveChartView(v as any)} className={`btn btn-sm ${activeChartView === v ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                            {v === 'overlay' ? <Layers size={12} /> : v === 'delta' ? <Activity size={12} /> : <BarChart3 size={12} />} {v.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setShowOnlyChanged(!showOnlyChanged)} className={`btn btn-sm ${showOnlyChanged ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '11px' }}>
                                    <Filter size={12} /> {showOnlyChanged ? 'Changed Only' : 'Show All'}
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: expandedChart !== null ? '1fr' : 'repeat(auto-fill, minmax(480px, 1fr))', gap: '14px' }}>
                                {visibleCharts.map((chart, idx) => {
                                    if (expandedChart !== null && expandedChart !== idx) return null;
                                    const maxDelta = chart.mergedData.length > 0 ? chart.mergedData.reduce((max: any, d: any) => Math.abs(d.deltaPct) > Math.abs(max.deltaPct) ? d : max, chart.mergedData[0]) : null;
                                    return (
                                        <motion.div key={idx} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                            style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                                            <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700 }}>{chart.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="badge badge-sm">{chart.chartType}</span>
                                                    <button onClick={() => setExpandedChart(expandedChart === idx ? null : idx)} className="btn btn-icon btn-ghost btn-sm"><Maximize2 size={13} /></button>
                                                </div>
                                            </div>
                                            <div style={{ padding: '12px', height: expandedChart === idx ? '480px' : '300px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {activeChartView === 'delta' ? (
                                                        <BarChart data={chart.mergedData} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                                            <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} angle={-35} textAnchor="end" height={45} axisLine={false} tickLine={false} />
                                                            <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                            <Tooltip content={<DiffTooltip />} />
                                                            <Bar dataKey="delta" name="Delta (B−A)" radius={[4, 4, 0, 0]}>
                                                                {chart.mergedData.map((d: any, i: number) => <Cell key={i} fill={d.delta >= 0 ? COMPARISON_COLOR : NEGATIVE_COLOR} fillOpacity={0.8} />)}
                                                            </Bar>
                                                        </BarChart>
                                                    ) : (
                                                        <BarChart data={chart.mergedData} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                                            <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} angle={-35} textAnchor="end" height={45} axisLine={false} tickLine={false} />
                                                            <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                                                            <Tooltip content={<DiffTooltip />} /><Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                                            <Bar dataKey="baseline" fill={BASELINE_COLOR} fillOpacity={activeChartView === 'side-by-side' ? 0.5 : 0.7} radius={[4, 4, 0, 0]} name="Baseline (A)" />
                                                            <Bar dataKey="comparison" fill={COMPARISON_COLOR} fillOpacity={activeChartView === 'side-by-side' ? 0.5 : 0.7} radius={[4, 4, 0, 0]} name="Comparison (B)" />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                            {maxDelta && (
                                                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Biggest shift: <strong style={{ color: 'var(--text-primary)' }}>{maxDelta.name}</strong></span>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: maxDelta.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{pct(maxDelta.deltaPct)}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Schema Diff ────────────────────────────────── */}
                    {activeSection === 'schema' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead><tr>
                                        <th>Column</th><th>Status</th><th style={{ color: BASELINE_COLOR }}>Type (A)</th><th style={{ color: COMPARISON_COLOR }}>Type (B)</th>
                                        <th style={{ color: BASELINE_COLOR }}>Distinct (A)</th><th style={{ color: COMPARISON_COLOR }}>Distinct (B)</th>
                                        <th style={{ color: BASELINE_COLOR }}>Nulls (A)</th><th style={{ color: COMPARISON_COLOR }}>Nulls (B)</th>
                                    </tr></thead>
                                    <tbody>
                                        {columnDiffs.map((col, i) => (
                                            <motion.tr key={col.column} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                style={{ background: col.status === 'added' ? 'rgba(52,211,153,0.05)' : col.status === 'removed' ? 'rgba(248,113,113,0.05)' : col.status === 'modified' ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                                                <td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {colIcon(col.comparisonType || col.baselineType)} {col.column}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-sm badge-${col.status === 'unchanged' ? 'info' : col.status === 'added' ? 'success' : col.status === 'removed' ? 'danger' : 'warning'}`}>
                                                        {col.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{col.baselineType}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{col.comparisonType}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{col.baselineDistinct}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: col.comparisonDistinct !== col.baselineDistinct ? '#fbbf24' : 'inherit' }}>{col.comparisonDistinct}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{col.baselineNulls}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: col.comparisonNulls > col.baselineNulls ? 'var(--danger)' : col.comparisonNulls < col.baselineNulls ? 'var(--success)' : 'inherit' }}>{col.comparisonNulls}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Radar Section ──────────────────────────────── */}
                    {activeSection === 'radar' && radarData.length > 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={16} style={{ color: '#818cf8' }} /> Multi-Dimensional Comparison
                                </h3>
                                <ResponsiveContainer width="100%" height={360}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke='var(--border-default)' />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} />
                                        <PolarRadiusAxis tick={false} axisLine={false} />
                                        <Radar name="Baseline (A)" dataKey="baseline" stroke={BASELINE_COLOR} fill={BASELINE_COLOR} fillOpacity={0.15} strokeWidth={2} />
                                        <Radar name="Comparison (B)" dataKey="comparison" stroke={COMPARISON_COLOR} fill={COMPARISON_COLOR} fillOpacity={0.15} strokeWidth={2} />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                        <Tooltip content={<DiffTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Data Health Side Card */}
                            {baselineAnalysis.dataHealth && comparisonAnalysis.dataHealth && (
                                <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={16} style={{ color: '#fbbf24' }} /> Data Health Comparison
                                    </h3>
                                    {['score', 'cleanedRows'].map(key => {
                                        const bVal = baselineAnalysis.dataHealth[key] || 0;
                                        const cVal = comparisonAnalysis.dataHealth[key] || 0;
                                        const delta = cVal - bVal;
                                        return (
                                            <div key={key} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{key === 'score' ? 'Health Score' : 'Cleaned Rows'}</span>
                                                <div className="flex items-center gap-3" style={{ marginTop: '8px' }}>
                                                    <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: BASELINE_COLOR }}>{key === 'score' ? `${bVal}%` : bVal}</span>
                                                    <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: COMPARISON_COLOR }}>{key === 'score' ? `${cVal}%` : cVal}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>({delta >= 0 ? '+' : ''}{delta}{key === 'score' ? 'pp' : ''})</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                    {/* ═══ WATERFALL DELTA CHART ═══════════════════════ */}
                    {activeSection === 'waterfall' && summary && summary.waterfallData.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(52,211,153,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BarChart2 size={18} style={{ color: '#818cf8' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 800 }}>Cascading Impact Waterfall</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>How each metric contributes to the cumulative delta</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '20px', height: '420px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary.waterfallData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke='var(--border-subtle)' vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                                            <Tooltip content={<DiffTooltip />} />
                                            <Bar dataKey="value" name="Delta" radius={[6, 6, 0, 0]}>
                                                {summary.waterfallData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                                            </Bar>
                                            <Line type="monotone" dataKey="cumulative" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#818cf8', r: 4 }} name="Cumulative" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ TOP MOVERS LEADERBOARD ═══════════════════════ */}
                    {activeSection === 'movers' && summary && summary.topMovers.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {summary.topMovers.map((m, i) => {
                                const barWidth = Math.min(100, Math.abs(m.changePercent));
                                const isPositive = m.direction === 'up';
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                        style={{ padding: '20px 24px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                                        {/* Rank badge */}
                                        <div style={{ position: 'absolute', top: '12px', right: '16px', width: '32px', height: '32px', borderRadius: '10px', background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: i <= 1 ? '#000' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {i === 0 ? <Crown size={14} /> : `#${i + 1}`}
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{m.label}</div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '14px' }}>
                                            <span style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: isPositive ? '#34d399' : '#f87171' }}>{pct(m.changePercent)}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmt(m.baselineValue)} → {fmt(m.comparisonValue)}</span>
                                        </div>
                                        {/* Animated delta bar */}
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-main)', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${barWidth}%` }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                                style={{ height: '100%', borderRadius: '3px', background: isPositive ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #f87171, #ef4444)' }} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* ═══ DISTRIBUTION SHIFTS ═══════════════════════════ */}
                    {activeSection === 'distributions' && summary && summary.distributionShifts.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
                            {summary.distributionShifts.slice(0, 8).map((shift, i) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                                    style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="flex items-center gap-2">
                                            <Waves size={14} style={{ color: '#818cf8' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 700 }}>{shift.column}</span>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)', background: shift.shiftMagnitude > 0.5 ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)', color: shift.shiftMagnitude > 0.5 ? '#f87171' : '#fbbf24' }}>
                                            Δ {(shift.shiftMagnitude * 100).toFixed(0)}% shift
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px 18px', height: '180px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={shift.baselineBuckets.map((v, idx) => ({ bucket: `B${idx + 1}`, baseline: +(v * 100).toFixed(1), comparison: +((shift.comparisonBuckets[idx] || 0) * 100).toFixed(1) }))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke='var(--border-subtle)' vertical={false} />
                                                <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: 'var(--text-disabled)' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 9, fill: 'var(--text-disabled)' }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<DiffTooltip />} />
                                                <Area type="monotone" dataKey="baseline" stroke={BASELINE_COLOR} fill={BASELINE_COLOR} fillOpacity={0.15} strokeWidth={2} name="Baseline" />
                                                <Area type="monotone" dataKey="comparison" stroke={COMPARISON_COLOR} fill={COMPARISON_COLOR} fillOpacity={0.15} strokeWidth={2} name="Comparison" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                    {activeSection === 'distributions' && summary && summary.distributionShifts.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <Waves size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>No significant distribution shifts detected</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Both datasets share similar data distributions across all numeric columns</div>
                        </div>
                    )}

                </motion.div>
            )}

            {/* ─── Empty State ───────────────────────────────────── */}
            {!loading && !baselineAnalysis && (
                <div style={{ padding: '100px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <GitCompareArrows size={40} style={{ color: '#818cf8', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{t('diff.emptyTitle')}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {t('diff.emptyDesc')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VersionDiffView;
