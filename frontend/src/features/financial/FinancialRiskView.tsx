import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Legend, ComposedChart, Line
} from 'recharts';
import {
    TrendingUp, TrendingDown, Minus, DollarSign, Shield, Activity,
    AlertTriangle, RefreshCw, CheckCircle2, BarChart3, Layers, PieChart,
    Zap, Target, Brain, ArrowUpRight, ArrowDownRight, Clock, Cpu,
    Gauge, Landmark, Scale, Wallet, LineChart, Lightbulb, Eye,
    ChevronRight, Sparkles, Bell
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import {
    runFinancialAnalysis, fmt, fmtCurrency, fmtPct, fmtRatio,
    RISK_COLORS, DEFAULT_SCENARIOS,
    type FinancialAnalysisResult, type FinancialKPI, type FinancialRatio,
    type ForecastPoint, type StressResult, type RiskComponent
} from './financialHelpers';

/* ─── Mini Sparkline ──────────────────────────────────────── */
const Spark = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`fs-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient></defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#fs-${color.replace('#', '')})`} />
        </svg>
    );
};

/* ─── Score Ring ───────────────────────────────────────────── */
const ScoreRing = ({ value, size = 88, stroke = 7, invert = false }: { value: number; size?: number; stroke?: number; invert?: boolean }) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(value, 100) / 100) * circ;
    const color = invert
        ? (value >= 60 ? '#ef4444' : value >= 30 ? '#fbbf24' : '#34d399')
        : (value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171');
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
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
const FinTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(8,8,14,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)', minWidth: '180px', color: '#fff' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', color: p.color || '#94a3b8', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{typeof p.value === 'number' ? fmtCurrency(p.value) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── Status Badge ────────────────────────────────────────── */
const StatusBadge = ({ status, label }: { status: string; label?: string }) => (
    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: RISK_COLORS[status] || '#94a3b8', background: `${RISK_COLORS[status] || '#94a3b8'}15`, border: `1px solid ${RISK_COLORS[status] || '#94a3b8'}30` }}>
        {label || status}
    </span>
);

const LOAD_STEPS = ['Loading financial data…', 'Extracting financial metrics…', 'Computing ratios & indicators…', 'Running Altman Z-Score model…', 'Forecasting cashflow…', 'Stress testing scenarios…', 'Generating executive insights…'];

/* ═══════════════════════════════════════════════════════════ */
interface Props { files: { id: string; filename: string; size: number; createdAt: string; originalName?: string }[]; token: string; }

export const FinancialRiskView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const [selectedFileId, setSelectedFileId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [result, setResult] = useState<FinancialAnalysisResult | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'forecast' | 'risk' | 'stress' | 'recommendations'>('overview');
    const [selectedScenario, setSelectedScenario] = useState<number>(0);

    const runAnalysis = useCallback(async () => {
        if (!selectedFileId) { addToast('Select a financial dataset first', 'error'); return; }
        setLoading(true); setLoadStep(0); setResult(null);
        try {
            setLoadStep(0);
            const res = await fetch(`${API_URL}/api/files/${selectedFileId}/analyze`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to load dataset');
            setLoadStep(1);
            const analysis = await res.json();
            const data = analysis.sampleData || [];
            if (!data.length) throw new Error('No data found');
            for (let i = 2; i <= 5; i++) { setLoadStep(i); await new Promise(r => setTimeout(r, 350)); }
            const analysisResult = runFinancialAnalysis(data);
            setLoadStep(6); await new Promise(r => setTimeout(r, 300));
            setResult(analysisResult);
            addToast(`Analysis complete — Risk: ${analysisResult.riskScore.riskClass}`, analysisResult.riskScore.overall > 60 ? 'error' : 'success');
        } catch (e: any) { addToast(e.message || 'Analysis failed', 'error'); }
        finally { setLoading(false); }
    }, [selectedFileId, token, addToast]);

    const forecastChartData = useMemo(() => {
        if (!result) return [];
        // Limit historical points to last 24 for chart readability
        const historicalPoints = result.forecast.filter(f => f.isHistorical);
        const projectedPoints = result.forecast.filter(f => !f.isHistorical);
        const trimmedHistorical = historicalPoints.slice(-24);
        return [...trimmedHistorical, ...projectedPoints].map(f => ({
            name: f.period, projected: Math.round(f.projected),
            upper: Math.round(f.upper), lower: Math.round(f.lower),
            worstCase: Math.round(f.worstCase),
            historical: f.isHistorical ? Math.round(f.historicalValue || f.projected) : undefined
        }));
    }, [result]);

    // Limit bar chart to last 36 periods
    const barChartData = useMemo(() => {
        if (!result) return [];
        const periods = result.periods.slice(-36);
        return periods.map(p => ({
            name: p.period, Revenue: Math.round(p.revenue),
            Costs: Math.round(p.totalCosts), 'Net Income': Math.round(p.netIncome)
        }));
    }, [result]);

    const stressChartData = useMemo(() => {
        if (!result) return [];
        const maxLen = Math.max(...result.stressResults.map(s => s.forecast.length));
        // Only show projected points + last 12 historical for stress chart
        const startIdx = Math.max(0, maxLen - 24);
        return Array.from({ length: maxLen - startIdx }, (_, idx) => {
            const i = startIdx + idx;
            const point: any = { name: result.stressResults[0]?.forecast[i]?.period || `${i}` };
            result.stressResults.forEach(sr => {
                if (sr.forecast[i]) point[sr.scenario.name] = Math.round(sr.forecast[i].projected);
            });
            return point;
        });
    }, [result]);

    const riskRadarData = useMemo(() =>
        result?.riskScore.components.map(c => ({
            metric: c.name, value: c.score, fullMark: 100
        })) || []
        , [result]);

    return (
        <div id="financial-risk-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>

            {/* ─── Header ───────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(52,211,153,0.2))', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Landmark size={24} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #34d399 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Financial Risk Intelligence
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Cashflow Forecasting · Insolvency Risk Scoring · Stress Testing · Ratio Analysis · Executive Insights
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Control Panel ─────────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #34d399, #f59e0b)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Cpu size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Financial Dataset</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '260px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }} /> Dataset
                        </label>
                        <select value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFileId ? '#818cf844' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="">Choose financial dataset…</option>
                            {files.map(f => <option key={f.id} value={f.id}>{f.originalName || f.filename}</option>)}
                        </select>
                    </div>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={runAnalysis}
                        disabled={loading || !selectedFileId}
                        style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #818cf8, #34d399)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: !selectedFileId ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(99,102,241,0.25)', whiteSpace: 'nowrap' as any, flexShrink: 0 }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Landmark size={15} />}
                        {loading ? 'Analyzing…' : 'Run Financial Analysis'}
                    </motion.button>
                </div>
            </div>

            {/* ─── Loading ───────────────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)', borderTop: '3px solid #818cf8' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.08 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <CheckCircle2 size={14} style={{ color: '#34d399' }} /> : i === loadStep ? <RefreshCw size={14} className="animate-spin" style={{ color: '#818cf8' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
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

                    {/* ─── Executive Summary Bar ──────────────────────── */}
                    <div style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', background: `linear-gradient(135deg, ${RISK_COLORS[result.riskScore.riskClass]}08, rgba(99,102,241,0.06))`, border: `1px solid ${RISK_COLORS[result.riskScore.riskClass]}20`, display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <ScoreRing value={result.riskScore.overall} invert />
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <Brain size={16} style={{ color: '#818cf8' }} />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Executive Summary</span>
                                <StatusBadge status={result.riskScore.riskClass} />
                            </div>
                            {result.explanations.slice(0, 2).map((exp, i) => (
                                <p key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '4px' }}>{exp}</p>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexShrink: 0, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Altman Z', val: result.riskScore.altmanZ.toFixed(2), color: RISK_COLORS[result.riskScore.altmanZone === 'Safe' ? 'Low' : result.riskScore.altmanZone === 'Grey' ? 'Medium' : 'Critical'] },
                                { label: 'Insolvency Prob.', val: `${(result.riskScore.insolvencyProbability * 100).toFixed(1)}%`, color: result.riskScore.insolvencyProbability > 0.3 ? '#ef4444' : '#34d399' },
                                { label: 'Runway', val: result.riskScore.liquidityRunway >= 100 ? '∞' : `${result.riskScore.liquidityRunway.toFixed(1)}mo`, color: result.riskScore.liquidityRunway > 12 ? '#34d399' : result.riskScore.liquidityRunway > 6 ? '#fbbf24' : '#ef4444' },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section Tabs ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {([
                            { id: 'overview' as const, label: 'KPI Overview', icon: <Target size={14} /> },
                            { id: 'forecast' as const, label: 'Cashflow Forecast', icon: <LineChart size={14} /> },
                            { id: 'risk' as const, label: 'Risk Analysis', icon: <Shield size={14} /> },
                            { id: 'stress' as const, label: 'Stress Testing', icon: <Zap size={14} /> },
                            { id: 'recommendations' as const, label: 'Recommendations', icon: <Lightbulb size={14} />, count: result.recommendations.length },
                        ]).map(tab => (
                            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: activeSection === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: activeSection === tab.id ? 'var(--primary-subtle)' : 'var(--bg-secondary)', color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                                {tab.icon} {tab.label}
                                {tab.count !== undefined && <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* ─── KPI OVERVIEW ──────────────────────────────── */}
                    {activeSection === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* KPI Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                                {result.kpis.map((kpi, i) => (
                                    <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                        style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${RISK_COLORS[kpi.status]}, transparent)` }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
                                            <StatusBadge status={kpi.status} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{kpi.formatted}</div>
                                                {kpi.trendPct !== 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: kpi.trend === 'up' ? (kpi.label === 'Risk Score' ? '#ef4444' : '#34d399') : (kpi.label === 'Risk Score' ? '#34d399' : '#ef4444') }}>
                                                        {kpi.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                        {fmtPct(kpi.trendPct)}
                                                    </div>
                                                )}
                                            </div>
                                            {kpi.sparkline.length > 0 && <Spark data={kpi.sparkline} color={RISK_COLORS[kpi.status]} w={70} h={28} />}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Financial Ratios Grid */}
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Scale size={16} style={{ color: '#818cf8' }} /> Financial Ratios</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                                    {result.ratios.map((ratio, i) => (
                                        <motion.div key={ratio.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                            style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${RISK_COLORS[ratio.status]}15` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700 }}>{ratio.name}</span>
                                                <StatusBadge status={ratio.status} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: RISK_COLORS[ratio.status] }}>{ratio.name.includes('Margin') ? `${(ratio.value * 100).toFixed(1)}%` : fmtRatio(ratio.value)}</span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Benchmark: {ratio.name.includes('Margin') ? `${(ratio.benchmark * 100).toFixed(0)}%` : fmtRatio(ratio.benchmark)}</span>
                                            </div>
                                            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (ratio.value / (ratio.benchmark * 2)) * 100)}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.05 }}
                                                    style={{ height: '100%', borderRadius: '2px', background: RISK_COLORS[ratio.status] }} />
                                            </div>
                                            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{ratio.description}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── CASHFLOW FORECAST ─────────────────────────── */}
                    {activeSection === 'forecast' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <LineChart size={16} style={{ color: '#818cf8' }} /> 12-Month Cashflow Projection
                                    {result.riskScore.cashExhaustionDate && (
                                        <StatusBadge status="Critical" label={`Exhaustion: ${result.riskScore.cashExhaustionDate}`} />
                                    )}
                                </h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={forecastChartData} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                        <defs>
                                            <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="fcWarn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtCurrency(v)} />
                                        <Tooltip content={<FinTooltip />} />
                                        <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="none" fill="rgba(99,102,241,0.08)" />
                                        <Area type="monotone" dataKey="lower" name="Lower Bound" stroke="none" fill="rgba(99,102,241,0.04)" />
                                        <Line type="monotone" dataKey="worstCase" name="Worst Case" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                                        <Line type="monotone" dataKey="historical" name="Historical" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 3 }} />
                                        <Line type="monotone" dataKey="projected" name="Projected" stroke="#818cf8" strokeWidth={2.5} dot={false} strokeDasharray="0" />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Revenue vs Costs trend */}
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart3 size={16} style={{ color: '#34d399' }} /> Revenue vs. Total Costs
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={result.periods.map(p => ({ name: p.period, Revenue: Math.round(p.revenue), Costs: Math.round(p.totalCosts), 'Net Income': Math.round(p.netIncome) }))} margin={{ top: 5, right: 16, left: 8, bottom: 36 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} angle={-30} textAnchor="end" height={45} axisLine={false} tickLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtCurrency(v)} />
                                        <Tooltip content={<FinTooltip />} />
                                        <Bar dataKey="Revenue" fill="#818cf8" radius={[4, 4, 0, 0]} opacity={0.8} />
                                        <Bar dataKey="Costs" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.6} />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RISK ANALYSIS ─────────────────────────────── */}
                    {activeSection === 'risk' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                                {/* Risk Components */}
                                <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={16} style={{ color: '#818cf8' }} /> Risk Component Breakdown
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {result.riskScore.components.map((comp, i) => (
                                            <motion.div key={comp.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-main)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: comp.direction === 'negative' ? '#ef4444' : '#34d399' }} />
                                                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{comp.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Weight: {(comp.weight * 100).toFixed(0)}%</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: comp.score > 60 ? '#ef4444' : comp.score > 30 ? '#fbbf24' : '#34d399' }}>{comp.score}</span>
                                                    </div>
                                                </div>
                                                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${comp.score}%` }}
                                                        transition={{ duration: 0.8, delay: i * 0.08 }}
                                                        style={{ height: '100%', borderRadius: '2px', background: comp.score > 60 ? '#ef4444' : comp.score > 30 ? '#fbbf24' : '#34d399' }} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Radar */}
                                <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={16} style={{ color: '#f59e0b' }} /> Multi-Dimensional Risk Radar
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={riskRadarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                            <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                            <Radar name="Risk Score" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                                            <Tooltip content={<FinTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STRESS TESTING ────────────────────────────── */}
                    {activeSection === 'stress' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Scenario Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                {result.stressResults.map((sr, i) => (
                                    <motion.div key={sr.scenario.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedScenario(i)}
                                        style={{ padding: '16px', borderRadius: '12px', background: selectedScenario === i ? `${sr.scenario.color}12` : 'var(--bg-secondary)', border: `1px solid ${selectedScenario === i ? sr.scenario.color + '50' : 'var(--border-default)'}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: sr.scenario.color }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: sr.scenario.color }}>{sr.scenario.name}</span>
                                            <StatusBadge status={sr.riskClass} />
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                                            <span>Revenue: {sr.scenario.revenueChange === 0 ? 'Base' : fmtPct(sr.scenario.revenueChange)}</span>
                                            <span>Costs: {sr.scenario.costChange === 0 ? 'Base' : fmtPct(sr.scenario.costChange)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>RISK</div><div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sr.riskScore > 60 ? '#ef4444' : sr.riskScore > 30 ? '#fbbf24' : '#34d399' }}>{sr.riskScore}</div></div>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>RUNWAY</div><div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{sr.survivalMonths >= 999 ? '∞' : `${sr.liquidityRunway}mo`}</div></div>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Δ RISK</div><div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sr.impactDelta.riskScoreChange > 0 ? '#ef4444' : '#34d399' }}>{sr.impactDelta.riskScoreChange > 0 ? '+' : ''}{sr.impactDelta.riskScoreChange}</div></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Stress Comparison Chart */}
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={16} style={{ color: '#f59e0b' }} /> Scenario Comparison — Cash Position Over Time
                                </h3>
                                <ResponsiveContainer width="100%" height={380}>
                                    <ComposedChart data={stressChartData} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtCurrency(v)} />
                                        <Tooltip content={<FinTooltip />} />
                                        {result.stressResults.map(sr => (
                                            <Line key={sr.scenario.id} type="monotone" dataKey={sr.scenario.name} stroke={sr.scenario.color} strokeWidth={selectedScenario === result.stressResults.indexOf(sr) ? 3 : 1.5} dot={false} strokeDasharray={sr.scenario.id === 'base' ? '0' : '6 3'} opacity={selectedScenario === result.stressResults.indexOf(sr) ? 1 : 0.5} />
                                        ))}
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RECOMMENDATIONS ───────────────────────────── */}
                    {activeSection === 'recommendations' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {result.recommendations.map((rec, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)', border: `1px solid ${RISK_COLORS[rec.severity]}20`, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${RISK_COLORS[rec.severity]}, transparent)` }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${RISK_COLORS[rec.severity]}15`, border: `1px solid ${RISK_COLORS[rec.severity]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {rec.actionType === 'immediate' ? <AlertTriangle size={16} style={{ color: RISK_COLORS[rec.severity] }} /> : rec.actionType === 'short-term' ? <Clock size={16} style={{ color: RISK_COLORS[rec.severity] }} /> : <Target size={16} style={{ color: RISK_COLORS[rec.severity] }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{rec.title}</span>
                                                    <StatusBadge status={rec.severity} />
                                                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'capitalize' }}>{rec.actionType}</span>
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rec.category}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '44px', marginBottom: '8px' }}>{rec.description}</p>
                                        <div style={{ paddingLeft: '44px', fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>
                                            <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} /> Impact: {rec.impact}
                                        </div>
                                    </motion.div>
                                ))}
                                {result.recommendations.length === 0 && (
                                    <div style={{ padding: '60px', textAlign: 'center' }}>
                                        <Shield size={40} style={{ color: '#34d399', margin: '0 auto 12px', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Strong Financial Position</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No critical recommendations at this time.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </motion.div>
            )}

            {/* ─── Empty State ───────────────────────────────────── */}
            {!loading && !result && (
                <div style={{ padding: '100px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '440px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Landmark size={40} style={{ color: '#818cf8', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Financial Risk Intelligence</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Upload a financial dataset with <strong style={{ color: '#818cf8' }}>revenue, costs, and balance sheet data</strong>, then run analysis to get cashflow forecasts, insolvency risk scores, ratio analysis, and stress test scenarios.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                            {['Cashflow Forecast', 'Altman Z-Score', 'Ratio Analysis', 'Stress Testing', 'Risk Scoring'].map(tag => (
                                <span key={tag} style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialRiskView;
