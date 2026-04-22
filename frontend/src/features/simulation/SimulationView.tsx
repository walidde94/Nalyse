import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Cell, ComposedChart, Line, LineChart as RLineChart
} from 'recharts';
import {
    Cpu, Target, Brain, Zap, BarChart3, Activity, Layers, RefreshCw, CheckCircle2,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Shield, AlertTriangle,
    Sparkles, DollarSign, Settings2, Play, ChevronRight, Award,
    Lightbulb, Gauge, FlaskConical, GitCompareArrows
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import {
    type SimulationResult, type SimulationInput, type Product, type ScenarioAdjustment,
    SCENARIO_PRESETS, SIM_COLORS, fmt, fmtCurrency, fmtPct,
    extractProductsFromData, extractMaterialsFromData, runFullSimulation,
} from './simulationHelpers';

/* ─── Shared Sub-components ──────────────────────────────── */
const Spark = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`ss-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient></defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#ss-${color.replace('#', '')})`} />
        </svg>
    );
};

const ScoreRing = ({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
    const clamped = Math.min(Math.max(value, 0), 100);
    const offset = circ - (clamped / 100) * circ;
    const color = value >= 70 ? '#34d399' : value >= 40 ? '#fbbf24' : '#f87171';
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke='var(--border-default)' strokeWidth={stroke} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }} strokeLinecap="round" />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color}
                fontSize="18" fontWeight="800" fontFamily="var(--font-mono)" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {Math.round(value)}
            </text>
        </svg>
    );
};

const SimTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-default)', padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)', minWidth: '180px', color: 'var(--text-primary)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', color: p.color || '#94a3b8', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{typeof p.value === 'number' ? fmtCurrency(p.value) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

const RiskBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = { low: '#34d399', medium: '#fbbf24', high: '#fb923c', critical: '#f87171' };
    const c = colors[level] || '#94a3b8';
    return <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: c, background: `${c}15`, border: `1px solid ${c}30` }}>{level}</span>;
};

const LOAD_STEPS = ['Parsing input data…', 'Running profit simulation…', 'Optimizing product mix…', 'Executing Monte Carlo (5K iterations)…', 'Modeling scenarios…', 'Running sensitivity analysis…', 'Generating AI recommendations…', 'Building executive summary…'];

/* ═══════════════════════════════════════════════════════════ */
interface Props { files: { id: string; filename: string; size: number; createdAt: string; originalName?: string }[]; token: string; }

export const SimulationView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const [selectedFileId, setSelectedFileId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'scenarios' | 'montecarlo' | 'forecast' | 'sensitivity' | 'recommendations'>('overview');
    const [selectedScenario, setSelectedScenario] = useState(0);

    // Configurable simulation parameters
    const [overheadRate, setOverheadRate] = useState(8);
    const [taxRate, setTaxRate] = useState(21);
    const [laborCost, setLaborCost] = useState(2.5);
    const [mcIterations, setMcIterations] = useState(10000);
    const [showParams, setShowParams] = useState(false);
    const [productPage, setProductPage] = useState(0);
    const PRODUCTS_PER_PAGE = 20;

    // Scenario slider state
    const [customPrice, setCustomPrice] = useState(0);
    const [customDemand, setCustomDemand] = useState(0);
    const [customCost, setCustomCost] = useState(0);

    const parseCSVText = useCallback((text: string): Record<string, any>[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim());
            const row: Record<string, any> = {};
            headers.forEach((h, i) => { row[h] = vals[i] || ''; });
            return row;
        });
    }, []);

    const loadTestData = useCallback(async () => {
        setLoading(true); setLoadStep(0); setResult(null);
        try {
            setLoadStep(0);
            const res = await fetch('/test_data/simulation_test_data.csv');
            if (!res.ok) throw new Error('Test data file not found');
            const text = await res.text();
            const data = parseCSVText(text);
            if (!data.length) throw new Error('No data parsed from test file');
            setLoadStep(1);
            await new Promise(r => setTimeout(r, 150));
            const products = extractProductsFromData(data);
            const materials = extractMaterialsFromData(data);
            setLoadStep(2); await new Promise(r => setTimeout(r, 150));
            setLoadStep(3); await new Promise(r => setTimeout(r, 100));

            const input: SimulationInput = {
                products, materials, scenarios: SCENARIO_PRESETS,
                overheadRate, taxRate, laborCostPerUnit: laborCost, monteCarloIterations: mcIterations,
            };
            setLoadStep(4); await new Promise(r => setTimeout(r, 100));
            const simResult = runFullSimulation(input);
            setLoadStep(5); await new Promise(r => setTimeout(r, 100));
            setLoadStep(6); await new Promise(r => setTimeout(r, 100));
            setLoadStep(7); await new Promise(r => setTimeout(r, 100));
            setResult(simResult);
            addToast(`Simulation complete — ${products.length} products from test dataset`, 'success');
        } catch (e: any) { addToast(e.message || 'Failed to load test data', 'error'); }
        finally { setLoading(false); }
    }, [addToast, overheadRate, taxRate, laborCost, mcIterations, parseCSVText]);

    const runSim = useCallback(async () => {
        setLoading(true); setLoadStep(0); setResult(null);
        try {
            let products: Product[];
            let materials: any[];

            if (!selectedFileId) {
                addToast('Select a dataset or load test data first', 'warning');
                setLoading(false);
                return;
            }

            setLoadStep(0);
            const res = await fetch(`${API_URL}/api/files/${selectedFileId}/analyze`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                if (errorBody.error === 'FILE_NOT_FOUND' || res.status === 422) {
                    throw new Error(errorBody.message || 'Dataset file is missing. Please re-upload from the Dashboard.');
                }
                throw new Error(errorBody.error || 'Failed to load dataset');
            }
            const analysis = await res.json();
            const data = analysis.sampleData || [];
            if (!data.length) throw new Error('No data found in dataset — upload a CSV with product/pricing columns');
            products = extractProductsFromData(data);
            materials = extractMaterialsFromData(data);

            for (let i = 1; i <= 6; i++) { setLoadStep(i); await new Promise(r => setTimeout(r, 200)); }

            const input: SimulationInput = {
                products, materials, scenarios: SCENARIO_PRESETS,
                overheadRate, taxRate, laborCostPerUnit: laborCost, monteCarloIterations: mcIterations,
            };

            const simResult = runFullSimulation(input);
            setLoadStep(7); await new Promise(r => setTimeout(r, 150));
            setResult(simResult);
            addToast(`Simulation complete — ${products.length} products analyzed`, 'success');
        } catch (e: any) { addToast(e.message || 'Simulation failed', 'error'); }
        finally { setLoading(false); }
    }, [selectedFileId, token, addToast, overheadRate, taxRate, laborCost, mcIterations]);

    /* ─── Derived chart data ─────────────────────────────── */
    const profitHeatmap = useMemo(() => result?.baseline.products.map(p => ({
        name: p.productName.length > 14 ? p.productName.slice(0, 14) + '…' : p.productName,
        Revenue: Math.round(p.revenue), Cost: Math.round(p.variableCost + p.fixedCost + p.laborCost + p.overheadCost),
        Profit: Math.round(p.netProfit), Margin: Math.round(p.netMargin * 10) / 10,
    })) || [], [result]);

    const scenarioCompare = useMemo(() => result?.scenarios.map(s => ({
        name: s.scenario.name, Revenue: Math.round(s.totalRevenue), Cost: Math.round(s.totalCost),
        Profit: Math.round(s.totalProfit), color: s.scenario.color,
    })) || [], [result]);

    const forecastChart = useMemo(() => result?.forecast.map(f => ({
        name: f.period, Revenue: Math.round(f.revenue), Cost: Math.round(f.cost),
        Profit: Math.round(f.profit), Upper: Math.round(f.upper), Lower: Math.round(f.lower),
        isProjected: f.isProjected,
    })) || [], [result]);

    const sensitivityChart = useMemo(() => result?.sensitivity.map(s => ({
        factor: s.factor, low: Math.round(s.lowProfit), high: Math.round(s.highProfit), base: Math.round(s.baseProfit),
        range: Math.round(s.highProfit - s.lowProfit),
    })) || [], [result]);

    const radarData = useMemo(() => {
        if (!result) return [];
        const bp = result.baseline.products;
        const avgMargin = bp.reduce((s, p) => s + p.grossMargin, 0) / bp.length;
        const avgUtil = bp.reduce((s, p) => s + p.capacityUtilization, 0) / bp.length;
        const optImprove = result.optimization.improvementPct;
        const riskScore = 100 - result.monteCarlo.probabilityOfLoss;
        const diversity = Math.min(100, bp.filter(p => p.netProfit > 0).length / bp.length * 100);
        return [
            { metric: 'Margin', value: Math.min(avgMargin, 100), fullMark: 100 },
            { metric: 'Utilization', value: avgUtil, fullMark: 100 },
            { metric: 'Opt. Gain', value: Math.min(optImprove * 2, 100), fullMark: 100 },
            { metric: 'Stability', value: riskScore, fullMark: 100 },
            { metric: 'Diversity', value: diversity, fullMark: 100 },
            { metric: 'Confidence', value: Math.min(100, (1 - result.monteCarlo.stdDev / Math.abs(result.monteCarlo.mean || 1)) * 100), fullMark: 100 },
        ];
    }, [result]);

    const hasResults = !loading && result;

    // ─────────────────── RENDER ──────────────────────────────
    return (
        <div id="simulation-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>

            {/* ─── Header ───────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(251,191,36,0.2))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FlaskConical size={24} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #fbbf24 50%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AI Decision Simulation Engine
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Profit Simulation · Optimization · Monte Carlo · Scenario Modeling · AI Recommendations
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Control Panel ─────────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #fbbf24, #34d399)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Cpu size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Simulation Configuration</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setShowParams(!showParams)}
                        style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: showParams ? 'rgba(129,140,248,0.1)' : 'transparent', color: showParams ? '#818cf8' : 'var(--text-muted)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Settings2 size={12} /> Parameters
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '260px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }} /> Data Source
                        </label>
                        <select value={selectedFileId} onChange={e => { setSelectedFileId(e.target.value); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFileId ? '#818cf844' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="">Choose dataset…</option>
                            {files.map(f => <option key={f.id} value={f.id}>{(f as any).originalName || f.filename}</option>)}
                        </select>
                    </div>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={loadTestData}
                        style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' as any, flexShrink: 0 }}>
                        <Layers size={14} /> Test Data (100 Products)
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={runSim}
                        disabled={loading || !selectedFileId}
                        style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #818cf8, #34d399)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: !selectedFileId ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(129,140,248,0.25)', whiteSpace: 'nowrap' as any, flexShrink: 0 }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                        {loading ? 'Simulating…' : 'Run Simulation'}
                    </motion.button>
                </div>
                {/* Expandable Parameters */}
                <AnimatePresence>
                    {showParams && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                {[
                                    { label: 'Overhead Rate', val: overheadRate, set: setOverheadRate, unit: '%', min: 0, max: 30, step: 0.5 },
                                    { label: 'Tax Rate', val: taxRate, set: setTaxRate, unit: '%', min: 0, max: 50, step: 1 },
                                    { label: 'Labor $/Unit', val: laborCost, set: setLaborCost, unit: '$', min: 0, max: 50, step: 0.5 },
                                    { label: 'MC Iterations', val: mcIterations, set: setMcIterations, unit: '', min: 1000, max: 50000, step: 1000 },
                                ].map(p => (
                                    <div key={p.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.label}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#818cf8' }}>{p.unit === '$' ? `$${p.val}` : p.unit ? `${p.val}${p.unit}` : fmt(p.val)}</span>
                                        </div>
                                        <input type="range" min={p.min} max={p.max} step={p.step} value={p.val}
                                            onChange={e => p.set(parseFloat(e.target.value))}
                                            style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', background: 'var(--border-default)', cursor: 'pointer', accentColor: '#818cf8' }} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Loading ───────────────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid rgba(129,140,248,0.15)', borderTop: '3px solid #818cf8' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '320px' }}>
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
            {hasResults && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                    {/* ─── Executive Summary ──────────────────────────── */}
                    <div style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(129,140,248,0.06), rgba(52,211,153,0.06))', border: '1px solid rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <ScoreRing value={Math.min(100, result.baseline.netMargin * 3)} />
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <Brain size={16} style={{ color: '#818cf8' }} />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Executive Summary</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.executiveSummary}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexShrink: 0, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Revenue', val: fmtCurrency(result.baseline.totalRevenue), color: '#818cf8' },
                                { label: 'Profit', val: fmtCurrency(result.baseline.totalProfit), color: result.baseline.totalProfit >= 0 ? '#34d399' : '#f87171' },
                                { label: 'Margin', val: `${result.baseline.netMargin.toFixed(1)}%`, color: result.baseline.netMargin > 10 ? '#34d399' : '#fbbf24' },
                                { label: 'Opt. Gain', val: `+${result.optimization.improvementPct.toFixed(1)}%`, color: '#a78bfa' },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section Tabs ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {([
                            { id: 'overview' as const, label: 'Profit Analysis', icon: <Target size={14} />, count: result.baseline.products.length },
                            { id: 'scenarios' as const, label: 'Scenario Modeling', icon: <GitCompareArrows size={14} />, count: result.scenarios.length },
                            { id: 'montecarlo' as const, label: 'Monte Carlo', icon: <Activity size={14} /> },
                            { id: 'forecast' as const, label: 'Forecast', icon: <TrendingUp size={14} /> },
                            { id: 'sensitivity' as const, label: 'Sensitivity', icon: <Gauge size={14} /> },
                            { id: 'recommendations' as const, label: 'AI Insights', icon: <Lightbulb size={14} />, count: result.recommendations.length },
                        ]).map(tab => (
                            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: activeSection === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: activeSection === tab.id ? 'var(--primary-subtle)' : 'var(--bg-secondary)', color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                                {tab.icon} {tab.label}
                                {tab.count !== undefined && <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* ─── OVERVIEW ──────────────────────────────────── */}
                    {activeSection === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* KPI Cards with pagination */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                                {result.baseline.products.slice(productPage * PRODUCTS_PER_PAGE, (productPage + 1) * PRODUCTS_PER_PAGE).map((p, i) => (
                                    <motion.div key={p.productId} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                                        style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${p.netProfit >= 0 ? '#34d399' : '#f87171'}, transparent)` }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</span>
                                            <RiskBadge level={p.netMargin > 15 ? 'low' : p.netMargin > 5 ? 'medium' : p.netMargin > 0 ? 'high' : 'critical'} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>NET PROFIT</div>
                                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: p.netProfit >= 0 ? '#34d399' : '#f87171' }}>{fmtCurrency(p.netProfit)}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>MARGIN</div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p.netMargin.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                        <div style={{ height: '3px', borderRadius: '2px', background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, p.capacityUtilization)}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.04 }}
                                                style={{ height: '100%', borderRadius: '2px', background: p.capacityUtilization > 85 ? '#f87171' : p.capacityUtilization > 60 ? '#fbbf24' : '#34d399' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                            <span>Capacity: {p.capacityUtilization.toFixed(0)}%</span>
                                            <span>Revenue: {fmtCurrency(p.revenue)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Pagination */}
                            {result.baseline.products.length > PRODUCTS_PER_PAGE && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                    {Array.from({ length: Math.ceil(result.baseline.products.length / PRODUCTS_PER_PAGE) }, (_, i) => (
                                        <button key={i} onClick={() => setProductPage(i)}
                                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: productPage === i ? '1px solid #818cf8' : '1px solid var(--border-default)', background: productPage === i ? 'rgba(129,140,248,0.15)' : 'var(--bg-secondary)', color: productPage === i ? '#818cf8' : 'var(--text-muted)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{i + 1}</button>
                                    ))}
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{result.baseline.products.length} products total</span>
                                </div>
                            )}
                            {/* Revenue vs Cost vs Profit Chart */}
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={16} style={{ color: '#818cf8' }} /> Product Revenue, Cost & Profit Breakdown</h3>
                                <ResponsiveContainer width="100%" height={360}>
                                    <BarChart data={profitHeatmap.slice(0, 20)} margin={{ top: 8, right: 16, left: 8, bottom: 44 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                        <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 9 }} angle={-35} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                                        <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                                        <Tooltip content={<SimTooltip />} />
                                        <Bar dataKey="Revenue" fill="#818cf8" radius={[4, 4, 0, 0]} opacity={0.8} />
                                        <Bar dataKey="Cost" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.6} />
                                        <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>{profitHeatmap.slice(0, 20).map((d, i) => <Cell key={i} fill={d.Profit >= 0 ? '#34d399' : '#fb923c'} opacity={0.7} />)}</Bar>
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── SCENARIOS ─────────────────────────────────── */}
                    {activeSection === 'scenarios' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                {result.scenarios.map((sr, i) => (
                                    <motion.div key={sr.scenario.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedScenario(i)}
                                        style={{ padding: '16px', borderRadius: '12px', background: selectedScenario === i ? `${sr.scenario.color}12` : 'var(--bg-secondary)', border: `1px solid ${selectedScenario === i ? sr.scenario.color + '50' : 'var(--border-default)'}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: sr.scenario.color }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: sr.scenario.color }}>{sr.scenario.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {sr.rank === 1 && <Award size={14} style={{ color: '#fbbf24' }} />}
                                                <RiskBadge level={sr.riskLevel} />
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '10px', lineHeight: 1.4 }}>{sr.scenario.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>PROFIT</div><div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sr.totalProfit >= 0 ? '#34d399' : '#f87171' }}>{fmtCurrency(sr.totalProfit)}</div></div>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Δ PROFIT</div><div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sr.deltaProfit >= 0 ? '#34d399' : '#f87171' }}>{fmtPct(sr.deltaProfitPct)}</div></div>
                                            <div><div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700 }}>RANK</div><div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sr.scenario.color }}>#{sr.rank}</div></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><GitCompareArrows size={16} style={{ color: '#fbbf24' }} /> Scenario Profit Comparison</h3>
                                <ResponsiveContainer width="100%" height={360}>
                                    <BarChart data={scenarioCompare} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                        <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                                        <Tooltip content={<SimTooltip />} />
                                        <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>{scenarioCompare.map((d, i) => <Cell key={i} fill={d.color} opacity={0.8} />)}</Bar>
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── MONTE CARLO ──────────────────────────────── */}
                    {activeSection === 'montecarlo' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { label: 'Mean Profit', val: fmtCurrency(result.monteCarlo.mean), color: '#818cf8' },
                                    { label: 'Median', val: fmtCurrency(result.monteCarlo.median), color: '#34d399' },
                                    { label: 'Std Dev', val: fmtCurrency(result.monteCarlo.stdDev), color: '#fbbf24' },
                                    { label: 'P5 (Downside)', val: fmtCurrency(result.monteCarlo.p5), color: '#f87171' },
                                    { label: 'P95 (Upside)', val: fmtCurrency(result.monteCarlo.p95), color: '#34d399' },
                                    { label: 'VaR (95%)', val: fmtCurrency(result.monteCarlo.var95), color: '#fb923c' },
                                    { label: 'CVaR', val: fmtCurrency(result.monteCarlo.cvar95), color: '#f472b6' },
                                    { label: 'Loss Prob.', val: `${result.monteCarlo.probabilityOfLoss.toFixed(1)}%`, color: result.monteCarlo.probabilityOfLoss > 15 ? '#f87171' : '#34d399' },
                                ].map((s, i) => (
                                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.val}</div>
                                    </motion.div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                                <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} style={{ color: '#818cf8' }} /> Profit Distribution (5K Simulations)</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={result.monteCarlo.distribution} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                            <XAxis dataKey="bucket" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-disabled)', fontSize: 8 }} axisLine={false} tickLine={false} interval={4} />
                                            <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<SimTooltip />} />
                                            <Bar dataKey="count" name="Frequency" radius={[3, 3, 0, 0]}>{result.monteCarlo.distribution.map((d, i) => <Cell key={i} fill={d.cumulative < 5 ? '#f87171' : d.cumulative < 25 ? '#fb923c' : d.cumulative < 75 ? '#818cf8' : '#34d399'} opacity={0.7} />)}</Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} style={{ color: '#fbbf24' }} /> Multi-Dimensional Health</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke='var(--border-default)' />
                                            <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                            <Radar name="Score" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} />
                                            <Tooltip content={<SimTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── FORECAST ─────────────────────────────────── */}
                    {activeSection === 'forecast' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} style={{ color: '#818cf8' }} /> 12-Month Revenue & Profit Forecast</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={forecastChart} margin={{ top: 8, right: 16, left: 8, bottom: 36 }}>
                                        <defs>
                                            <linearGradient id="simFcBand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.12} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' vertical={false} />
                                        <XAxis dataKey="name" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                                        <Tooltip content={<SimTooltip />} />
                                        <Area type="monotone" dataKey="Upper" stroke="none" fill="rgba(129,140,248,0.08)" />
                                        <Area type="monotone" dataKey="Lower" stroke="none" fill="rgba(129,140,248,0.04)" />
                                        <Line type="monotone" dataKey="Revenue" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                                        <Line type="monotone" dataKey="Profit" stroke="#34d399" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="Cost" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── SENSITIVITY ──────────────────────────────── */}
                    {activeSection === 'sensitivity' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Gauge size={16} style={{ color: '#fb923c' }} /> Sensitivity Analysis (Tornado Chart)</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={sensitivityChart} layout="vertical" margin={{ top: 8, right: 16, left: 90, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface)' horizontal={false} />
                                        <XAxis type="number" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                                        <YAxis type="category" dataKey="factor" stroke='var(--text-disabled)' tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={85} />
                                        <Tooltip content={<SimTooltip />} />
                                        <Bar dataKey="low" name="Low Scenario" fill="#f87171" opacity={0.7} radius={[4, 0, 0, 4]} />
                                        <Bar dataKey="high" name="High Scenario" fill="#34d399" opacity={0.7} radius={[0, 4, 4, 0]} />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                {result.sensitivity.map((s, i) => (
                                    <motion.div key={s.factor} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{s.factor}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>ε = {s.elasticity.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                            <span style={{ color: '#f87171' }}>Low: {fmtCurrency(s.lowProfit)}</span>
                                            <span>Base: {fmtCurrency(s.baseProfit)}</span>
                                            <span style={{ color: '#34d399' }}>High: {fmtCurrency(s.highProfit)}</span>
                                        </div>
                                        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-surface-hover)', marginTop: '8px', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.abs(s.elasticity) * 100)}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.06 }}
                                                style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #f87171, #fbbf24, #34d399)' }} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RECOMMENDATIONS ───────────────────────────── */}
                    {activeSection === 'recommendations' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {result.recommendations.map((rec, i) => {
                                    const sevColors: Record<string, string> = { info: '#38bdf8', warning: '#fbbf24', critical: '#f87171', success: '#34d399' };
                                    const c = sevColors[rec.severity] || '#94a3b8';
                                    return (
                                        <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            style={{ padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)', border: `1px solid ${c}20`, position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${c}, transparent)` }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${c}15`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {rec.type === 'scale' ? <TrendingUp size={16} style={{ color: c }} /> : rec.type === 'alert' ? <AlertTriangle size={16} style={{ color: c }} /> : rec.type === 'discontinue' ? <TrendingDown size={16} style={{ color: c }} /> : rec.type === 'pricing' ? <DollarSign size={16} style={{ color: c }} /> : <Target size={16} style={{ color: c }} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{rec.title}</span>
                                                        <RiskBadge level={rec.severity} />
                                                        {rec.confidence && <span style={{ fontSize: '9px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{rec.confidence}% conf</span>}
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rec.category}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '44px', marginBottom: '8px' }}>{rec.description}</p>
                                            <div style={{ paddingLeft: '44px', fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>
                                                <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} /> Impact: {rec.impact}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                </motion.div>
            )}

            {/* ─── Empty State ───────────────────────────────────── */}
            {!loading && !result && (
                <div style={{ padding: '100px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '520px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FlaskConical size={40} style={{ color: '#818cf8', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>AI Decision Simulation Engine</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Select an uploaded dataset with <strong style={{ color: '#818cf8' }}>product, pricing, and cost data</strong> and click <strong style={{ color: '#34d399' }}>Run Simulation</strong>, or load the built-in <strong style={{ color: '#34d399' }}>100-product test dataset</strong> to run a full profitability analysis with Monte Carlo risk modeling, scenario comparison, and AI-powered optimization.
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '12px', lineHeight: 1.6 }}>
                            Configurable parameters: overhead rate, tax rate, labor cost per unit, Monte Carlo iterations (up to 50K). Click <strong>Parameters</strong> in the control panel to adjust.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                            {['Profit Simulation', 'LP Optimization', 'Monte Carlo', 'Scenario Modeling', 'Sensitivity', 'AI Insights', '10K+ Iterations', 'Configurable Params'].map(tag => (
                                <span key={tag} style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationView;
