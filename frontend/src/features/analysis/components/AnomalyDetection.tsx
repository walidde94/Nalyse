import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Activity,
    Target,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    ArrowRight,
    BrainCircuit,
    Zap,
    CheckCircle2
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Scatter,
    ComposedChart
} from 'recharts';

interface AnomalyDetectionProps {
    data: any[];
    schema: Record<string, string>;
}

interface AnomalyResult {
    id: string;
    column: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
    severity: 'critical' | 'warning' | 'info';
    rowIndex: number;
    rowItem: any;
    labelInfo: string;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ data, schema }) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [sensitivity, setSensitivity] = useState<number>(2.5); // Z-score threshold

    // Detect numeric columns
    const numericColumns = useMemo(() => {
        return Object.keys(schema).filter(key => 
            schema[key] === 'number' || schema[key] === 'float' || schema[key] === 'integer' || schema[key] === 'currency'
        );
    }, [schema]);

    // Initial selected metric
    useMemo(() => {
        if (!selectedMetric && numericColumns.length > 0) {
            setSelectedMetric(numericColumns[0]);
        }
    }, [numericColumns, selectedMetric]);

    // Perform anomaly detection
    const { anomalies, chartData, stats } = useMemo(() => {
        if (!selectedMetric || !data || data.length === 0) return { anomalies: [], chartData: [], stats: null };

        // Clean data and filter out nulls for the selected metric
        const validData = data
            .map((item, index) => ({ ...item, _originalIndex: index }))
            .filter(item => item[selectedMetric] !== null && item[selectedMetric] !== undefined && !isNaN(Number(item[selectedMetric])));

        if (validData.length === 0) return { anomalies: [], chartData: [], stats: null };

        const values = validData.map(item => Number(item[selectedMetric]));
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        const detectedAnomalies: AnomalyResult[] = [];
        
        // Find a label column (prefer date, then name, then ID)
        const labelCol = Object.keys(schema).find(k => schema[k] === 'date' || schema[k] === 'datetime') || 
                         Object.keys(schema).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('title')) ||
                         Object.keys(schema)[0];

        const mappedChartData = validData.map((item, index) => {
            const val = Number(item[selectedMetric]);
            const zScore = stdDev > 0 ? Math.abs((val - mean) / stdDev) : 0;
            const isAnomaly = zScore > sensitivity;
            
            const label = item[labelCol] ? String(item[labelCol]) : `Row ${item._originalIndex + 1}`;
            
            let severity: 'critical' | 'warning' | 'info' = 'info';
            if (zScore > sensitivity + 1) severity = 'critical';
            else if (zScore > sensitivity) severity = 'warning';

            if (isAnomaly) {
                detectedAnomalies.push({
                    id: `anomaly-${item._originalIndex}`,
                    column: selectedMetric,
                    value: val,
                    mean,
                    stdDev,
                    zScore,
                    severity,
                    rowIndex: item._originalIndex,
                    rowItem: item,
                    labelInfo: label
                });
            }

            return {
                label,
                value: val,
                anomalyValue: isAnomaly ? val : null,
                isAnomaly,
                zScore
            };
        });

        // Sort anomalies by severity descendant
        detectedAnomalies.sort((a, b) => b.zScore - a.zScore);

        return {
            anomalies: detectedAnomalies,
            chartData: mappedChartData,
            stats: { mean, stdDev, count: values.length, min: Math.min(...values), max: Math.max(...values) }
        };

    }, [data, selectedMetric, sensitivity, schema]);

    if (numericColumns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full opacity-50">
                <ShieldAlert size={48} className="mb-4 text-emerald-500" />
                <h3 className="text-xl font-bold mb-2">No Numeric Data Available</h3>
                <p className="text-sm">Automated anomaly detection requires numeric columns to perform statistical analysis.</p>
            </div>
        );
    }

    const formatValue = (val: number) => {
        if (Math.abs(val) > 1000000) return (val / 1000000).toFixed(2) + 'M';
        if (Math.abs(val) > 1000) return (val / 1000).toFixed(2) + 'K';
        return val.toFixed(2).replace(/\.00$/, '');
    };
    return (
        <div id="anomaly-detection-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>
            
            {/* ─── Header ─────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AI Anomaly Detection
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Automated Statistical Outlier Identification & Insight Generation
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Control Panel ───────────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #34d399)' }} />
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Search size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Detection Configuration</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Target Metric */}
                    <div style={{ flex: 2, minWidth: '220px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} /> Target Metric
                        </label>
                        <select 
                            value={selectedMetric || ''} 
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}
                        >
                            {numericColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sensitivity Selection */}
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} /> Sensitivity 
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>Z &gt; {sensitivity.toFixed(1)}</span>
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1.5, 2.0, 2.5, 3.0, 3.5].map(s => (
                                <button key={s} onClick={() => setSensitivity(s)}
                                    style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: sensitivity === s ? '1px solid #34d399' : '1px solid var(--border-default)', background: sensitivity === s ? 'rgba(52,211,153,0.12)' : 'var(--bg-main)', color: sensitivity === s ? '#34d399' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                    {s.toFixed(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Main Stats Grid ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)', border: `1px solid ${anomalies.length > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)'}`, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: anomalies.length > 0 ? '#f59e0b' : '#34d399' }}>
                        {anomalies.length > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detected Anomalies</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{anomalies.length}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Requiring Review</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                    style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1' }}>
                        <Target size={16} />
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Baseline Mean</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{stats ? formatValue(stats.mean) : '0'}</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                        <Activity size={16} />
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Standard Dev (σ)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>±{stats ? formatValue(stats.stdDev) : '0'}</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                    style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899' }}>
                        <BrainCircuit size={16} />
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Assessment</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
                        {anomalies.length === 0 ? (
                            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldAlert size={14} /> Normal Variance
                            </div>
                        ) : anomalies.length > 5 ? (
                            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={14} /> High Volatility
                            </div>
                        ) : (
                            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={14} /> Isolated Outliers
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ─── Main Content Layout ───────────────────────────── */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', minHeight: '500px' }}>
                
                {/* Visual Chart Area */}
                <div style={{ flex: '2 1 600px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={16} style={{ color: '#6366f1' }} /> Metric Volatility Map
                            </h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                {selectedMetric} Distribution Tracking
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.5)' }} /> Baseline Trend
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} /> Detected Anomaly
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                    dataKey="label" 
                                    stroke="var(--text-muted)" 
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    stroke="var(--text-muted)" 
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => formatValue(val)}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-elevated)', 
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-default)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 24px 48px -8px rgba(0,0,0,0.5)',
                                        padding: '14px 18px',
                                        color: 'var(--text-primary)'
                                    }}
                                    itemStyle={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                                    labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800, letterSpacing: '0.1em' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="rgba(99, 102, 241, 0.4)" 
                                    strokeWidth={2} 
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#818cf8', stroke: 'var(--bg-surface)' }} 
                                />
                                <Scatter 
                                    dataKey="anomalyValue" 
                                    fill="#f59e0b" 
                                    line={false}
                                    shape={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        if (!payload.isAnomaly) return <g />;
                                        return (
                                            <g>
                                                <circle cx={cx} cy={cy} r={8} fill="rgba(245, 158, 11, 0.2)" className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                                                <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="var(--bg-surface)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }} />
                                            </g>
                                        );
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Anomalies List */}
                <div style={{ flex: '1 1 350px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-default)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                            Anomaly Manifest
                        </h3>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <AnimatePresence>
                            {anomalies.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '32px', textAlign: 'center' }}
                                >
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(52,211,153,0.2)' }}>
                                        <CheckCircle2 size={28} style={{ color: '#34d399' }} />
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>No Anomalies Found</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data points are within normal statistical variance.</p>
                                </motion.div>
                            ) : (
                                anomalies.map((anomaly, idx) => {
                                    const isCritical = anomaly.severity === 'critical';
                                    const colorPrimary = isCritical ? '#ef4444' : '#f59e0b';
                                    const colorBg = isCritical ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)';
                                    const devPct = ((anomaly.value - anomaly.mean) / anomaly.mean * 100);

                                    return (
                                        <motion.div
                                            key={anomaly.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-main)', border: `1px solid ${colorBg}`, position: 'relative', overflow: 'hidden' }}
                                        >
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: colorPrimary }} />
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                                                    {anomaly.labelInfo || `Record #${idx+1}`}
                                                </div>
                                                <div style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colorPrimary, background: colorBg }}>
                                                    {anomaly.severity}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Value</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                                        {formatValue(anomaly.value)}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Deviation</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: devPct > 0 ? '#34d399' : '#ef4444' }}>
                                                        {devPct > 0 ? '+' : ''}{devPct.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Z-Score: {anomaly.zScore.toFixed(2)}</span>
                                                <button style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                                                    Inspect <ArrowRight size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnomalyDetection;
