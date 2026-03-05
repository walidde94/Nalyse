import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
    ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line, Brush,
    Treemap
} from 'recharts';
import {
    BarChart3, TrendingUp, PieChart as PieIcon, Activity,
    Maximize2, Minimize2, Download, Search, Layers, Database,
    BrainCircuit, Target, Sparkles, Grid3X3, LayoutGrid, Columns,
    SlidersHorizontal, Info, ArrowUpRight, ArrowDownRight,
    AlertTriangle, CheckCircle2, Lightbulb, Shield, Zap,
    FileText, Eye, ChevronRight, ChevronDown, Hash, Calendar,
    Type, Globe, Copy, RefreshCw, TrendingDown, Minus
} from 'lucide-react';
import { api } from '../../lib/api';

/* ═══════════════════════════════════════════════════════════
   MULTI-DIMENSIONAL SYNTHESIS — INTERACTIVE STUDIO
   Production-grade data visualization & insight engine
   ═══════════════════════════════════════════════════════════ */

const COLORS = [
    '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#38bdf8',
    '#a78bfa', '#fb923c', '#4ade80', '#e879f9', '#22d3ee',
    '#f87171', '#84cc16', '#c084fc', '#2dd4bf', '#facc15',
];

const CHART_TYPES = [
    { id: 'bar', label: 'Bar' },
    { id: 'line', label: 'Line' },
    { id: 'area', label: 'Area' },
    { id: 'pie', label: 'Donut' },
    { id: 'scatter', label: 'Scatter' },
    { id: 'composed', label: 'Dual Axis' },
    { id: 'radar', label: 'Radar' },
];

// ── Glassmorphic Tooltip ────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(24px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
            {label && <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>}
            {payload.map((e: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 5 : 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: e.color || COLORS[i], boxShadow: `0 0 10px ${e.color || COLORS[i]}60` }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{e.name || e.dataKey}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                        {typeof e.value === 'number' ? e.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : e.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ── Stats Calculator ────────────────────────────────────
const calcStats = (data: any[], key: string) => {
    const vals = data.map(d => parseFloat(d[key])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    const variance = vals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    return { sum, avg, max, min, median, stdDev, count: vals.length };
};

const fmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v % 1 === 0 ? v.toString() : v.toFixed(2);
};

// ── Interactive Chart Component ─────────────────────────
const InteractiveChart = ({ chartData, index, isExpanded, onExpand, onExport }: {
    chartData: any; index: number; isExpanded: boolean; onExpand: () => void; onExport: () => void;
}) => {
    const [localType, setLocalType] = useState(chartData.chartType || 'bar');
    const [showBrush, setShowBrush] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const data = chartData.data || [];
    const xKey = data.length > 0 ? (Object.keys(data[0]).find(k => k === 'name' || k === 'label' || k === 'category') || Object.keys(data[0])[0]) : 'name';
    const yKeys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number') : ['value'];
    if (yKeys.length === 0 && data.length > 0) yKeys.push('value');
    const color = COLORS[index % COLORS.length];
    const color2 = COLORS[(index + 3) % COLORS.length];
    const stats = useMemo(() => yKeys[0] ? calcStats(data, yKeys[0]) : null, [data, yKeys]);

    const margin = { top: 16, right: 20, left: 0, bottom: showBrush ? 50 : 8 };
    const axX = { dataKey: xKey, stroke: 'transparent', tick: { fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 } as any, tickLine: false, axisLine: false, interval: 'preserveStartEnd' as const };
    const axY = { stroke: 'transparent', tick: { fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 } as any, tickLine: false, axisLine: false, width: 52, tickFormatter: (v: number) => fmt(v) };
    const grid = { strokeDasharray: '4 8', stroke: 'var(--border-subtle)', strokeOpacity: 0.4, vertical: false as const };

    const renderChart = () => {
        switch (localType) {
            case 'area': case 'line': return (
                <AreaChart data={data} margin={margin}>
                    <defs>{yKeys.map((k, i) => (<linearGradient key={k} id={`sg-${index}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={localType === 'area' ? 0.3 : 0} /><stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>))}</defs>
                    <CartesianGrid {...grid} /><XAxis {...axX} /><YAxis {...axY} />
                    <Tooltip content={<GlassTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3, strokeDasharray: '4 4' }} />
                    {yKeys.map((k, i) => (<Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} fill={`url(#sg-${index}-${i})`} dot={{ r: 3, fill: 'var(--bg-card)', stroke: COLORS[i % COLORS.length], strokeWidth: 2 }} activeDot={{ r: 6, fill: COLORS[i % COLORS.length], stroke: 'var(--bg-card)', strokeWidth: 2 }} />))}
                    {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />}
                    {showBrush && <Brush dataKey={xKey} height={26} stroke={color} fill="var(--bg-surface)" />}
                </AreaChart>);
            case 'pie': return (
                <PieChart>
                    <defs>{data.map((_: any, i: number) => (<linearGradient key={i} id={`spg-${index}-${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} /><stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.55} /></linearGradient>))}</defs>
                    <Pie data={data} innerRadius="52%" outerRadius="82%" dataKey={yKeys[0]} nameKey={xKey} paddingAngle={3} stroke="none" cursor="pointer" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-tertiary)', strokeWidth: 1 }}>{data.map((_: any, i: number) => <Cell key={i} fill={`url(#spg-${index}-${i})`} />)}</Pie>
                    <Tooltip content={<GlassTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 11, fontWeight: 600 }} />
                </PieChart>);
            case 'scatter': return (
                <ScatterChart margin={margin}>
                    <CartesianGrid {...grid} /><XAxis type="number" dataKey={yKeys[0] || 'value'} name={yKeys[0]} {...axY} /><YAxis type="number" dataKey={yKeys[1] || yKeys[0] || 'value'} name={yKeys[1] || yKeys[0]} {...axY} />
                    <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: '4 4' }} />
                    <Scatter name={chartData.title} data={data} fill={color} fillOpacity={0.7} shape={(p: any) => <circle cx={p.cx} cy={p.cy} r={5} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} strokeOpacity={0.3} />} />
                </ScatterChart>);
            case 'composed': return (
                <ComposedChart data={data} margin={margin}>
                    <CartesianGrid {...grid} /><XAxis {...axX} /><YAxis yAxisId="left" {...axY} />{yKeys.length > 1 && <YAxis yAxisId="right" orientation="right" {...axY} />}
                    <Tooltip content={<GlassTooltip />} />
                    {yKeys[0] && <Bar yAxisId="left" dataKey={yKeys[0]} fill={color} radius={[4, 4, 0, 0]} fillOpacity={0.8} />}
                    {yKeys[1] && <Line yAxisId="right" type="monotone" dataKey={yKeys[1]} stroke={color2} strokeWidth={2.5} dot={{ r: 3 }} />}
                    <Legend wrapperStyle={{ fontSize: 11 }} />{showBrush && <Brush dataKey={xKey} height={26} stroke={color} fill="var(--bg-surface)" />}
                </ComposedChart>);
            case 'radar': return (
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data.slice(0, 12)}>
                    <PolarGrid stroke="var(--border-subtle)" strokeOpacity={0.5} /><PolarAngleAxis dataKey={xKey} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} /><PolarRadiusAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} />
                    {yKeys.map((k, i) => (<Radar key={k} name={k} dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.12} strokeWidth={2} />))}
                    <Tooltip content={<GlassTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>);
            default: return (
                <BarChart data={data} margin={margin}>
                    <defs>{yKeys.map((k, i) => (<linearGradient key={k} id={`sbg-${index}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.9} /><stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.45} /></linearGradient>))}</defs>
                    <CartesianGrid {...grid} /><XAxis {...axX} /><YAxis {...axY} />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    {yKeys.map((k, i) => (<Bar key={k} dataKey={k} fill={`url(#sbg-${index}-${i})`} radius={[6, 6, 0, 0]} cursor="pointer" />))}
                    {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    {showBrush && <Brush dataKey={xKey} height={26} stroke={color} fill="var(--bg-surface)" />}
                </BarChart>);
        }
    };

    if (!data.length) return (
        <div className="card" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20, opacity: 0.5 }}>
            <BarChart3 size={24} style={{ marginRight: 8 }} /><span style={{ fontSize: 13, fontWeight: 600 }}>No data for "{chartData.title}"</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card" style={{ minHeight: isExpanded ? '78vh' : 460, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 22 }}>
            {/* Accent */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color2})`, flexShrink: 0 }} />

            {/* Header */}
            <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.2px', color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chartData.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: `${color}15`, color, border: `1px solid ${color}25`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{localType}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{data.length} pts</span>
                        {chartData.description && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>• {chartData.description}</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <select value={localType} onChange={e => setLocalType(e.target.value)} style={{ height: 26, padding: '0 6px', fontSize: 10, fontWeight: 700, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}>
                        {CHART_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
                    </select>
                    {['bar', 'line', 'area', 'composed'].includes(localType) && (
                        <Btn active={showBrush} onClick={() => setShowBrush(!showBrush)} title="Zoom brush"><SlidersHorizontal size={12} /></Btn>
                    )}
                    <Btn onClick={() => setShowStats(!showStats)} title="Stats" active={showStats}><Hash size={12} /></Btn>
                    <Btn onClick={onExpand} title={isExpanded ? 'Minimize' : 'Expand'}>{isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}</Btn>
                    <Btn onClick={onExport} title="Export CSV"><Download size={12} /></Btn>
                </div>
            </div>

            {/* Stat strip */}
            {showStats && stats && (
                <div style={{ padding: '0 20px 8px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[{ l: 'Σ Sum', v: fmt(stats.sum), c: color }, { l: 'μ Avg', v: fmt(stats.avg), c: '#3b82f6' }, { l: '↑ Max', v: fmt(stats.max), c: '#10b981' }, { l: '↓ Min', v: fmt(stats.min), c: '#f59e0b' }, { l: '◆ Med', v: fmt(stats.median), c: '#8b5cf6' }, { l: 'σ Dev', v: fmt(stats.stdDev), c: '#ef4444' }].map((s, i) => (
                        <div key={i} style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 4, height: 4, borderRadius: 1.5, background: s.c }} />
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.v}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart area */}
            <div style={{ flex: 1, minHeight: 280, padding: '0 12px 12px' }}>
                <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const Btn = ({ children, onClick, title, active }: any) => (
    <button onClick={onClick} title={title} style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${active ? 'var(--primary-glow)' : 'var(--border-subtle)'}`, background: active ? 'var(--primary-subtle)' : 'var(--bg-surface)', color: active ? 'var(--primary)' : 'var(--text-tertiary)', cursor: 'pointer', transition: 'all 0.2s' }}>{children}</button>
);

// ── Insight Card ────────────────────────────────────────
const InsightCard = ({ insight, i }: { insight: any; i: number }) => {
    const iconMap: Record<string, any> = { pattern: Sparkles, anomaly: AlertTriangle, correlation: Activity, trend: TrendingUp, quality: Shield, segment: Layers };
    const colorMap: Record<string, string> = { pattern: '#818cf8', anomaly: '#f87171', correlation: '#34d399', trend: '#38bdf8', quality: '#fbbf24', segment: '#a78bfa' };
    const Icon = iconMap[insight.type] || Lightbulb;
    const clr = colorMap[insight.type] || '#818cf8';
    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 12, background: `${clr}06`, border: `1px solid ${clr}15`, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${clr}12`, color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Icon size={13} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: clr }}>{insight.type}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{Math.round((insight.confidence || 0.8) * 100)}%</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{insight.description}</p>
            </div>
        </motion.div>
    );
};

// ── Column Health Bar ───────────────────────────────────
const HealthBar = ({ value, color }: { value: number; color: string }) => (
    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.6s ease' }} />
    </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN SYNTHESIS VIEW
// ═══════════════════════════════════════════════════════════
interface SynthesisViewProps { files: any[]; token: string; }

export const SynthesisView: React.FC<SynthesisViewProps> = ({ files, token }) => {
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [expandedChart, setExpandedChart] = useState<number | null>(null);
    const [layout, setLayout] = useState<'grid' | 'single'>('grid');
    const [search, setSearch] = useState('');
    const [activePanel, setActivePanel] = useState<'charts' | 'insights' | 'health'>('charts');
    const [insightsExpanded, setInsightsExpanded] = useState(true);

    // Load analysis
    const loadAnalysis = useCallback(async (fileId: string) => {
        if (!fileId) return;
        setLoading(true); setError(''); setAnalysis(null); setRawData([]);
        try {
            const [aRes, pRes] = await Promise.allSettled([
                api.get(`/files/${fileId}/analyze`),
                api.get(`/files/${fileId}/preview`),
            ]);
            if (aRes.status === 'fulfilled') {
                const d = aRes.value.data;
                setAnalysis(d?.analysis || d);
            } else {
                setError('Analysis not available. Please analyze this dataset first from the Analysis view.');
            }
            if (pRes.status === 'fulfilled') {
                const pd = pRes.value.data;
                setRawData(Array.isArray(pd) ? pd : pd?.data || pd?.rows || []);
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to load analysis');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (selectedFile) loadAnalysis(selectedFile); }, [selectedFile, loadAnalysis]);
    useEffect(() => { if (!selectedFile && files.length > 0) setSelectedFile(files[0]?.id || ''); }, [files]);

    // Derived data
    const charts = useMemo(() => (analysis?.options || []).map((opt: any, i: number) => ({ ...opt, id: i })), [analysis]);
    const filteredCharts = useMemo(() => search ? charts.filter((c: any) => c.title?.toLowerCase().includes(search.toLowerCase())) : charts, [charts, search]);
    const insights = analysis?.aiInsights || [];
    const keyFindings = analysis?.keyFindings || [];
    const allInsights = [...keyFindings, ...insights];
    const health = analysis?.dataHealth;
    const exec = analysis?.executiveReasoning;
    const summary = analysis?.summary;
    const kpiMetrics = analysis?.metrics || [];

    const fileLabel = files.find((f: any) => f.id === selectedFile)?.originalName || files.find((f: any) => f.id === selectedFile)?.filename || '';

    const exportCSV = (chart: any) => {
        if (!chart.data?.length) return;
        const csv = [Object.keys(chart.data[0]).join(','), ...chart.data.map((r: any) => Object.values(r).join(','))].join('\n');
        const b = new Blob([csv], { type: 'text/csv' });
        const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${(chart.title || 'chart').replace(/\s+/g, '_')}.csv`; a.click(); URL.revokeObjectURL(u);
    };

    const hasData = analysis && charts.length > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text-primary)' }}>

            {/* ═══ HEADER ═══ */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ padding: '24px 32px 16px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: -60, right: '10%', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                        <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#818cf8', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', padding: '3px 12px', borderRadius: 99, marginBottom: 6 }}>
                                <Sparkles size={9} /> INTERACTIVE STUDIO
                            </span>
                            <h1 style={{ fontSize: 'clamp(24px, 2.8vw, 32px)', fontWeight: 900, margin: '4px 0 0', lineHeight: 1.15, letterSpacing: '-0.025em', background: 'linear-gradient(135deg, var(--text-primary) 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Multi-Dimensional Synthesis
                            </h1>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 560, lineHeight: 1.5, fontWeight: 500 }}>
                                Interactive exploration with real-time chart switching, statistical summaries, AI insights, and data health monitoring.
                            </p>
                        </div>
                        {hasData && (
                            <button onClick={() => loadAnalysis(selectedFile)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                <RefreshCw size={12} /> Refresh
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 260 }}>
                            <Database size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                            <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)}
                                style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                                <option value="">Select a dataset...</option>
                                {files.map((f: any) => <option key={f.id} value={f.id}>{(f as any).originalName || f.filename}</option>)}
                            </select>
                        </div>
                        {hasData && (
                            <>
                                {/* Tab pills */}
                                <div style={{ display: 'flex', gap: 1, background: 'var(--bg-surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                    {([['charts', BarChart3, 'Visualizations'], ['insights', Lightbulb, 'Insights'], ['health', Shield, 'Data Health']] as const).map(([key, Icon, label]) => (
                                        <button key={key} onClick={() => setActivePanel(key as any)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', background: activePanel === key ? 'var(--primary-subtle)' : 'transparent', color: activePanel === key ? 'var(--primary)' : 'var(--text-tertiary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <Icon size={12} />{label}
                                            {key === 'insights' && allInsights.length > 0 && <span style={{ fontSize: 9, fontWeight: 900, background: '#818cf820', color: '#818cf8', padding: '1px 5px', borderRadius: 4 }}>{allInsights.length}</span>}
                                        </button>
                                    ))}
                                </div>
                                {activePanel === 'charts' && (
                                    <>
                                        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface)', padding: 2, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                                            <Btn active={layout === 'grid'} onClick={() => setLayout('grid')}><LayoutGrid size={12} /></Btn>
                                            <Btn active={layout === 'single'} onClick={() => setLayout('single')}><Columns size={12} /></Btn>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter charts..."
                                                style={{ padding: '7px 10px 7px 28px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, outline: 'none', width: 150 }} />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ═══ CONTENT ═══ */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px 32px' }}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 14 }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                                <BrainCircuit size={28} style={{ color: '#818cf8' }} />
                            </motion.div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Synthesizing multi-dimensional data...</span>
                        </div>
                    )}

                    {/* Empty / Error state */}
                    {!loading && !hasData && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="card" style={{ padding: '48px 32px', textAlign: 'center', marginTop: 12 }}>
                            {error ? <AlertTriangle size={40} style={{ color: '#f59e0b', margin: '0 auto 14px' }} /> : <BarChart3 size={40} style={{ color: '#818cf8', margin: '0 auto 14px', opacity: 0.4 }} />}
                            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>{error ? 'Analysis Required' : selectedFile ? 'Processing...' : 'Select a Dataset'}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
                                {error || 'Choose a dataset from the dropdown to explore its visualizations interactively.'}
                            </p>
                            {!error && (
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', fontSize: 10 }}>
                                    {['7 chart types', 'Statistical summaries', 'AI-powered insights', 'CSV export', 'Zoom & brush'].map((t, i) => (
                                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                            <CheckCircle2 size={10} style={{ color: '#34d399' }} /> {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ MAIN CONTENT WHEN DATA LOADED ═══ */}
                    {!loading && hasData && (
                        <>
                            {/* KPI Metrics from analysis */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 20 }}>
                                {[
                                    { label: 'Records', value: (summary?.rows || rawData.length || 0).toLocaleString(), icon: Database, color: '#818cf8' },
                                    { label: 'Dimensions', value: (summary?.columns || 0).toString(), icon: Layers, color: '#34d399' },
                                    { label: 'Visualizations', value: charts.length.toString(), icon: BarChart3, color: '#fbbf24' },
                                    { label: 'AI Insights', value: allInsights.length.toString(), icon: BrainCircuit, color: '#f472b6' },
                                    { label: 'Data Health', value: `${health?.score || 100}%`, icon: Shield, color: (health?.score || 100) >= 80 ? '#34d399' : '#f59e0b' },
                                    ...(kpiMetrics.length > 0 ? kpiMetrics.slice(0, 3).map((m: any) => ({ label: m.label, value: m.value, icon: Zap, color: m.color || '#818cf8' })) : []),
                                ].map((m, i) => {
                                    const Icon = m.icon;
                                    return (
                                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                                            className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${m.color}` }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${m.color}10`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} /></div>
                                            <div>
                                                <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{m.label}</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>{m.value}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Executive Summary */}
                            {exec?.executiveSummary && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                                    className="card" style={{ padding: '16px 20px', marginBottom: 20, borderLeft: '3px solid #818cf8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <BrainCircuit size={14} style={{ color: '#818cf8' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#818cf8' }}>Executive Summary</span>
                                    </div>
                                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>{exec.executiveSummary}</p>
                                    {exec.strategicAdvice?.length > 0 && (
                                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {exec.strategicAdvice.map((a: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    <ChevronRight size={12} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />{a}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ═══ PANELS ═══ */}
                            <AnimatePresence mode="wait">
                                {activePanel === 'charts' && (
                                    <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div style={{
                                            display: 'grid', gap: 16,
                                            gridTemplateColumns: expandedChart !== null ? '1fr' : layout === 'single' ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
                                        }}>
                                            {filteredCharts.map((chart: any, i: number) => {
                                                if (expandedChart !== null && expandedChart !== chart.id) return null;
                                                return <InteractiveChart key={chart.id} chartData={chart} index={i} isExpanded={expandedChart === chart.id} onExpand={() => setExpandedChart(expandedChart === chart.id ? null : chart.id)} onExport={() => exportCSV(chart)} />;
                                            })}
                                        </div>
                                        {search && filteredCharts.length === 0 && (
                                            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                                                <Search size={20} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>No charts match "{search}"</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activePanel === 'insights' && (
                                    <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {allInsights.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 10 }}>
                                                {allInsights.map((ins: any, i: number) => <InsightCard key={ins.id || i} insight={ins} i={i} />)}
                                            </div>
                                        ) : (
                                            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                                                <Lightbulb size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>No AI insights available for this dataset</p>
                                            </div>
                                        )}

                                        {/* Priority Matrix */}
                                        {exec?.priorityMatrix?.length > 0 && (
                                            <div className="card" style={{ padding: '18px 20px', marginTop: 16 }}>
                                                <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Target size={14} style={{ color: '#818cf8' }} /> Priority Matrix
                                                </h3>
                                                <div style={{ display: 'grid', gap: 8 }}>
                                                    {exec.priorityMatrix.map((p: any, i: number) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                                                            <span style={{ fontSize: 12, fontWeight: 700, flex: 1, color: 'var(--text-primary)' }}>{p.task}</span>
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: p.impact === 'High' ? '#10b98115' : '#f59e0b15', color: p.impact === 'High' ? '#10b981' : '#f59e0b', border: `1px solid ${p.impact === 'High' ? '#10b98125' : '#f59e0b25'}` }}>{p.impact} impact</span>
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: p.effort === 'Low' ? '#34d39915' : '#f4728015', color: p.effort === 'Low' ? '#34d399' : '#f47280', border: `1px solid ${p.effort === 'Low' ? '#34d39925' : '#f4728025'}` }}>{p.effort} effort</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Data Limitations */}
                                        {analysis?.dataLimitations?.length > 0 && (
                                            <div className="card" style={{ padding: '16px 20px', marginTop: 16, borderLeft: '3px solid #f59e0b' }}>
                                                <h3 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                                                    <AlertTriangle size={13} /> Data Limitations
                                                </h3>
                                                {analysis.dataLimitations.map((lim: string, i: number) => (
                                                    <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                                        <Minus size={10} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />{lim}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activePanel === 'health' && (
                                    <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {health ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 16 }}>
                                                {/* Score card */}
                                                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${health.score >= 80 ? '#34d399' : health.score >= 50 ? '#f59e0b' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
                                                        <span style={{ fontSize: 28, fontWeight: 900, color: health.score >= 80 ? '#34d399' : health.score >= 50 ? '#f59e0b' : '#ef4444' }}>{health.score}</span>
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Overall Health Score</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{health.cleanedRows || 0} rows cleaned</span>
                                                </div>

                                                {/* Issues */}
                                                {health.issues?.length > 0 && (
                                                    <div className="card" style={{ padding: '20px' }}>
                                                        <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> Quality Issues ({health.issues.length})
                                                        </h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            {health.issues.map((issue: string, i: number) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#f59e0b08', border: '1px solid #f59e0b15', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                                    <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />{issue}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Column Health */}
                                                {health.columnHealth?.length > 0 && (
                                                    <div className="card" style={{ padding: '20px', gridColumn: 'span 2' }}>
                                                        <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Layers size={14} style={{ color: '#818cf8' }} /> Column Health ({health.columnHealth.length} columns)
                                                        </h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                                                            {health.columnHealth.map((col: any, i: number) => (
                                                                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{col.column}</span>
                                                                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{col.type}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                                                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>Complete</span>
                                                                            <HealthBar value={col.completeness} color="#34d399" />
                                                                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-tertiary)' }}>{col.completeness}%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                                                <Shield size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>No data health information available</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SynthesisView;
