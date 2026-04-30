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
import { useLanguage } from '../../contexts/LanguageContext';

const StaticInsightPanel = ({ title, type, icon, description }: { title: string, type: 'success' | 'warning', icon: React.ReactNode, description: string }) => {
    const isSuccess = type === 'success';
    const color = isSuccess ? '#10b981' : '#f59e0b';
    const bg = isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
    const border = isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)';
    return (
        <div style={{ padding: '16px 20px', borderRadius: '14px', background: bg, border: `1px solid ${border}`, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: color }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{description}</p>
            </div>
        </div>
    );
};

// ─── Theme Colors ──────────────────────────────────────────────
const HISTORICAL_COLOR = '#818cf8';
const FORECAST_COLOR = '#34d399';
const FORECAST_AREA = 'rgba(52,211,153,0.15)';

// ─── Custom Tooltip ──────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-default)',
            padding: '14px 18px', borderRadius: '14px', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)',
            minWidth: '200px', color: 'var(--text-primary)'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
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

interface Props {
    files: { id: string; filename: string; size: number; createdAt: string }[];
    token: string;
}

export const ForecastingView = ({ files, token }: Props) => {
    const { t } = useLanguage();
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

    const LOAD_STEPS = useMemo(() => [
        t('forecast.ingesting'),
        t('forecast.smoothing'),
        t('forecast.training'),
        t('forecast.generating')
    ], [t]);

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
            addToast(t('forecast.launchDesc'), 'error');
            return;
        }

        setLoading(true);
        setLoadStep(0);
        
        // Simulated loading steps
        const stepInterval = setInterval(() => {
            setLoadStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 800);

        try {
            const res = await fetch(`${API_URL}/api/files/${selectedFile}/forecast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    target: targetColumn,
                    time: timeColumn,
                    periods: parseInt(forecastPeriods),
                    type: modelType
                })
            });

            if (res.ok) {
                const data = await res.json();
                setForecastData(data.points);
                setModelMetrics(data.metrics);
                addToast(t('forecast.success'), 'success');
            } else {
                throw new Error('Forecast failed');
            }
        } catch (e) {
            addToast(t('forecast.error'), 'error');
        } finally {
            clearInterval(stepInterval);
            setLoading(false);
        }
    }, [selectedFile, targetColumn, timeColumn, forecastPeriods, modelType, token, addToast, t]);

    return (
        <div className="view-container" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #818cf8, #34d399)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                        <TrendingUp size={24} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>{t('forecast.title')}</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '800px', margin: 0 }}>
                    {t('forecast.subtitle')}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="bento-card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '16px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sliders size={14} /> {t('forecast.parameters')}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('forecast.dataset')}</label>
                                <select 
                                    value={selectedFile} 
                                    onChange={(e) => handleFileChange(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="">{t('forecast.chooseDataset')}</option>
                                    {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('forecast.target')}</label>
                                <select 
                                    value={targetColumn} 
                                    onChange={(e) => setTargetColumn(e.target.value)}
                                    disabled={!selectedFile}
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="">{t('forecast.chooseNumeric')}</option>
                                    {availableColumns.filter(c => c.type === 'numeric').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('forecast.time')}</label>
                                <select 
                                    value={timeColumn} 
                                    onChange={(e) => setTimeColumn(e.target.value)}
                                    disabled={!selectedFile}
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="">{t('forecast.rowSequence')}</option>
                                    {availableColumns.filter(c => c.type === 'date').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('forecast.periods')}</label>
                                <input 
                                    type="number" 
                                    value={forecastPeriods} 
                                    onChange={(e) => setForecastPeriods(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={runForecast}
                                disabled={loading || !selectedFile || !targetColumn}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff',
                                    fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '8px',
                                    opacity: (loading || !selectedFile || !targetColumn) ? 0.6 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                                {loading ? t('forecast.solving') : t('forecast.train')}
                            </motion.button>
                        </div>
                    </div>

                    {modelMetrics && (
                        <div className="bento-card" style={{ padding: '20px', background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.1)' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '16px', letterSpacing: '0.1em' }}>Model Performance</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('forecast.fit')}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{modelMetrics.r2.toFixed(3)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('forecast.error')}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900 }}>{modelMetrics.rmse.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="bento-card" style={{ padding: '24px', flex: 1, minHeight: '400px', position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
                                >
                                    <div className="loader-ring" />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{LOAD_STEPS[loadStep]}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {loadStep + 1} of 4</div>
                                    </div>
                                </motion.div>
                            ) : forecastData.length > 0 ? (
                                <motion.div 
                                    key="chart"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ height: '100%' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('forecast.trajectory')} {targetColumn}</h3>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: HISTORICAL_COLOR }} />
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('forecast.historical')}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: FORECAST_COLOR }} />
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('forecast.projection')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={forecastData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                            <XAxis 
                                                dataKey="label" 
                                                stroke="var(--text-muted)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                tick={{ fill: 'var(--text-muted)' }}
                                            />
                                            <YAxis 
                                                stroke="var(--text-muted)" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                tick={{ fill: 'var(--text-muted)' }}
                                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                                            />
                                            <Tooltip content={<ForecastTooltip />} />
                                            
                                            {/* Confidence Interval Area */}
                                            <Area 
                                                type="monotone" 
                                                dataKey="confidenceBounds" 
                                                fill={FORECAST_AREA} 
                                                stroke="none" 
                                                activeDot={false}
                                                name={t('forecast.ci')}
                                            />
                                            
                                            {/* Historical Line */}
                                            <Line 
                                                type="monotone" 
                                                dataKey="historical" 
                                                stroke={HISTORICAL_COLOR} 
                                                strokeWidth={3} 
                                                dot={false}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                name={t('forecast.historical')}
                                            />
                                            
                                            {/* Forecast Line */}
                                            <Line 
                                                type="monotone" 
                                                dataKey="forecast" 
                                                stroke={FORECAST_COLOR} 
                                                strokeWidth={3} 
                                                strokeDasharray="5 5"
                                                dot={false}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                name={t('forecast.projection')}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calculator size={32} style={{ opacity: 0.3 }} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{t('forecast.launch')}</div>
                                        <p style={{ fontSize: '13px', maxWidth: '400px', margin: 0, lineHeight: 1.6 }}>
                                            {t('forecast.launchDesc')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {forecastData.length > 0 && !loading && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <StaticInsightPanel 
                                title="AI Trajectory Insight"
                                type="success"
                                icon={<Brain size={16} />}
                                description={`Based on historical patterns in ${targetColumn}, our model projects a ${modelType === 'linear' ? 'steady' : 'curvilinear'} trend over the next ${forecastPeriods} periods with a confidence score of ${(modelMetrics.r2 * 100).toFixed(1)}%.`}
                            />
                            <StaticInsightPanel 
                                title="Risk Threshold"
                                type="warning"
                                icon={<Shield size={16} />}
                                description={`The RMSE of ${modelMetrics.rmse.toFixed(0)} indicates moderate variance. External factors not present in the historical dataset may impact accuracy as we move further into the horizon.`}
                            />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .loader-ring {
                    width: 48px;
                    height: 48px;
                    border: 3px solid var(--border-subtle);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
