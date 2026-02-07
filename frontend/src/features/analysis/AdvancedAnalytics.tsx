import { useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, FlaskConical, BarChart3, Users, Target, AlertTriangle, Play, Loader2 } from 'lucide-react';

interface AdvancedAnalyticsProps {
    data: any[];
    columns: string[];
    measures: string[];
    dimensions: string[];
}

import { API_URL } from '../../config';

export default function AdvancedAnalytics({ data, columns, measures, dimensions }: AdvancedAnalyticsProps) {
    const [activeFeature, setActiveFeature] = useState<'forecast' | 'abtest' | 'regression' | 'cohort' | 'funnel'>('forecast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Forecasting state
    const [forecastConfig, setForecastConfig] = useState({
        dateColumn: '',
        valueColumn: '',
        periods: 30
    });
    const [forecastResult, setForecastResult] = useState<any>(null);

    // A/B Testing state
    const [abTestConfig, setAbTestConfig] = useState({
        variantColumn: '',
        metricColumn: '',
        variantA: '',
        variantB: '',
        confidenceLevel: 0.95
    });
    const [abTestResult, setAbTestResult] = useState<any>(null);

    // Regression state
    const [regressionConfig, setRegressionConfig] = useState({
        dependentVar: '',
        independentVars: [] as string[],
        type: 'simple' as 'simple' | 'multiple'
    });
    const [regressionResult, setRegressionResult] = useState<any>(null);

    // Cohort state
    const [cohortConfig, setCohortConfig] = useState({
        userIdColumn: '',
        signupDateColumn: '',
        activityDateColumn: ''
    });
    const [cohortResult, setCohortResult] = useState<any>(null);

    // Funnel state
    const [funnelConfig, setFunnelConfig] = useState({
        userIdColumn: '',
        timestampColumn: '',
        steps: [
            { name: 'Step 1', eventColumn: '', eventValue: '' },
            { name: 'Step 2', eventColumn: '', eventValue: '' }
        ]
    });
    const [funnelResult, setFunnelResult] = useState<any>(null);

    // Run Forecast
    const runForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending forecast request:', { ...forecastConfig, dataLength: data.length });

            const response = await fetch(`${API_URL}/api/bi/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...forecastConfig, data })
            });

            console.log('Response status:', response.status);
            const text = await response.text();
            console.log('Response text:', text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
            }

            if (result.success) {
                setForecastResult(result.forecast);
            } else {
                setError(result.error || 'Unknown error occurred');
            }
        } catch (err: any) {
            console.error('Forecast error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run A/B Test
    const runABTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/bi/ab-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...abTestConfig, data })
            });
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
            }
            if (result.success) {
                setAbTestResult(result.result);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run Regression
    const runRegression = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending regression request:', { ...regressionConfig, dataLength: data.length });
            const response = await fetch(`${API_URL}/api/bi/regression`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...regressionConfig, data })
            });

            const text = await response.text();
            console.log('Regression response:', text);
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
            }

            if (result.success) {
                setRegressionResult(result.result);
            } else {
                setError(result.error || 'Unknown error occurred');
            }
        } catch (err: any) {
            console.error('Regression error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run Cohort Analysis
    const runCohort = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending cohort request:', { ...cohortConfig, dataLength: data.length });
            const response = await fetch(`${API_URL}/api/bi/cohort`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cohortConfig, data })
            });

            const text = await response.text();
            console.log('Cohort response:', text);
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
            }

            if (result.success) {
                setCohortResult(result.cohorts);
            } else {
                setError(result.error || 'Unknown error occurred');
            }
        } catch (err: any) {
            console.error('Cohort error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run Funnel Analysis
    const runFunnel = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending funnel request:', { ...funnelConfig, dataLength: data.length });
            const response = await fetch(`${API_URL}/api/bi/funnel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...funnelConfig, data })
            });

            const text = await response.text();
            console.log('Funnel response:', text);
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
            }

            if (result.success) {
                setFunnelResult(result.funnel);
            } else {
                setError(result.error || 'Unknown error occurred');
            }
        } catch (err: any) {
            console.error('Funnel error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { id: 'forecast', label: 'Forecasting', icon: <TrendingUp size={18} /> },
        { id: 'abtest', label: 'A/B Testing', icon: <FlaskConical size={18} /> },
        { id: 'regression', label: 'Regression', icon: <BarChart3 size={18} /> },
        { id: 'cohort', label: 'Cohort Analysis', icon: <Users size={18} /> },
        { id: 'funnel', label: 'Funnel Analysis', icon: <Target size={18} /> }
    ];

    return (
        <div className="flex-col gap-6 fade-in">
            {/* Feature Selector */}
            <div className="card">
                <h3 className="text-h3 mb-4">Advanced Analytics</h3>
                <div className="flex gap-3 flex-wrap">
                    {features.map(feature => (
                        <button
                            key={feature.id}
                            className={activeFeature === feature.id ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setActiveFeature(feature.id as any)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>{feature.icon}</span>
                            {feature.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)' }}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-danger" />
                        <span style={{ color: 'var(--danger)' }}>{error}</span>
                    </div>
                </div>
            )}

            {/* Forecasting Panel */}
            {activeFeature === 'forecast' && (
                <div className="card">
                    <h4 className="text-h3 mb-4 flex items-center gap-2"><TrendingUp size={24} /> Time Series Forecasting</h4>
                    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Date Column</label>
                            <select
                                className="input"
                                value={forecastConfig.dateColumn}
                                onChange={(e) => setForecastConfig((prev: any) => ({ ...prev, dateColumn: e.target.value }))}
                            >
                                <option value="">Select column...</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Value Column</label>
                            <select
                                className="input"
                                value={forecastConfig.valueColumn}
                                onChange={(e) => setForecastConfig((prev: any) => ({ ...prev, valueColumn: e.target.value }))}
                            >
                                <option value="">Select column...</option>
                                {measures.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Forecast Period</label>
                            <select
                                className="input"
                                value={forecastConfig.periods}
                                onChange={(e) => setForecastConfig((prev: any) => ({ ...prev, periods: parseInt(e.target.value) }))}
                            >
                                <option value="7">7 days</option>
                                <option value="30">30 days</option>
                                <option value="90">90 days</option>
                            </select>
                        </div>
                    </div>
                    <button
                        className="btn-primary mt-4"
                        onClick={runForecast}
                        disabled={loading || !forecastConfig.dateColumn || !forecastConfig.valueColumn}
                    >
                        {loading ? 'Generating...' : 'Generate Forecast'}
                    </button>

                    {forecastResult && (
                        <div className="mt-6">
                            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                                <div className="card" style={{ background: 'var(--bg-surface)' }}>
                                    <span className="text-sm">Trend</span>
                                    <div className="text-h2">{forecastResult.metrics.trend === 'increasing' ? '↗️' : forecastResult.metrics.trend === 'decreasing' ? '↘️' : '➡️'} {forecastResult.metrics.trend}</div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-surface)' }}>
                                    <span className="text-sm">Confidence</span>
                                    <div className="text-h2">{(forecastResult.metrics.confidence ?? 0).toFixed(1)}%</div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-surface)' }}>
                                    <span className="text-sm">R²</span>
                                    <div className="text-h2">{(forecastResult.metrics.r2 ?? 0).toFixed(3)}</div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-surface)' }}>
                                    <span className="text-sm">MAPE</span>
                                    <div className="text-h2">{(forecastResult.metrics.mape ?? 0).toFixed(2)}%</div>
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={[...forecastResult.historical, ...forecastResult.forecast]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="transparent"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="transparent"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} fill="url(#colorValue)" />
                                    <Area type="monotone" dataKey="upper" stroke="#818cf8" strokeDasharray="5 5" fill="none" strokeWidth={2} />
                                    <Area type="monotone" dataKey="lower" stroke="#f472b6" strokeDasharray="5 5" fill="none" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* A/B Testing Panel */}
            {activeFeature === 'abtest' && (
                <div className="card">
                    <h4 className="text-h3 mb-4 flex items-center gap-2"><FlaskConical size={24} /> A/B Test Analysis</h4>
                    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Variant Column</label>
                            <select
                                className="input"
                                value={abTestConfig.variantColumn}
                                onChange={(e) => setAbTestConfig((prev: any) => ({ ...prev, variantColumn: e.target.value }))}
                            >
                                <option value="">Select column...</option>
                                {dimensions.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Metric Column</label>
                            <select
                                className="input"
                                value={abTestConfig.metricColumn}
                                onChange={(e) => setAbTestConfig((prev: any) => ({ ...prev, metricColumn: e.target.value }))}
                            >
                                <option value="">Select column...</option>
                                {measures.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Variant A Value</label>
                            <input
                                type="text"
                                className="input"
                                value={abTestConfig.variantA}
                                onChange={(e) => setAbTestConfig((prev: any) => ({ ...prev, variantA: e.target.value }))}
                                placeholder="e.g., Control"
                            />
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-sm font-medium">Variant B Value</label>
                            <input
                                type="text"
                                className="input"
                                value={abTestConfig.variantB}
                                onChange={(e) => setAbTestConfig((prev: any) => ({ ...prev, variantB: e.target.value }))}
                                placeholder="e.g., Treatment"
                            />
                        </div>
                    </div>
                    <button
                        className="btn-primary mt-4"
                        onClick={runABTest}
                        disabled={loading || !abTestConfig.variantColumn || !abTestConfig.metricColumn}
                    >
                        {loading ? 'Running Test...' : 'Run A/B Test'}
                    </button>

                    {abTestResult && (
                        <div className="mt-6">
                            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="card" style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-default)' }}>
                                    <h5 className="text-h3 mb-2">Variant A: {abTestResult.variantA.name}</h5>
                                    <div className="text-h1 font-mono">{abTestResult.variantA.mean.toFixed(2)}</div>
                                    <div className="text-sm mt-2">Sample Size: {abTestResult.variantA.sampleSize}</div>
                                    <div className="text-sm">Std Dev: {abTestResult.variantA.stdDev.toFixed(2)}</div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-surface)', border: '2px solid var(--primary)' }}>
                                    <h5 className="text-h3 mb-2">Variant B: {abTestResult.variantB.name}</h5>
                                    <div className="text-h1 font-mono">{abTestResult.variantB.mean.toFixed(2)}</div>
                                    <div className="text-sm mt-2">Sample Size: {abTestResult.variantB.sampleSize}</div>
                                    <div className="text-sm">Std Dev: {abTestResult.variantB.stdDev.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="card" style={{
                                background: abTestResult.test.isSignificant ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                border: `2px solid ${abTestResult.test.isSignificant ? 'var(--success)' : 'var(--warning)'}`
                            }}>
                                <h5 className="text-h3 mb-3">🏆 Winner: {abTestResult.test.winner}</h5>
                                <div className="grid gap-2">
                                    <div>P-value: <strong>{abTestResult.test.pValue.toFixed(4)}</strong></div>
                                    <div>Confidence: <strong>{abTestResult.test.confidenceLevel}%</strong></div>
                                    <div>Effect Size: <strong>{abTestResult.test.effectSize.toFixed(3)}</strong></div>
                                    <div className="mt-2" style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                                        {abTestResult.test.recommendation}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Placeholder for other features */}
            {activeFeature === 'regression' && (
                <div className="card">
                    <h4 className="text-h3 mb-4 flex items-center gap-2"><BarChart3 size={24} /> Regression Analysis</h4>

                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                        {/* Config Column */}
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="label-premium">Analysis Type</label>
                                <div className="flex gap-2">
                                    {(['simple', 'multiple'] as const).map(t => (
                                        <button
                                            key={t}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${regressionConfig.type === t ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 opacity-60'}`}
                                            onClick={() => setRegressionConfig((prev: any) => ({ ...prev, type: t }))}
                                        >
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="label-premium">Dependent Variable (Y)</label>
                                <select
                                    className="input font-data"
                                    value={regressionConfig.dependentVar}
                                    onChange={(e) => setRegressionConfig((prev: any) => ({ ...prev, dependentVar: e.target.value }))}
                                >
                                    <option value="">Select Target Metric...</option>
                                    {measures.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="label-premium">Independent Variable (X)</label>
                                {regressionConfig.type === 'simple' ? (
                                    <select
                                        className="input font-data"
                                        value={regressionConfig.independentVars[0] || ''}
                                        onChange={(e) => setRegressionConfig((prev: any) => ({ ...prev, independentVars: [e.target.value] }))}
                                    >
                                        <option value="">Select Predictor...</option>
                                        {measures.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                ) : (
                                    <div className="flex-col gap-2 max-h-[200px] overflow-y-auto p-2 bg-black/20 rounded-xl inner-bevel">
                                        {measures.map((col: any) => (
                                            <label key={col} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                                                    checked={regressionConfig.independentVars.includes(col)}
                                                    onChange={(e) => {
                                                        const vars = e.target.checked
                                                            ? [...regressionConfig.independentVars, col]
                                                            : regressionConfig.independentVars.filter((v: any) => v !== col);
                                                        setRegressionConfig((prev: any) => ({ ...prev, independentVars: vars }));
                                                    }}
                                                />
                                                <span className="text-sm group-hover:text-primary transition-colors">{col}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary mt-2 w-full hover-lift active-press"
                                onClick={runRegression}
                                disabled={loading || !regressionConfig.dependentVar || regressionConfig.independentVars.length === 0}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
                                Calculate Correlation
                            </button>
                        </div>

                        {/* Result Column */}
                        <div className="flex-1 min-h-[400px] bg-black/20 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
                            <div className="absolute inset-0 glass-noise opacity-10 pointer-events-none" />

                            {!regressionResult && !loading && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <BarChart3 size={64} className="mb-4" />
                                    <p className="label-premium">Initialize Regression Engine</p>
                                    <p className="text-xs max-w-[200px] leading-relaxed mt-2">Select dimensions to investigate causality and predictive factors.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-primary mb-4" />
                                    <span className="label-premium animate-pulse">Computing Coefficients...</span>
                                </div>
                            )}

                            {regressionResult && !loading && (
                                <div className="flex-1 flex-col gap-6 fade-in h-full">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 inner-bevel">
                                            <span className="label-premium opacity-40">R-Squared (Accuracy)</span>
                                            <div className="text-3xl font-data text-primary mt-1">{(regressionResult.metrics.rSquared * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 inner-bevel">
                                            <span className="label-premium opacity-40">Correlation Type</span>
                                            <div className="text-3xl font-data mt-1">
                                                {regressionResult.model.coefficients[0].coefficient > 0 ? '↗️ Positive' : '↘️ Negative'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-sm leading-relaxed overflow-auto">
                                        <div className="label-premium !opacity-60 mb-3">MODEL SUMMARY</div>
                                        <div className="text-primary/80 mb-4 whitespace-nowrap">
                                            y = {regressionResult.model.intercept.toFixed(4)}
                                            {regressionResult.model.coefficients.map((c: any, i: number) => (
                                                <span key={i}> {c.coefficient >= 0 ? '+' : ''} {c.coefficient.toFixed(4)} * {c.variable}</span>
                                            ))}
                                        </div>

                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="py-2 label-premium">Variable</th>
                                                    <th className="py-2 label-premium">Coefficient</th>
                                                    <th className="py-2 label-premium">Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-white/5">
                                                    <td className="py-2 opacity-60">(Intercept)</td>
                                                    <td className="py-3 font-data">{regressionResult.model.intercept.toFixed(6)}</td>
                                                    <td className="py-3 font-data opacity-20">---</td>
                                                </tr>
                                                {regressionResult.model.coefficients.map((c: any, i: number) => (
                                                    <tr key={i} className="border-b border-white/5">
                                                        <td className="py-2 opacity-80">{c.variable}</td>
                                                        <td className="py-3 font-data text-primary">{c.coefficient.toFixed(6)}</td>
                                                        <td className="py-3 font-data">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${Math.min(100, Math.abs(c.coefficient) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] opacity-40">{c.significant ? 'Significant' : 'Low Influence'}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeFeature === 'cohort' && (
                <div className="card">
                    <h4 className="text-h3 mb-4 flex items-center gap-2"><Users size={24} /> Cohort Retention Analysis</h4>

                    <div className="grid gap-6" style={{ gridTemplateColumns: '300px 1fr' }}>
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="label-premium">User Identification Column</label>
                                <select
                                    className="input font-data"
                                    value={cohortConfig.userIdColumn}
                                    onChange={(e) => setCohortConfig((prev: any) => ({ ...prev, userIdColumn: e.target.value }))}
                                >
                                    <option value="">Select ID Column...</option>
                                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="label-premium">Acquisition Date (Signup)</label>
                                <select
                                    className="input font-data"
                                    value={cohortConfig.signupDateColumn}
                                    onChange={(e) => setCohortConfig((prev: any) => ({ ...prev, signupDateColumn: e.target.value }))}
                                >
                                    <option value="">Select Date Column...</option>
                                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="label-premium">Engagement Date (Activity)</label>
                                <select
                                    className="input font-data"
                                    value={cohortConfig.activityDateColumn}
                                    onChange={(e) => setCohortConfig((prev: any) => ({ ...prev, activityDateColumn: e.target.value }))}
                                >
                                    <option value="">Select Date Column...</option>
                                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>

                            <button
                                className="btn btn-primary mt-2 w-full active-press hover-lift"
                                onClick={runCohort}
                                disabled={loading || !cohortConfig.userIdColumn || !cohortConfig.signupDateColumn || !cohortConfig.activityDateColumn}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Users size={16} className="mr-2" />}
                                Generate Retention Heatmap
                            </button>
                        </div>

                        <div className="min-h-[400px] bg-black/20 rounded-2xl border border-white/5 p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute inset-0 glass-noise opacity-10 pointer-events-none" />

                            {!cohortResult && !loading && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <Users size={64} className="mb-4" />
                                    <p className="label-premium">Initialize Retention Scanning</p>
                                    <p className="text-xs max-w-[250px] leading-relaxed mt-2">Analyze how user groups (cohorts) return to your platform over time.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-primary mb-4" />
                                    <span className="label-premium animate-pulse">Bucketing User Identities...</span>
                                </div>
                            )}

                            {cohortResult && cohortResult.length > 0 && (
                                <div className="flex-1 overflow-auto fade-in">
                                    <div className="label-premium !opacity-60 mb-6 flex items-center justify-between">
                                        <span>RETENTION (%) BY ACQUISITION COHORT</span>
                                        <span className="text-[10px] font-mono">PERIOD: WEEKLY</span>
                                    </div>

                                    <div className="inline-block min-w-full">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="p-3 bg-white/[0.02] sticky left-0 z-10 label-premium border-b border-white/10" style={{ minWidth: '140px' }}>Cohort</th>
                                                    <th className="p-3 bg-white/[0.02] label-premium text-center border-b border-white/10">Size</th>
                                                    {['W0', 'W1', 'W4', 'W12'].map((label) => (
                                                        <th key={label} className="p-3 bg-white/[0.02] label-premium text-center border-b border-white/10">{label}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cohortResult.map((row: any, i: number) => (
                                                    <tr key={i} className="group hover:bg-white/[0.02]">
                                                        <td className="p-3 font-data border-b border-white/5 sticky left-0 bg-[#0c111d] group-hover:bg-white/[0.02] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] transition-colors">
                                                            {row.cohortName}
                                                        </td>
                                                        <td className="p-3 font-data text-center opacity-60 border-b border-white/5">{row.size.toLocaleString()}</td>
                                                        {Object.entries(row.retentionRates).map(([key, val]: [string, any], j: number) => (
                                                            <td
                                                                key={j}
                                                                className="p-3 text-center border-b border-white/5 font-data transition-all hover:scale-110 cursor-default"
                                                                style={{
                                                                    backgroundColor: `rgba(52, 211, 153, ${(val as number) / 100 * 0.8 + 0.05})`,
                                                                    color: (val as number) > 60 ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                                                    textShadow: (val as number) > 60 ? '0 0 10px rgba(0,0,0,0.5)' : 'none'
                                                                }}
                                                            >
                                                                {(val as number).toFixed(0)}%
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeFeature === 'funnel' && (
                <div className="card">
                    <h4 className="text-h3 mb-4 flex items-center gap-2"><Target size={24} /> Conversion Funnel Analysis</h4>

                    <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
                        <div className="flex-col gap-6">
                            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="flex-col gap-2">
                                    <label className="label-premium">User ID Column</label>
                                    <select
                                        className="input font-data"
                                        value={funnelConfig.userIdColumn}
                                        onChange={(e) => setFunnelConfig((prev: any) => ({ ...prev, userIdColumn: e.target.value }))}
                                    >
                                        <option value="">Select ID...</option>
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="label-premium">Timestamp (Opt)</label>
                                    <select
                                        className="input font-data"
                                        value={funnelConfig.timestampColumn}
                                        onChange={(e) => setFunnelConfig((prev: any) => ({ ...prev, timestampColumn: e.target.value }))}
                                    >
                                        <option value="">None...</option>
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-col gap-3">
                                <label className="label-premium flex items-center justify-between">
                                    Journey Steps
                                    <button
                                        className="text-[10px] text-primary hover:underline"
                                        onClick={() => setFunnelConfig((prev: any) => ({
                                            ...prev,
                                            steps: [...prev.steps, { name: `Step ${prev.steps.length + 1}`, eventColumn: '', eventValue: '' }]
                                        }))}
                                    >
                                        + Add Step
                                    </button>
                                </label>

                                <div className="flex-col gap-4 max-h-[400px] overflow-y-auto p-1">
                                    {funnelConfig.steps.map((step: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 relative group transition-all hover:border-white/10">
                                            <div className="absolute -left-2 top-4 w-5 h-5 rounded-full bg-primary text-[10px] flex items-center justify-center font-bold shadow-lg">
                                                {idx + 1}
                                            </div>

                                            {funnelConfig.steps.length > 2 && (
                                                <button
                                                    className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-danger/20 text-danger opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-danger hover:text-white"
                                                    onClick={() => setFunnelConfig((prev: any) => ({
                                                        ...prev,
                                                        steps: prev.steps.filter((_: any, i: number) => i !== idx)
                                                    }))}
                                                >
                                                    ×
                                                </button>
                                            )}

                                            <div className="grid gap-3">
                                                <input
                                                    type="text"
                                                    className="bg-transparent border-none outline-none font-bold text-sm p-0 mb-1"
                                                    value={step.name}
                                                    onChange={(e: any) => {
                                                        const newSteps = [...funnelConfig.steps];
                                                        newSteps[idx].name = e.target.value;
                                                        setFunnelConfig((prev: any) => ({ ...prev, steps: newSteps }));
                                                    }}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        className="input text-xs py-1 h-8 opacity-60 focus:opacity-100"
                                                        value={step.eventColumn}
                                                        onChange={(e: any) => {
                                                            const newSteps = [...funnelConfig.steps];
                                                            newSteps[idx].eventColumn = e.target.value;
                                                            setFunnelConfig((prev: any) => ({ ...prev, steps: newSteps }));
                                                        }}
                                                    >
                                                        <option value="">Column...</option>
                                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        className="input text-xs py-1 h-8 opacity-60 focus:opacity-100"
                                                        placeholder="Value..."
                                                        value={step.eventValue}
                                                        onChange={(e: any) => {
                                                            const newSteps = [...funnelConfig.steps];
                                                            newSteps[idx].eventValue = e.target.value;
                                                            setFunnelConfig((prev: any) => ({ ...prev, steps: newSteps }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary w-full active-press hover-lift mt-2"
                                onClick={runFunnel}
                                disabled={loading || !funnelConfig.userIdColumn || funnelConfig.steps.some((s: any) => !s.eventColumn || !s.eventValue)}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Target size={16} className="mr-2" />}
                                Analyze Conversion
                            </button>
                        </div>

                        <div className="min-h-[500px] bg-black/20 rounded-3xl border border-white/5 p-8 relative overflow-hidden flex flex-col">
                            <div className="absolute inset-0 glass-noise opacity-10 pointer-events-none" />

                            {!funnelResult && !loading && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <Target size={64} className="mb-4" />
                                    <p className="label-premium">Mapping Conversion Pathways</p>
                                    <p className="text-xs max-w-[250px] leading-relaxed mt-2">Visualize drop-offs and track user progression through sequential events.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-primary mb-4" />
                                    <span className="label-premium animate-pulse">Tracing Event Sequences...</span>
                                </div>
                            )}

                            {funnelResult && (
                                <div className="flex-1 flex flex-col gap-8 fade-in h-full">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="label-premium !opacity-60 mb-1">TOTAL CONVERSION</div>
                                            <div className="text-4xl font-data text-primary">
                                                {funnelResult.overall.overallConversion.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="label-premium !opacity-40 mb-1">ENTRANCE VOLUME</div>
                                            <div className="text-2xl font-data">{funnelResult.overall.totalUsers.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-4 relative">
                                        {/* Background connecting lines */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 -translate-x-1/2 -z-10" />

                                        {funnelResult.steps.map((step: any, i: number) => {
                                            const prevStep = funnelResult.steps[i - 1];
                                            const dropoff = step.dropOffFromPrevious.toFixed(0);

                                            return (
                                                <div key={i} className="flex-col items-center relative z-10 w-full">
                                                    {i > 0 && (
                                                        <div className="flex flex-col items-center gap-1 my-3">
                                                            <div className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">
                                                                ↓ {dropoff}% DROP-OFF
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex-col w-full group">
                                                        <div className="flex justify-between items-center mb-2 px-2">
                                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                                                {step.stepName}
                                                            </span>
                                                            <span className="font-data text-sm">
                                                                {step.users.toLocaleString()} <span className="opacity-20 ml-1 text-[10px]">UNITS</span>
                                                            </span>
                                                        </div>

                                                        <div className="h-10 bg-white/[0.02] rounded-xl border border-white/5 flex items-center p-1.5 inner-bevel overflow-hidden relative">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${step.conversionFromStart}%` }}
                                                                transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                                                                className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                                                            />
                                                            <div className="absolute right-4 text-[10px] font-bold opacity-40">
                                                                {step.conversionFromStart.toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
