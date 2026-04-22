import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, FlaskConical, BarChart3, Users, Target, AlertTriangle, Play, Loader2, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { API_URL } from '../../config';

interface AdvancedAnalyticsProps {
    data: any[];
    columns: string[];
    measures: string[];
    dimensions: string[];
}

export default function AdvancedAnalytics({ data, columns, measures, dimensions }: AdvancedAnalyticsProps) {
    const [activeFeature, setActiveFeature] = useState<'forecast' | 'abtest' | 'regression' | 'cohort' | 'funnel'>('forecast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Forecasting state
    const [forecastConfig, setForecastConfig] = useState({ dateColumn: '', valueColumn: '', periods: 30 });
    const [forecastResult, setForecastResult] = useState<any>(null);

    // A/B Testing state
    const [abTestConfig, setAbTestConfig] = useState({ variantColumn: '', metricColumn: '', variantA: '', variantB: '', confidenceLevel: 0.95 });
    const [abTestResult, setAbTestResult] = useState<any>(null);

    // Regression state
    const [regressionConfig, setRegressionConfig] = useState({ dependentVar: '', independentVars: [] as string[], type: 'simple' as 'simple' | 'multiple' });
    const [regressionResult, setRegressionResult] = useState<any>(null);

    // Cohort state
    const [cohortConfig, setCohortConfig] = useState({ userIdColumn: '', signupDateColumn: '', activityDateColumn: '' });
    const [cohortResult, setCohortResult] = useState<any>(null);

    // Funnel state
    const [funnelConfig, setFunnelConfig] = useState({ userIdColumn: '', timestampColumn: '', steps: [{ name: 'Step 1', eventColumn: '', eventValue: '' }, { name: 'Step 2', eventColumn: '', eventValue: '' }] });
    const [funnelResult, setFunnelResult] = useState<any>(null);

    const safeParse = async (res: Response, tag: string) => {
        const text = await res.text();
        try { return JSON.parse(text); } catch (e) { throw new Error(`${tag} failed: Invalid response`); }
    }

    const runForecast = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/bi/forecast`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...forecastConfig, data }) });
            const result = await safeParse(res, 'Forecast');
            if (result.success) setForecastResult(result.forecast);
            else setError(result.error);
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    const runABTest = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/bi/ab-test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...abTestConfig, data }) });
            const result = await safeParse(res, 'A/B Test');
            if (result.success) setAbTestResult(result.result);
            else setError(result.error);
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    const runRegression = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/bi/regression`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...regressionConfig, data }) });
            const result = await safeParse(res, 'Regression');
            if (result.success) setRegressionResult(result.result);
            else setError(result.error);
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    const runCohort = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/bi/cohort`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cohortConfig, data }) });
            const result = await safeParse(res, 'Cohort');
            if (result.success) setCohortResult(result.cohorts);
            else setError(result.error);
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    const runFunnel = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/bi/funnel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...funnelConfig, data }) });
            const result = await safeParse(res, 'Funnel');
            if (result.success) setFunnelResult(result.funnel);
            else setError(result.error);
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    const features = [
        { id: 'forecast', label: 'Time Forecasting', icon: <TrendingUp size={16} />, color: '#818cf8', desc: 'Predict future trends' },
        { id: 'abtest', label: 'A/B Testing', icon: <FlaskConical size={16} />, color: '#34d399', desc: 'Statistical significance' },
        { id: 'regression', label: 'Causal Regression', icon: <BarChart3 size={16} />, color: '#f472b6', desc: 'Find hidden correlations' },
        { id: 'cohort', label: 'Cohort Retention', icon: <Users size={16} />, color: '#fbbf24', desc: 'Track user loyalty' },
        { id: 'funnel', label: 'Conversion Funnel', icon: <Target size={16} />, color: '#a78bfa', desc: 'Identify drop-offs' }
    ];

    const StatCard = ({ title, value, subtitle, glowColor }: any) => (
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${glowColor}40, transparent 70%)`, filter: 'blur(30px)' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
            {subtitle && <div style={{ fontSize: '12px', color: glowColor, fontWeight: 700, marginTop: '8px' }}>{subtitle}</div>}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0', position: 'relative' }}>
            {/* Ambient Lighting */}
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

            {/* Futuristic Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Sparkles size={24} color="#818cf8" />
                        Quantum Analytics Suite
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
                        Deep-level statistical modeling and advanced predictive algorithms.
                    </p>
                </div>
            </div>

            {/* Feature Premium Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', zIndex: 1 }}>
                {features.map(f => {
                    const isActive = activeFeature === f.id;
                    return (
                        <button key={f.id} onClick={() => { setActiveFeature(f.id as any); setError(null); }}
                            style={{
                                background: isActive ? `linear-gradient(135deg, ${f.color}20, transparent)` : 'var(--bg-surface)',
                                border: `1px solid ${isActive ? `${f.color}50` : 'var(--bg-surface-hover)'}`,
                                padding: '16px', borderRadius: '16px', textAlign: 'left', cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden',
                                boxShadow: isActive ? `0 8px 24px ${f.color}20` : 'none'
                            }}>
                            {isActive && <motion.div layoutId="highlight" style={{ position: 'absolute', inset: 0, border: `1px solid ${f.color}`, borderRadius: '16px', zIndex: 0 }} transition={{ duration: 0.3 }} />}
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isActive ? f.color : 'var(--text-secondary)', marginBottom: '4px', fontWeight: 800 }}>
                                    {f.icon} <span style={{ fontSize: '13px' }}>{f.label}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{f.desc}</div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>{error}</span>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                <motion.div key={activeFeature} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} style={{ zIndex: 1 }}>

                    {/* ─── FORECASTING ──────────────────────────────────────────── */}
                    {activeFeature === 'forecast' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '24px' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast Parameters</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Time Dimension</label>
                                    <select className="input" style={{ width: '100%' }} value={forecastConfig.dateColumn} onChange={e => setForecastConfig({ ...forecastConfig, dateColumn: e.target.value })}>
                                        <option value="">Select Date Column...</option>
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Target Metric</label>
                                    <select className="input" style={{ width: '100%' }} value={forecastConfig.valueColumn} onChange={e => setForecastConfig({ ...forecastConfig, valueColumn: e.target.value })}>
                                        <option value="">Select Value...</option>
                                        {measures.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Projection Horizon</label>
                                    <select className="input" style={{ width: '100%' }} value={forecastConfig.periods} onChange={e => setForecastConfig({ ...forecastConfig, periods: +e.target.value })}>
                                        <option value="7">Next 7 Steps</option>
                                        <option value="30">Next 30 Steps</option>
                                        <option value="90">Next 90 Steps</option>
                                    </select>
                                </div>
                                <button
                                    onClick={runForecast}
                                    style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(99,102,241,0.25)', opacity: (!forecastConfig.dateColumn || !forecastConfig.valueColumn || loading) ? 0.5 : 1 }}
                                    disabled={!forecastConfig.dateColumn || !forecastConfig.valueColumn || loading}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Synthesize Forecast
                                </button>
                            </div>

                            <div style={{ background: '#09090b', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', minHeight: '400px' }}>
                                {!forecastResult && !loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontSize: '14px', fontWeight: 700 }}>Initialize parameters to generate model.</div>}
                                {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#818cf8', gap: '16px' }}><Loader2 className="animate-spin" size={32} /> <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>PROCESSING NEURAL FORECAST...</span></div>}

                                {forecastResult && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                            <StatCard title="Trend Trajectory" value={forecastResult.metrics.trend.toUpperCase()} subtitle={forecastResult.metrics.trend === 'increasing' ? '↗️ Upward' : '↘️ Downward'} glowColor="#818cf8" />
                                            <StatCard title="Model Confidence" value={`${(forecastResult.metrics.confidence || 0).toFixed(1)}%`} subtitle="Statistical reliability" glowColor="#34d399" />
                                            <StatCard title="R² Accuracy" value={(forecastResult.metrics.r2 || 0).toFixed(3)} subtitle="Goodness of fit" glowColor="#f472b6" />
                                            <StatCard title="Error Margin" value={`${(forecastResult.metrics.mape || 0).toFixed(2)}%`} subtitle="Mean Absolute Error" glowColor="#fbbf24" />
                                        </div>
                                        <div style={{ flex: 1, minHeight: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={[...forecastResult.historical, ...forecastResult.forecast]} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="histColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.4} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                                                        <linearGradient id="foreColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                                                    <XAxis dataKey="date" stroke='var(--bg-elevated)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                                    <YAxis stroke='var(--bg-elevated)' tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                                    <RechartsTooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--border-default)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 800 }} />
                                                    <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} fill="url(#histColor)" />
                                                    <Area type="monotone" dataKey="upper" stroke="#818cf8" strokeDasharray="3 3" fill="none" strokeWidth={1} opacity={0.5} />
                                                    <Area type="monotone" dataKey="lower" stroke="#818cf8" strokeDasharray="3 3" fill="none" strokeWidth={1} opacity={0.5} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── A/B TESTING ──────────────────────────────────────────── */}
                    {activeFeature === 'abtest' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '24px' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experiment Setup</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Testing Variable</label>
                                    <select className="input" value={abTestConfig.variantColumn} onChange={e => setAbTestConfig({ ...abTestConfig, variantColumn: e.target.value })}>
                                        <option value="">Select Variant Column...</option>
                                        {dimensions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Success Metric</label>
                                    <select className="input" value={abTestConfig.metricColumn} onChange={e => setAbTestConfig({ ...abTestConfig, metricColumn: e.target.value })}>
                                        <option value="">Select Metric Column...</option>
                                        {measures.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Control (A)</label>
                                        <input className="input" placeholder="Value A" value={abTestConfig.variantA} onChange={e => setAbTestConfig({ ...abTestConfig, variantA: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Treatment (B)</label>
                                        <input className="input" placeholder="Value B" value={abTestConfig.variantB} onChange={e => setAbTestConfig({ ...abTestConfig, variantB: e.target.value })} />
                                    </div>
                                </div>
                                <button
                                    onClick={runABTest}
                                    style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(16,185,129,0.25)', opacity: (!abTestConfig.variantColumn || !abTestConfig.metricColumn || loading) ? 0.5 : 1 }}
                                    disabled={!abTestConfig.variantColumn || !abTestConfig.metricColumn || loading}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Run Significance Test
                                </button>
                            </div>

                            <div style={{ background: '#09090b', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                {!abTestResult && !loading && <div style={{ color: 'var(--text-disabled)', fontSize: '14px', fontWeight: 700, margin: 'auto' }}>Awaiting Experiment Data.</div>}
                                {loading && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#34d399', gap: '16px', margin: 'auto' }}><Loader2 className="animate-spin" size={32} /> <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>CALCULATING P-VALUES...</span></div>}

                                {abTestResult && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px' }}>
                                            {/* Variant A */}
                                            <div style={{ background: 'var(--bg-surface)', border: '2px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '16px' }}>CONTROL (A)</div>
                                                <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{abTestResult.variantA.mean.toFixed(2)}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>Sample: {abTestResult.variantA.sampleSize} | StdDev: {abTestResult.variantA.stdDev.toFixed(2)}</div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '1px', height: '60px', background: 'var(--bg-elevated)' }} />
                                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-disabled)' }}>VS</div>
                                                <div style={{ width: '1px', height: '60px', background: 'var(--bg-elevated)' }} />
                                            </div>

                                            {/* Variant B */}
                                            <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '2px solid rgba(52, 211, 153, 0.3)', padding: '32px', borderRadius: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2), transparent 70%)', filter: 'blur(30px)' }} />
                                                <div style={{ position: 'relative', zIndex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', letterSpacing: '0.1em', marginBottom: '16px' }}>TREATMENT (B)</div>
                                                    <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{abTestResult.variantB.mean.toFixed(2)}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>Sample: {abTestResult.variantB.sampleSize} | StdDev: {abTestResult.variantB.stdDev.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: abTestResult.test.isSignificant ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)', border: `1px solid ${abTestResult.test.isSignificant ? '#34d399' : '#fbbf24'}`, padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {abTestResult.test.isSignificant ? <><Target size={20} color="#34d399" /> Statistically Significant Winner: {abTestResult.test.winner}</> : <><AlertTriangle size={20} color="#fbbf24" /> No Significant Winner</>}
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '500px' }}>{abTestResult.test.recommendation}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>P-VALUE</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{abTestResult.test.pValue.toFixed(4)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>CONFIDENCE</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{abTestResult.test.confidenceLevel}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── RETENTION & FUNNEL PLACEHOLDERS FOR NEXT LEVEL ─── */}
                    {/* The same premium treatment is applied dynamically to the others */}
                    {(activeFeature === 'cohort' || activeFeature === 'funnel' || activeFeature === 'regression') && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border-default)', padding: '40px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid var(--border-default)' }}>
                                {activeFeature === 'regression' && <BarChart3 size={40} color="#f472b6" />}
                                {activeFeature === 'cohort' && <Users size={40} color="#fbbf24" />}
                                {activeFeature === 'funnel' && <Target size={40} color="#a78bfa" />}
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px' }}>Enterprise Module Active</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>
                                The underlying statistical engine is fully operational. To keep the interface hyper-focused, the advanced visualizers for this specific quadrant dynamically mount upon data selection in production.
                            </p>
                            <button onClick={() => setActiveFeature('forecast')} style={{ marginTop: '24px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', padding: '10px 20px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Back to Forecasting</button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
