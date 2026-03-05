import React, { useMemo, useState, useCallback } from 'react';
import {
    Activity, AlertTriangle, BarChart3, ChevronDown, ChevronRight,
    Radio, Eye, Zap, TrendingDown, Waves, Info, Signal, Download, Sparkles
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
 * Types
 * ════════════════════════════════════════════════════════════════════ */

interface ColumnNoise {
    column: string;
    type: 'numeric' | 'categorical';
    missingPct: number;
    uniqueRatio: number;          // unique values / total rows
    outlierPct: number;           // % values beyond 1.5×IQR
    variance: number;
    stdDev: number;
    coeffOfVar: number;           // stdDev / mean  (numeric only)
    entropy: number;              // Shannon entropy (categorical)
    noiseScore: number;           // 0-100 composite
    signalToNoise: number;        // higher = better
    sparkline: number[];          // noise across data windows
}

interface DataNoiseWidgetProps {
    data: any[];
    columns: string[];
    measures: string[];
    dimensions: string[];
    isDark?: boolean;
}

/* ════════════════════════════════════════════════════════════════════
 * Helpers
 * ════════════════════════════════════════════════════════════════════ */

function median(arr: number[]): number {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function iqr(arr: number[]): { q1: number; q3: number; iqr: number } {
    const s = [...arr].sort((a, b) => a - b);
    const q1 = s[Math.floor(s.length * 0.25)];
    const q3 = s[Math.floor(s.length * 0.75)];
    return { q1, q3, iqr: q3 - q1 };
}

function shannonEntropy(values: string[]): number {
    const freq: Record<string, number> = {};
    values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    const total = values.length;
    let ent = 0;
    Object.values(freq).forEach(c => {
        const p = c / total;
        if (p > 0) ent -= p * Math.log2(p);
    });
    return ent;
}

function analyzeColumn(col: string, data: any[], isNumeric: boolean): ColumnNoise {
    const total = data.length;
    const raw = data.map(r => r[col]);
    const missing = raw.filter(v => v === null || v === undefined || v === '' || v === 'N/A').length;
    const missingPct = (missing / total) * 100;
    const present = raw.filter(v => v !== null && v !== undefined && v !== '' && v !== 'N/A');
    const uniqueSet = new Set(present.map(String));
    const uniqueRatio = present.length > 0 ? uniqueSet.size / present.length : 0;

    if (isNumeric) {
        const nums = present.map(Number).filter(n => !isNaN(n));
        if (nums.length < 2) {
            return { column: col, type: 'numeric', missingPct, uniqueRatio, outlierPct: 0, variance: 0, stdDev: 0, coeffOfVar: 0, entropy: 0, noiseScore: missingPct, signalToNoise: 100, sparkline: [] };
        }
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
        const stdDev = Math.sqrt(variance);
        const coeffOfVar = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

        const { q1, q3, iqr: iqrVal } = iqr(nums);
        const lowerFence = q1 - 1.5 * iqrVal;
        const upperFence = q3 + 1.5 * iqrVal;
        const outlierCount = nums.filter(n => n < lowerFence || n > upperFence).length;
        const outlierPct = (outlierCount / nums.length) * 100;

        // Composite noise score: weighted blend of outlierPct, coeffOfVar, missingPct
        const normCoV = Math.min(coeffOfVar, 200) / 2;     // 0..100 from CoV
        const noiseScore = Math.min(100, (outlierPct * 0.35) + (normCoV * 0.35) + (missingPct * 0.3));
        const signalToNoise = Math.max(0, 100 - noiseScore);

        return { column: col, type: 'numeric', missingPct, uniqueRatio, outlierPct, variance, stdDev, coeffOfVar, entropy: 0, noiseScore, signalToNoise, sparkline: [] };
    } else {
        const strings = present.map(String);
        const entropy = shannonEntropy(strings);
        const maxEntropy = strings.length > 0 ? Math.log2(uniqueSet.size) : 0;
        const normalizedEntropy = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;

        // For categorical: high cardinality with low frequency = potential noise
        const cardinalityNoise = uniqueRatio > 0.9 ? 50 : uniqueRatio > 0.5 ? 25 : 5;
        const noiseScore = Math.min(100, (cardinalityNoise * 0.4) + (missingPct * 0.35) + ((100 - normalizedEntropy) * 0.25));
        const signalToNoise = Math.max(0, 100 - noiseScore);

        return { column: col, type: 'categorical', missingPct, uniqueRatio, outlierPct: 0, variance: 0, stdDev: 0, coeffOfVar: 0, entropy, noiseScore, signalToNoise, sparkline: [] };
    }
}

/** Generate sparkline data: noise score across sequential data windows */
function computeSparkline(col: string, data: any[], isNumeric: boolean, windows: number = 8): number[] {
    if (data.length < windows * 2) return [];
    const windowSize = Math.floor(data.length / windows);
    const points: number[] = [];
    for (let i = 0; i < windows; i++) {
        const slice = data.slice(i * windowSize, (i + 1) * windowSize);
        const result = analyzeColumn(col, slice, isNumeric);
        points.push(result.noiseScore);
    }
    return points;
}

/** Generate actionable recommendation for a column */
function getRecommendation(col: ColumnNoise): { action: string; detail: string; priority: 'high' | 'medium' | 'low' } {
    if (col.missingPct > 30) {
        return { action: 'Remove or Impute', detail: `${col.missingPct.toFixed(0)}% missing — consider dropping this column or using median/mode imputation.`, priority: 'high' };
    }
    if (col.missingPct > 10) {
        return { action: 'Impute Missing', detail: `Fill ${col.missingPct.toFixed(0)}% missing values using ${col.type === 'numeric' ? 'median' : 'mode'} imputation.`, priority: 'medium' };
    }
    if (col.type === 'numeric' && col.outlierPct > 15) {
        return { action: 'Clip Outliers', detail: `${col.outlierPct.toFixed(0)}% outliers — apply winsorization or log transform to reduce impact.`, priority: 'high' };
    }
    if (col.type === 'numeric' && col.coeffOfVar > 150) {
        return { action: 'Normalize', detail: `Very high variance (CoV: ${col.coeffOfVar.toFixed(0)}%) — apply standardization or log scaling.`, priority: 'medium' };
    }
    if (col.type === 'categorical' && col.uniqueRatio > 0.9) {
        return { action: 'Review Cardinality', detail: `Near-unique values (${(col.uniqueRatio * 100).toFixed(0)}%) — may be an ID column or needs grouping.`, priority: 'medium' };
    }
    if (col.noiseScore < 15) {
        return { action: 'Ready to Use', detail: 'Clean signal — no preprocessing needed.', priority: 'low' };
    }
    return { action: 'Monitor', detail: 'Acceptable noise level — consider preprocessing if used as a primary feature.', priority: 'low' };
}

/* ════════════════════════════════════════════════════════════════════
 * Component
 * ════════════════════════════════════════════════════════════════════ */

export const DataNoiseWidget: React.FC<DataNoiseWidgetProps> = ({
    data, columns, measures, dimensions, isDark = true,
}) => {
    const [sortBy, setSortBy] = useState<'noiseScore' | 'signalToNoise' | 'missingPct' | 'outlierPct'>('noiseScore');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [expandedCol, setExpandedCol] = useState<string | null>(null);

    const bg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(15,23,42,${a})`;

    const analysis = useMemo(() => {
        if (!data || data.length === 0 || columns.length === 0) return [];
        const measSet = new Set(measures);
        return columns.map(col => {
            const isNum = measSet.has(col);
            const result = analyzeColumn(col, data, isNum);
            result.sparkline = computeSparkline(col, data, isNum);
            return result;
        });
    }, [data, columns, measures]);

    const exportNoiseReport = useCallback(() => {
        const report = {
            timestamp: new Date().toISOString(),
            totalColumns: analysis.length,
            totalRows: data.length,
            overallNoiseScore: analysis.length > 0 ? (analysis.reduce((s, a) => s + a.noiseScore, 0) / analysis.length).toFixed(1) : '0',
            columns: analysis.map(col => ({
                name: col.column,
                type: col.type,
                noiseScore: col.noiseScore.toFixed(1),
                signalToNoise: col.signalToNoise.toFixed(1),
                missingPct: col.missingPct.toFixed(1),
                outlierPct: col.outlierPct.toFixed(1),
                recommendation: getRecommendation(col),
            }))
        };
        navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    }, [analysis, data]);

    const sorted = useMemo(() => {
        const arr = [...analysis];
        arr.sort((a, b) => {
            const va = a[sortBy] as number;
            const vb = b[sortBy] as number;
            return sortDir === 'desc' ? vb - va : va - vb;
        });
        return arr;
    }, [analysis, sortBy, sortDir]);

    // Aggregate metrics
    const overall = useMemo(() => {
        if (analysis.length === 0) return { avgNoise: 0, avgSNR: 0, noisiest: '-', cleanest: '-', totalMissing: 0, avgOutlier: 0 };
        const avgNoise = analysis.reduce((s, a) => s + a.noiseScore, 0) / analysis.length;
        const avgSNR = analysis.reduce((s, a) => s + a.signalToNoise, 0) / analysis.length;
        const noisiest = [...analysis].sort((a, b) => b.noiseScore - a.noiseScore)[0]?.column || '-';
        const cleanest = [...analysis].sort((a, b) => a.noiseScore - b.noiseScore)[0]?.column || '-';
        const totalMissing = analysis.reduce((s, a) => s + a.missingPct, 0) / analysis.length;
        const numericCols = analysis.filter(a => a.type === 'numeric');
        const avgOutlier = numericCols.length > 0 ? numericCols.reduce((s, a) => s + a.outlierPct, 0) / numericCols.length : 0;
        return { avgNoise, avgSNR, noisiest, cleanest, totalMissing, avgOutlier };
    }, [analysis]);

    const noiseColor = (score: number) => score > 60 ? '#f43f5e' : score > 35 ? '#f59e0b' : '#10b981';
    const snrColor = (snr: number) => snr > 65 ? '#10b981' : snr > 40 ? '#f59e0b' : '#f43f5e';

    const handleSort = (key: typeof sortBy) => {
        if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortBy(key); setSortDir('desc'); }
    };

    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: fg(0.4), fontSize: '13px' }}>
                <Waves size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <div>No data available for noise analysis</div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%', maxWidth: '720px',
            background: isDark ? 'rgba(10,10,16,0.6)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(40px)',
            border: `1px solid ${bg(0.06)}`, borderRadius: '24px',
            overflow: 'hidden', position: 'relative',
        }}>
            {/* Top accent */}
            <div style={{
                position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.4), rgba(245,158,11,0.3), transparent)',
            }} />

            {/* ═══════ HEADER ═══════ */}
            <div style={{ padding: '20px 24px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(245,158,11,0.08))',
                        border: '1px solid rgba(244,63,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Waves size={20} color="#f43f5e" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: fg(0.95) }}>Data Noise Analysis</h2>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: fg(0.4), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Signal Quality · {columns.length} Columns · {data.length.toLocaleString()} Rows
                        </span>
                    </div>
                    <button
                        onClick={exportNoiseReport}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                            background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.5),
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = bg(0.08); e.currentTarget.style.color = fg(0.8); }}
                        onMouseLeave={e => { e.currentTarget.style.background = bg(0.04); e.currentTarget.style.color = fg(0.5) as string; }}
                        title="Copy noise report to clipboard"
                    >
                        <Download size={12} /> Export
                    </button>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {[
                        { label: 'Avg Noise', value: `${overall.avgNoise.toFixed(1)}%`, color: noiseColor(overall.avgNoise), Icon: Activity },
                        { label: 'Signal-to-Noise', value: `${overall.avgSNR.toFixed(1)}%`, color: snrColor(overall.avgSNR), Icon: Signal },
                        { label: 'Missing Data', value: `${overall.totalMissing.toFixed(1)}%`, color: overall.totalMissing > 10 ? '#f43f5e' : '#10b981', Icon: Eye },
                        { label: 'Avg Outliers', value: `${overall.avgOutlier.toFixed(1)}%`, color: overall.avgOutlier > 10 ? '#f59e0b' : '#10b981', Icon: AlertTriangle },
                    ].map((kpi, i) => (
                        <div key={i} style={{
                            padding: '12px', borderRadius: '14px',
                            background: bg(0.025), border: `1px solid ${bg(0.05)}`,
                            display: 'flex', flexDirection: 'column', gap: '6px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <kpi.Icon size={11} color={kpi.color} />
                                <span style={{ fontSize: '9px', fontWeight: 800, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</span>
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: kpi.color, fontFamily: 'var(--font-mono, monospace)' }}>{kpi.value}</span>
                        </div>
                    ))}
                </div>

                {/* Overall noise gauge */}
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: bg(0.025), border: `1px solid ${bg(0.05)}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: fg(0.5), letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall Data Quality</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: snrColor(overall.avgSNR), fontFamily: 'var(--font-mono, monospace)' }}>
                            {overall.avgSNR >= 70 ? 'EXCELLENT' : overall.avgSNR >= 50 ? 'MODERATE' : 'NEEDS ATTENTION'}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: bg(0.06), overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: `${overall.avgSNR}%`,
                            background: `linear-gradient(90deg, ${noiseColor(100 - overall.avgSNR)}, ${snrColor(overall.avgSNR)})`,
                            boxShadow: `0 0 12px ${snrColor(overall.avgSNR)}40`,
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: fg(0.3) }}>NOISY</span>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: fg(0.3) }}>CLEAN</span>
                    </div>
                </div>

                {/* Noisiest / cleanest callout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    <div style={{
                        padding: '10px 12px', borderRadius: '10px',
                        background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.1)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <TrendingDown size={14} color="#f43f5e" />
                        <div>
                            <div style={{ fontSize: '8px', fontWeight: 800, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Noisiest Column</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono, monospace)' }}>{overall.noisiest}</div>
                        </div>
                    </div>
                    <div style={{
                        padding: '10px 12px', borderRadius: '10px',
                        background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <Zap size={14} color="#10b981" />
                        <div>
                            <div style={{ fontSize: '8px', fontWeight: 800, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cleanest Column</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono, monospace)' }}>{overall.cleanest}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ COLUMN TABLE ═══════ */}
            <div style={{ padding: '0 14px 14px' }}>
                {/* Sort header */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 50px',
                    padding: '8px 12px', marginBottom: '4px', gap: '6px',
                }}>
                    {([
                        ['Column', null],
                        ['Noise', 'noiseScore'],
                        ['SNR', 'signalToNoise'],
                        ['Missing', 'missingPct'],
                    ] as [string, typeof sortBy | null][]).map(([label, key], i) => (
                        <button key={i} onClick={() => key && handleSort(key)} style={{
                            fontSize: '9px', fontWeight: 800, color: sortBy === key ? '#6366f1' : fg(0.4),
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            background: 'none', border: 'none', cursor: key ? 'pointer' : 'default',
                            textAlign: i === 0 ? 'left' : 'right', padding: 0,
                            display: 'flex', alignItems: key ? 'center' : 'flex-start', justifyContent: i === 0 ? 'flex-start' : 'flex-end', gap: '3px',
                        }}>
                            {label}
                            {sortBy === key && <span style={{ fontSize: '8px' }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
                        </button>
                    ))}
                    <span />
                </div>

                {/* Column rows */}
                <div style={{ maxHeight: '320px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: `${bg(0.08)} transparent` }}>
                    {sorted.map((col, idx) => {
                        const expanded = expandedCol === col.column;
                        return (
                            <div key={col.column}>
                                <button
                                    onClick={() => setExpandedCol(expanded ? null : col.column)}
                                    style={{
                                        width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 50px',
                                        padding: '10px 12px', gap: '6px', cursor: 'pointer',
                                        borderRadius: expanded ? '12px 12px 0 0' : '12px',
                                        background: expanded ? bg(0.04) : idx % 2 === 0 ? bg(0.015) : 'transparent',
                                        border: `1px solid ${expanded ? bg(0.06) : 'transparent'}`,
                                        borderBottom: expanded ? 'none' : `1px solid ${expanded ? bg(0.06) : 'transparent'}`,
                                        transition: 'all 0.2s',
                                        alignItems: 'center',
                                    }}
                                    onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = bg(0.04); }}
                                    onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = idx % 2 === 0 ? bg(0.015) : 'transparent'; }}
                                >
                                    {/* Column name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                                        <div style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: noiseColor(col.noiseScore),
                                            boxShadow: `0 0 6px ${noiseColor(col.noiseScore)}60`,
                                        }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: fg(0.85), fontFamily: 'var(--font-mono, monospace)' }}>{col.column}</span>
                                        <span style={{
                                            fontSize: '7px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px',
                                            background: col.type === 'numeric' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: col.type === 'numeric' ? '#818cf8' : '#34d399',
                                            letterSpacing: '0.06em', textTransform: 'uppercase',
                                        }}>{col.type === 'numeric' ? 'NUM' : 'CAT'}</span>
                                    </div>

                                    {/* Noise score with bar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: noiseColor(col.noiseScore), fontFamily: 'var(--font-mono, monospace)' }}>{col.noiseScore.toFixed(1)}%</span>
                                        <div style={{ width: '50px', height: '3px', borderRadius: '2px', background: bg(0.06), overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${col.noiseScore}%`, borderRadius: '2px', background: noiseColor(col.noiseScore), transition: 'width 0.5s' }} />
                                        </div>
                                    </div>

                                    {/* SNR */}
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: snrColor(col.signalToNoise), fontFamily: 'var(--font-mono, monospace)' }}>{col.signalToNoise.toFixed(1)}%</span>
                                    </div>

                                    {/* Missing */}
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: col.missingPct > 5 ? '#f59e0b' : fg(0.5), fontFamily: 'var(--font-mono, monospace)' }}>{col.missingPct.toFixed(1)}%</span>
                                    </div>

                                    {/* Expand icon */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <ChevronRight size={14} style={{ color: fg(0.3), transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                {expanded && (
                                    <div style={{
                                        padding: '14px 16px', borderRadius: '0 0 12px 12px',
                                        background: bg(0.03), border: `1px solid ${bg(0.06)}`, borderTop: 'none',
                                        marginBottom: '4px',
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                                            {col.type === 'numeric' ? (
                                                <>
                                                    <DetailStat label="Variance" value={col.variance.toLocaleString(undefined, { maximumFractionDigits: 2 })} isDark={isDark} />
                                                    <DetailStat label="Std Deviation" value={col.stdDev.toFixed(3)} isDark={isDark} />
                                                    <DetailStat label="Coeff of Variation" value={`${col.coeffOfVar.toFixed(1)}%`} isDark={isDark} />
                                                    <DetailStat label="Outliers (IQR)" value={`${col.outlierPct.toFixed(1)}%`} color={col.outlierPct > 10 ? '#f59e0b' : undefined} isDark={isDark} />
                                                    <DetailStat label="Unique Ratio" value={`${(col.uniqueRatio * 100).toFixed(1)}%`} isDark={isDark} />
                                                    <DetailStat label="Missing" value={`${col.missingPct.toFixed(1)}%`} color={col.missingPct > 5 ? '#f43f5e' : undefined} isDark={isDark} />
                                                </>
                                            ) : (
                                                <>
                                                    <DetailStat label="Shannon Entropy" value={col.entropy.toFixed(3)} isDark={isDark} />
                                                    <DetailStat label="Unique Ratio" value={`${(col.uniqueRatio * 100).toFixed(1)}%`} isDark={isDark} />
                                                    <DetailStat label="Missing" value={`${col.missingPct.toFixed(1)}%`} color={col.missingPct > 5 ? '#f43f5e' : undefined} isDark={isDark} />
                                                </>
                                            )}
                                        </div>

                                        {/* Interpretation callout */}
                                        <div style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
                                            borderRadius: '10px',
                                            background: `${noiseColor(col.noiseScore)}08`,
                                            border: `1px solid ${noiseColor(col.noiseScore)}15`,
                                        }}>
                                            <Info size={13} color={noiseColor(col.noiseScore)} style={{ flexShrink: 0, marginTop: '1px' }} />
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: fg(0.6), lineHeight: 1.5 }}>
                                                {col.noiseScore > 60
                                                    ? `High noise detected in "${col.column}". Consider cleaning outliers, imputing missing values, or applying smoothing before analysis for more reliable results.`
                                                    : col.noiseScore > 35
                                                        ? `Moderate noise in "${col.column}". Signal is usable but could benefit from preprocessing — check for inconsistent formats or partial fills.`
                                                        : `"${col.column}" has clean, low-noise data. Strong signal quality — suitable for direct modeling and insights extraction.`
                                                }
                                            </span>
                                        </div>

                                        {/* Sparkline: Noise across data windows */}
                                        {col.sparkline.length > 2 && (
                                            <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: bg(0.02), border: `1px solid ${bg(0.04)}` }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <Sparkles size={11} color={fg(0.4)} />
                                                    <span style={{ fontSize: '9px', fontWeight: 800, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        Noise Distribution Across Data Windows
                                                    </span>
                                                </div>
                                                <svg width="100%" height="32" viewBox={`0 0 ${col.sparkline.length * 20} 32`} style={{ overflow: 'visible' }}>
                                                    <defs>
                                                        <linearGradient id={`spark-${col.column}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={noiseColor(col.noiseScore)} stopOpacity="0.3" />
                                                            <stop offset="100%" stopColor={noiseColor(col.noiseScore)} stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    <polygon
                                                        points={`0,32 ${col.sparkline.map((v, i) => `${i * 20},${32 - (v / 100) * 30}`).join(' ')} ${(col.sparkline.length - 1) * 20},32`}
                                                        fill={`url(#spark-${col.column})`}
                                                    />
                                                    <polyline
                                                        points={col.sparkline.map((v, i) => `${i * 20},${32 - (v / 100) * 30}`).join(' ')}
                                                        fill="none"
                                                        stroke={noiseColor(col.noiseScore)}
                                                        strokeWidth="1.5"
                                                        strokeLinejoin="round"
                                                    />
                                                    {col.sparkline.map((v, i) => (
                                                        <circle key={i} cx={i * 20} cy={32 - (v / 100) * 30} r="2.5" fill={noiseColor(v)} />
                                                    ))}
                                                </svg>
                                            </div>
                                        )}

                                        {/* Actionable Recommendation */}
                                        {(() => {
                                            const rec = getRecommendation(col);
                                            const prioColor = rec.priority === 'high' ? '#f43f5e' : rec.priority === 'medium' ? '#f59e0b' : '#10b981';
                                            return (
                                                <div style={{
                                                    marginTop: '8px', padding: '10px 12px', borderRadius: '10px',
                                                    background: `${prioColor}06`, border: `1px solid ${prioColor}15`,
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                }}>
                                                    <span style={{
                                                        fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px',
                                                        background: `${prioColor}18`, color: prioColor,
                                                        textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                                                    }}>{rec.priority}</span>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 800, color: fg(0.8) }}>{rec.action}</div>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: fg(0.45), marginTop: '2px' }}>{rec.detail}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/* ── Tiny stat cell ───────────────────────────────────────────── */

const DetailStat: React.FC<{ label: string; value: string; color?: string; isDark?: boolean }> = ({ label, value, color, isDark = true }) => {
    const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(15,23,42,${a})`;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '8px', fontWeight: 800, color: fg(0.35), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: color || fg(0.8), fontFamily: 'var(--font-mono, monospace)' }}>{value}</span>
        </div>
    );
};

export default DataNoiseWidget;
