import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
    TrendingUp, BrainCircuit, Loader2, Sparkles, Target, BarChart3,
    AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Calendar,
    ArrowUpRight, ArrowDownRight, Minus, Zap, Info, Hash, Type
} from 'lucide-react';
import { API_URL } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────
interface ForecastPoint {
    period: string;
    actual?: number;
    forecast?: number;
    upperBound?: number;
    lowerBound?: number;
    isHistorical: boolean;
}

interface ForecastResult {
    predictions: { period: string; value: number; upper: number; lower: number }[];
    trend: 'up' | 'down' | 'stable';
    trendPct: number;
    seasonality: string;
    accuracy: number;
    summary: string;
    risks: string[];
    opportunities: string[];
    methodology: string;
}

interface Props {
    data: any[];
    schema: Record<string, string>;
}

// ─── Custom Tooltip ──────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
            padding: '14px 18px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            minWidth: 180,
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fff' }}>
                        {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────
export const PredictiveForecasting = ({ data, schema }: Props) => {
    const { token } = useAuth();
    const [selectedMetric, setSelectedMetric] = useState('');
    const [forecastPeriods, setForecastPeriods] = useState(10);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ForecastResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showMethodology, setShowMethodology] = useState(false);

    // Detect numeric columns for forecasting
    const numericCols = useMemo(() =>
        Object.entries(schema).filter(([, t]) => t === 'number').map(([n]) => n),
        [schema]);

    const stringCols = useMemo(() =>
        Object.entries(schema).filter(([, t]) => t !== 'number').map(([n]) => n),
        [schema]);

    // Compute historical time series for selected metric
    const historicalSeries = useMemo(() => {
        if (!selectedMetric || !data.length) return [];
        return data.slice(-100).map((row, i) => ({
            period: row[stringCols[0]] || `Row ${i + 1}`,
            actual: Number(row[selectedMetric]) || 0,
            isHistorical: true,
        }));
    }, [selectedMetric, data, stringCols]);

    // Combined chart data (historical + forecast)
    const chartData = useMemo((): ForecastPoint[] => {
        if (!result) return historicalSeries;
        const hist: ForecastPoint[] = historicalSeries.map(h => ({
            ...h, forecast: undefined, upperBound: undefined, lowerBound: undefined
        }));
        // Bridge: last historical point = first forecast point
        if (hist.length > 0 && result.predictions.length > 0) {
            const lastHist = hist[hist.length - 1];
            hist[hist.length - 1] = { ...lastHist, forecast: lastHist.actual };
        }
        const fpts: ForecastPoint[] = result.predictions.map(p => ({
            period: p.period,
            actual: undefined,
            forecast: p.value,
            upperBound: p.upper,
            lowerBound: p.lower,
            isHistorical: false,
        }));
        return [...hist, ...fpts];
    }, [historicalSeries, result]);

    const runForecast = useCallback(async () => {
        if (!selectedMetric || !data.length) return;
        setLoading(true);
        setError(null);
        setResult(null);

        // Build historical values for the AI
        const values = data.slice(-200).map(r => Number(r[selectedMetric]) || 0);
        const labels = data.slice(-200).map((r, i) => r[stringCols[0]] || `Row ${i + 1}`);
        const stats = {
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            std: Math.sqrt(values.reduce((a, v) => a + Math.pow(v - (values.reduce((s, x) => s + x, 0) / values.length), 2), 0) / values.length),
            recentTrend: values.slice(-20),
            lastLabel: labels[labels.length - 1],
        };

        try {
            const res = await fetch(`${API_URL}/api/ai/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    metric: selectedMetric,
                    historicalValues: values.slice(-100),
                    historicalLabels: labels.slice(-100),
                    periods: forecastPeriods,
                    stats,
                    allMetrics: numericCols,
                })
            });
            if (!res.ok) throw new Error('Forecast service unavailable');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setResult(json);
        } catch (e: any) {
            setError(e.message || 'Failed to generate forecast');
        } finally {
            setLoading(false);
        }
    }, [selectedMetric, data, forecastPeriods, stringCols, numericCols, token]);

    const trendColor = result?.trend === 'up' ? '#34d399' : result?.trend === 'down' ? '#f87171' : '#94a3b8';

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
            {/* ── Header ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(59,130,246,0.1))',
                        border: '1px solid rgba(52,211,153,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <TrendingUp size={22} style={{ color: '#34d399' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #34d399, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Predictive Forecasting
                            </h2>
                            <span style={{
                                padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 900,
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                                background: 'rgba(52,211,153,0.15)', color: '#34d399',
                                border: '1px solid rgba(52,211,153,0.25)'
                            }}>Phase 3</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                            AI-powered time series forecasting with confidence intervals, trend detection, and risk analysis.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Controls ── */}
            <div style={{
                padding: 20, borderRadius: 16, marginBottom: 24,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34d399, #3b82f6, #8b5cf6)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                    {/* Metric select */}
                    <div style={{ flex: 2, minWidth: 200 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} /> Metric to Forecast
                        </label>
                        <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
                            <option value="">Choose a numeric column…</option>
                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Periods */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} /> Forecast Periods
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[5, 10, 15, 20, 30].map(p => (
                                <button key={p} onClick={() => setForecastPeriods(p)}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                                        border: forecastPeriods === p ? '1px solid #3b82f6' : '1px solid var(--border-default)',
                                        background: forecastPeriods === p ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
                                        color: forecastPeriods === p ? '#3b82f6' : 'var(--text-secondary)',
                                        fontSize: 12, fontWeight: 700,
                                    }}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Run button */}
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={runForecast}
                        disabled={loading || !selectedMetric}
                        style={{
                            padding: '10px 28px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #34d399, #3b82f6)',
                            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            opacity: !selectedMetric ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 20px rgba(52,211,153,0.25)',
                            whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                    >
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <BrainCircuit size={15} />}
                        {loading ? 'Forecasting…' : 'Generate Forecast'}
                    </motion.button>
                </div>
            </div>

            {/* ── Loading ── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.15)', borderTop: '3px solid #34d399' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['Analyzing historical patterns…', 'Detecting seasonality…', 'Training forecast model…', 'Computing confidence intervals…', 'Generating insights…'].map((s, i) => (
                                <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                                    {s}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error ── */}
            {error && !loading && (
                <div style={{ padding: 16, borderRadius: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                    <strong>Error:</strong> {error}
                    <button onClick={runForecast} style={{ display: 'block', marginTop: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Retry
                    </button>
                </div>
            )}

            {/* ── Results ── */}
            {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Trend', value: result.trend.toUpperCase(), icon: result.trend === 'up' ? ArrowUpRight : result.trend === 'down' ? ArrowDownRight : Minus, color: trendColor },
                            { label: 'Trend %', value: `${result.trendPct >= 0 ? '+' : ''}${result.trendPct.toFixed(1)}%`, icon: TrendingUp, color: trendColor },
                            { label: 'Model Accuracy', value: `${result.accuracy}%`, icon: Target, color: result.accuracy >= 80 ? '#34d399' : result.accuracy >= 60 ? '#fbbf24' : '#ef4444' },
                            { label: 'Seasonality', value: result.seasonality, icon: Calendar, color: '#8b5cf6' },
                        ].map((kpi, i) => (
                            <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                                style={{
                                    padding: '16px 18px', borderRadius: 14,
                                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />
                                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <kpi.icon size={11} style={{ color: kpi.color }} /> {kpi.label}
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)', color: kpi.color }}>{kpi.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div style={{
                        padding: '16px 18px', borderRadius: 16, marginBottom: 20,
                        background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(59,130,246,0.04))',
                        border: '1px solid rgba(52,211,153,0.12)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#34d399', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <Sparkles size={12} /> AI Forecast Summary
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{result.summary}</p>
                    </div>

                    {/* Forecast Chart */}
                    <div style={{
                        borderRadius: 18, marginBottom: 20, overflow: 'hidden',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        padding: '20px 16px 8px',
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={16} style={{ color: '#34d399' }} /> {selectedMetric} — Historical + Forecast
                        </h3>
                        <ResponsiveContainer width="100%" height={340}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                                <defs>
                                    <linearGradient id="fg-hist" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fg-pred" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fg-conf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.08} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="period" stroke="rgba(255,255,255,0.12)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} angle={-35} textAnchor="end" height={50} interval={Math.max(0, Math.floor(chartData.length / 15))} />
                                <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : v} />
                                <Tooltip content={<ForecastTooltip />} />
                                {/* Confidence band */}
                                <Area type="monotone" dataKey="upperBound" name="Upper Bound" stroke="none" fill="url(#fg-conf)" strokeWidth={0} dot={false} />
                                <Area type="monotone" dataKey="lowerBound" name="Lower Bound" stroke="rgba(52,211,153,0.15)" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                {/* Historical */}
                                <Area type="monotone" dataKey="actual" name="Historical" stroke="#818cf8" fill="url(#fg-hist)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#818cf8' }} />
                                {/* Forecast */}
                                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#34d399" fill="url(#fg-pred)" strokeWidth={2.5} strokeDasharray="6 3" dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#34d399' }} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Risks & Opportunities */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#ef4444', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <AlertTriangle size={12} /> Risks
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {result.risks.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>•</span> {r}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#34d399', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <Zap size={12} /> Opportunities
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {result.opportunities.map((o, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        <span style={{ color: '#34d399', fontWeight: 700, flexShrink: 0 }}>•</span> {o}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Methodology */}
                    <button onClick={() => setShowMethodology(p => !p)} style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                    }}>
                        <Info size={13} style={{ color: '#818cf8' }} />
                        Methodology & Assumptions
                        {showMethodology ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
                    </button>
                    <AnimatePresence>
                        {showMethodology && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '14px 16px', marginTop: 8, borderRadius: 12, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                    {result.methodology}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Empty state ── */}
            {!loading && !result && !error && (
                <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: 420 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 24,
                            background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(59,130,246,0.06))',
                            border: '1px solid rgba(52,211,153,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <TrendingUp size={36} style={{ color: '#34d399', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Forecast the Future</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Select a <strong style={{ color: '#34d399' }}>numeric metric</strong>, choose how many periods to predict, then click <strong>Generate Forecast</strong>. The AI will analyze trends, detect seasonality, and produce predictions with confidence intervals.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictiveForecasting;
