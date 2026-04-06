import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
    TrendingUp, Calculator, Brain, RefreshCw, Database,
    Zap, Share2, Maximize2, Shield, Calendar, Activity, Sliders, Target
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

// ─── Theme Colors ──────────────────────────────────────────────
const HISTORICAL_COLOR = '#818cf8';
const FORECAST_COLOR = '#34d399';
const FORECAST_AREA = 'rgba(52,211,153,0.15)';

// ─── Custom Tooltip ──────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(8,8,14,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)',
            minWidth: '200px', color: '#fff'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((p: any, i: number) => {
                // If it's the bounding area, don't show it in tooltip
                if (p.dataKey === 'confidenceBounds') return null;
                return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: p.color, fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Components ──────────────────────────────────────────────
const LOAD_STEPS = ['Ingesting historical data…', 'Applying smoothing filters…', 'Training regression model…', 'Generating forecast horizon…'];

interface Props {
    files: { id: string; filename: string; size: number; createdAt: string }[];
    token: string;
}

export const ForecastingView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const [selectedFile, setSelectedFile] = useState('');
    const [targetColumn, setTargetColumn] = useState('');
    const [timeColumn, setTimeColumn] = useState('');
    const [forecastPeriods, setForecastPeriods] = useState('12');
    const [modelType, setModelType] = useState('linear');
    
    const [loading, setLoading] = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [modelMetrics, setModelMetrics] = useState<any>(null);
    const [availableColumns, setAvailableColumns] = useState<{name: string, type: string}[]>([]);

    // Fetch schema when file changes
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
                // Auto-select date and numeric columns if available
                const dateCol = data.columns.find((c: any) => c.type === 'date')?.name;
                const numCol = data.columns.find((c: any) => c.type === 'numeric')?.name;
                if (dateCol) setTimeColumn(dateCol);
                if (numCol) setTargetColumn(numCol);
            }
        } catch (e) {
            console.error('Failed to load file schema', e);
        }
    };

    const runForecast = useCallback(async () => {
        if (!selectedFile || !targetColumn) {
            addToast('Select a dataset and target metric.', 'error');
            return;
        }

        setLoading(true);
        setLoadStep(0);

        try {
            // Send request to real backend engine
            const response = await fetch(`${API_URL}/api/files/${selectedFile}/forecast`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    targetColumn,
                    timeColumn,
                    modelType,
                    periods: forecastPeriods
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Forecasting failed on the server');
            }

            const result = await response.json();

            // Artificial delay just for the UI loading animation to feel substantial/premium
            for (let i = 0; i < LOAD_STEPS.length; i++) {
                setLoadStep(i);
                await new Promise(r => setTimeout(r, 300));
            }

            setForecastData(result.data);
            setModelMetrics(result.metrics);

            addToast('Predictive model trained successfully', 'success');

        } catch (e: any) {
            if (e.message === 'FILE_NOT_FOUND') {
                addToast('Server storage reset. Please re-upload this dataset to enable Forecasting.', 'error');
            } else {
                addToast(e.message || 'Forecasting failed', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedFile, targetColumn, forecastPeriods, modelType, addToast]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>
            
            {/* ─── Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(52,211,153,0.2))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calculator size={24} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #34d399 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Enterprise Forecasting Engine
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Train predictive models • Generate future trajectory bands • Automated regression math
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Configuration Panel ───────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24)' }} />
                
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Sliders size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Model Parameters</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    {/* Dataset Selection */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                            Dataset
                        </label>
                        <select value={selectedFile} onChange={e => handleFileChange(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFile ? 'rgba(129,140,248,0.4)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="">Select dataset…</option>
                            {files.map(f => <option key={f.id} value={f.id}>{(f as any).originalName || f.filename}</option>)}
                        </select>
                    </div>

                    {/* Target Metric */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: FORECAST_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Target size={12} /> Target Metric (Y)
                        </label>
                        <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)} disabled={!availableColumns.length}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, opacity: availableColumns.length ? 1 : 0.5 }}>
                            <option value="">Choose numeric column…</option>
                            {availableColumns.filter(c => c.type === 'numeric').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Time Dimension */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: HISTORICAL_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> Time Dimension (X)
                        </label>
                        <select value={timeColumn} onChange={e => setTimeColumn(e.target.value)} disabled={!availableColumns.length}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, opacity: availableColumns.length ? 1 : 0.5 }}>
                            <option value="">Row sequence (default)</option>
                            {availableColumns.map(c => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
                        </select>
                    </div>

                    {/* Model Type */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                            Algorithm
                        </label>
                        <select value={modelType} onChange={e => setModelType(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            <option value="linear">Linear Regression (OLS)</option>
                            <option value="exponential">Exponential Smoothing</option>
                            <option value="arima">ARIMA (Auto-tuned)</option>
                        </select>
                    </div>

                    {/* Forecast Horizon */}
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                            Forecast Periods
                        </label>
                        <input type="number" min="1" max="100" value={forecastPeriods} onChange={e => setForecastPeriods(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}
                        />
                    </div>

                    {/* Run Button */}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runForecast}
                        disabled={loading || !selectedFile || !targetColumn}
                        style={{ padding: '10px 24px', height: '40px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #818cf8, #34d399)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFile || !targetColumn) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(129,140,248,0.25)', whiteSpace: 'nowrap' }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
                        {loading ? 'Solving Model…' : 'Train & Forecast'}
                    </motion.button>
                </div>
            </div>

            {/* ─── Animated Loading ───────────────────────────────── */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(52,211,153,0.15)', borderTop: '3px solid #34d399' }} className="animate-spin" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '280px' }}>
                            {LOAD_STEPS.map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.3, x: 0 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: i <= loadStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {i < loadStep ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} /> : i === loadStep ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Results Chart ──────────────────────────────────── */}
            {!loading && forecastData.length > 0 && modelMetrics && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    
                    {/* Score Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        {[
                            { label: 'R² (Model Fit)', val: modelMetrics.rSquared, color: '#818cf8', icon: <Activity size={16} /> },
                            { label: 'RMSE (Error)', val: modelMetrics.rmse, color: '#f472b6', icon: <TrendingUp size={16} /> },
                            { label: 'Forecast Target', val: `${forecastPeriods} steps`, color: '#34d399', icon: <Target size={16} /> },
                            { label: 'Confidence', val: modelMetrics.confidence, color: '#fbbf24', icon: <Shield size={16} /> }
                        ].map((m, i) => (
                            <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-default)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: m.color }}>
                                    {m.icon} <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{m.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Container */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Brain size={18} style={{ color: '#34d399' }} />
                                <span style={{ fontSize: '14px', fontWeight: 700 }}>Trajectory Projection: <span style={{ color: 'var(--text-secondary)' }}>{targetColumn}</span></span>
                            </div>
                            <span className="badge badge-sm" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}>
                                {modelType.toUpperCase()}
                            </span>
                        </div>
                        
                        <div style={{ height: '450px', padding: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="period" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                                    <Tooltip content={<ForecastTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                                    
                                    {/* Confidence Interval Area */}
                                    <Area type="monotone" dataKey="confidenceBounds" stroke="none" fill={FORECAST_AREA} name="95% Confidence Interval" />
                                    
                                    {/* Historical Data */}
                                    <Line type="monotone" dataKey="actual" stroke={HISTORICAL_COLOR} strokeWidth={3} dot={{ r: 2, fill: HISTORICAL_COLOR, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Historical Data" />
                                    
                                    {/* Forecast Data */}
                                    <Line type="monotone" dataKey="forecast" stroke={FORECAST_COLOR} strokeWidth={3} strokeDasharray="6 6" dot={{ r: 3, fill: FORECAST_COLOR, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Forecast Projection" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ─── Empty State ───────────────────────────────────── */}
            {!loading && forecastData.length === 0 && (
                <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <TrendingUp size={40} style={{ color: '#34d399', opacity: 0.8 }} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Launch Forecasting Engine</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Select a dataset and a numeric target column. Nalyse will automatically calculate statistical models and project a confidence-bounded future trajectory.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForecastingView;
