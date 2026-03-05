// ─── Data Profiler – Next-Level Column Analysis ─────────────────────────────
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Hash, Type, Calendar, AlertTriangle, CheckCircle2,
    ChevronDown, ChevronRight, BarChart3, Eye, EyeOff, Search,
    TrendingUp, TrendingDown, Minus, Layers, Sparkles, Shield
} from 'lucide-react';

interface ColumnProfile {
    name: string;
    type: 'numeric' | 'string' | 'date' | 'boolean' | 'mixed';
    distinctCount: number;
    distinctPercent: number;
    nullCount: number;
    nullPercent: number;
    totalRows: number;
    histogram: number[];
    topValues: { value: string; count: number; percent: number }[];
    stats?: {
        min: number; max: number; mean: number; median: number;
        stdDev: number; skewness: number; q1: number; q3: number;
    };
    qualityScore: number; // 0-100
    outlierCount: number;
}

interface Props {
    data: any[];
    columns?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────

const detectType = (values: any[]): ColumnProfile['type'] => {
    const sample = values.filter(v => v != null && v !== '').slice(0, 100);
    if (sample.length === 0) return 'mixed';
    const numCount = sample.filter(v => !isNaN(Number(v))).length;
    const dateCount = sample.filter(v => !isNaN(Date.parse(String(v))) && String(v).length > 6).length;
    const boolCount = sample.filter(v => ['true', 'false', '0', '1', 'yes', 'no'].includes(String(v).toLowerCase())).length;
    if (boolCount / sample.length > 0.8) return 'boolean';
    if (numCount / sample.length > 0.8) return 'numeric';
    if (dateCount / sample.length > 0.6) return 'date';
    return 'string';
};

const buildHistogram = (values: number[], buckets = 12): number[] => {
    if (!values.length) return Array(buckets).fill(0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const hist = Array(buckets).fill(0);
    values.forEach(v => {
        const idx = Math.min(buckets - 1, Math.floor(((v - min) / range) * buckets));
        hist[idx]++;
    });
    return hist;
};

const computeStats = (nums: number[]) => {
    if (!nums.length) return undefined;
    const sorted = [...nums].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = sorted.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const skewness = n > 2 ? (sorted.reduce((a, v) => a + ((v - mean) / (stdDev || 1)) ** 3, 0) / n) : 0;
    return { min: sorted[0], max: sorted[n - 1], mean, median, stdDev, skewness, q1, q3, iqr };
};

const profileColumn = (data: any[], colName: string): ColumnProfile => {
    const totalRows = data.length;
    const rawValues = data.map(r => r[colName]);
    const nullCount = rawValues.filter(v => v == null || v === '' || v === undefined).length;
    const nonNull = rawValues.filter(v => v != null && v !== '');
    const type = detectType(rawValues);
    const valueCounts: Record<string, number> = {};
    nonNull.forEach(v => { const k = String(v); valueCounts[k] = (valueCounts[k] || 0) + 1; });
    const distinctCount = Object.keys(valueCounts).length;
    const topValues = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count, percent: (count / totalRows) * 100 }));

    let stats: ColumnProfile['stats'] | undefined;
    let histogram: number[] = [];
    let outlierCount = 0;

    if (type === 'numeric') {
        const nums = nonNull.map(Number).filter(n => !isNaN(n));
        const s = computeStats(nums);
        if (s) {
            stats = { min: s.min, max: s.max, mean: s.mean, median: s.median, stdDev: s.stdDev, skewness: s.skewness, q1: s.q1, q3: s.q3 };
            const lowerFence = s.q1 - 1.5 * s.iqr;
            const upperFence = s.q3 + 1.5 * s.iqr;
            outlierCount = nums.filter(n => n < lowerFence || n > upperFence).length;
        }
        histogram = buildHistogram(nums);
    } else {
        // For categorical: histogram of top value frequencies
        histogram = topValues.map(v => v.count);
        while (histogram.length < 5) histogram.push(0);
    }

    // Quality score
    const nullPenalty = Math.max(0, 30 - (nullCount / totalRows) * 100);
    const diversityBonus = Math.min(30, (distinctCount / totalRows) * 100);
    const outlierPenalty = Math.max(0, 20 - (outlierCount / totalRows) * 100);
    const qualityScore = Math.round(Math.min(100, 20 + nullPenalty + diversityBonus + outlierPenalty));

    return {
        name: colName, type, distinctCount, distinctPercent: (distinctCount / totalRows) * 100,
        nullCount, nullPercent: (nullCount / totalRows) * 100,
        totalRows, histogram, topValues, stats, qualityScore, outlierCount
    };
};

// ─── Sub-Components ─────────────────────────────────────────────

const MiniHistogram = ({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) => {
    const max = Math.max(...data, 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height }}>
            {data.map((v, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                    style={{
                        flex: 1, minWidth: '4px', borderRadius: '2px 2px 0 0',
                        background: `linear-gradient(to top, ${color}40, ${color})`,
                        minHeight: v > 0 ? '2px' : '0px'
                    }}
                />
            ))}
        </div>
    );
};

const QualityBadge = ({ score }: { score: number }) => {
    const color = score >= 85 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
    const label = score >= 85 ? 'Excellent' : score >= 60 ? 'Good' : 'Poor';
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '6px',
            background: `${color}15`, border: `1px solid ${color}30`,
            fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            <Shield size={10} />
            {label} · {score}
        </div>
    );
};

const TypeIcon = ({ type }: { type: ColumnProfile['type'] }) => {
    const map: Record<string, { icon: any; color: string }> = {
        numeric: { icon: Hash, color: '#818cf8' },
        string: { icon: Type, color: '#34d399' },
        date: { icon: Calendar, color: '#fbbf24' },
        boolean: { icon: CheckCircle2, color: '#f472b6' },
        mixed: { icon: Layers, color: '#94a3b8' },
    };
    const { icon: Icon, color } = map[type] || map.mixed;
    return (
        <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: `${color}15`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Icon size={14} color={color} />
        </div>
    );
};

const StatPill = ({ label, value, color = 'rgba(255,255,255,0.6)' }: { label: string; value: string; color?: string }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', gap: '2px',
        padding: '6px 10px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
    }}>
        <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color }}>{value}</span>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────

export const DataProfiler = ({ data, columns: propColumns }: Props) => {
    const [expandedCol, setExpandedCol] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'quality' | 'nulls' | 'type'>('name');
    const [showNullsOnly, setShowNullsOnly] = useState(false);

    const profiles = useMemo(() => {
        if (!data?.length) return [];
        const cols = propColumns || Object.keys(data[0]);
        return cols.map(col => profileColumn(data, col));
    }, [data, propColumns]);

    const overallHealth = useMemo(() => {
        if (!profiles.length) return 0;
        return Math.round(profiles.reduce((s, p) => s + p.qualityScore, 0) / profiles.length);
    }, [profiles]);

    const typeBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        profiles.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
        return counts;
    }, [profiles]);

    const filtered = useMemo(() => {
        let list = [...profiles];
        if (searchTerm) list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (showNullsOnly) list = list.filter(p => p.nullCount > 0);
        list.sort((a, b) => {
            if (sortBy === 'quality') return a.qualityScore - b.qualityScore;
            if (sortBy === 'nulls') return b.nullPercent - a.nullPercent;
            if (sortBy === 'type') return a.type.localeCompare(b.type);
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [profiles, searchTerm, sortBy, showNullsOnly]);

    if (!data?.length) return null;

    const COLORS: Record<string, string> = { numeric: '#818cf8', string: '#34d399', date: '#fbbf24', boolean: '#f472b6', mixed: '#94a3b8' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Overall Health Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(18,18,24,0.9) 0%, rgba(8,8,12,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px', padding: '24px 28px', marginBottom: '16px',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #818cf860, #34d399, #818cf860, transparent)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(52,211,153,0.08))',
                            border: '1px solid rgba(129,140,248,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Sparkles size={24} color="#818cf8" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
                                Data Profiler
                            </h3>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>
                                {profiles.length} columns · {data.length.toLocaleString()} rows · Deep structural analysis
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Type breakdown pills */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Object.entries(typeBreakdown).map(([type, count]) => (
                                <div key={type} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 10px', borderRadius: '8px',
                                    background: `${COLORS[type]}12`, border: `1px solid ${COLORS[type]}25`,
                                    fontSize: '10px', fontWeight: 700, color: COLORS[type]
                                }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{count}</span>
                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</span>
                                </div>
                            ))}
                        </div>

                        {/* Overall health ring */}
                        <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                            <svg width="52" height="52" viewBox="0 0 52 52">
                                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                <motion.circle
                                    cx="26" cy="26" r="22" fill="none"
                                    stroke={overallHealth >= 80 ? '#34d399' : overallHealth >= 60 ? '#fbbf24' : '#f87171'}
                                    strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - overallHealth / 100) }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    transform="rotate(-90 26 26)"
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'monospace', fontSize: '13px', fontWeight: 900, color: '#fff'
                            }}>
                                {overallHealth}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters Bar */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px',
                    padding: '8px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <Search size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Search columns..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#fff', fontSize: '12px', fontWeight: 600, width: '100%'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {(['name', 'quality', 'nulls', 'type'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            style={{
                                padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                background: sortBy === s ? 'rgba(129,140,248,0.2)' : 'transparent',
                                color: sortBy === s ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowNullsOnly(!showNullsOnly)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: showNullsOnly ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
                        color: showNullsOnly ? '#f87171' : 'rgba(255,255,255,0.4)',
                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderWidth: '1px', borderStyle: 'solid',
                        borderColor: showNullsOnly ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.06)',
                        transition: 'all 0.2s'
                    }}
                >
                    {showNullsOnly ? <EyeOff size={12} /> : <Eye size={12} />}
                    Nulls Only
                </button>
            </div>

            {/* Column Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence mode="popLayout">
                    {filtered.map((profile, idx) => {
                        const isExpanded = expandedCol === profile.name;
                        const typeColor = COLORS[profile.type] || COLORS.mixed;

                        return (
                            <motion.div
                                key={profile.name}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.02 }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(18,18,24,0.85) 0%, rgba(8,8,12,0.95) 100%)',
                                    border: `1px solid ${isExpanded ? `${typeColor}30` : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '16px', overflow: 'hidden',
                                    transition: 'border-color 0.3s ease'
                                }}
                            >
                                {/* Collapsed Row */}
                                <div
                                    onClick={() => setExpandedCol(isExpanded ? null : profile.name)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px 20px', cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <TypeIcon type={profile.type} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{profile.name}</span>
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profile.type}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{profile.distinctCount}</span> distinct
                                            </span>
                                            <span style={{ fontSize: '10px', color: profile.nullCount > 0 ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.4)' }}>
                                                <span style={{ fontFamily: 'monospace' }}>{profile.nullPercent.toFixed(1)}%</span> null
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini histogram */}
                                    <div style={{ width: '80px', flexShrink: 0 }}>
                                        <MiniHistogram data={profile.histogram} color={typeColor} height={28} />
                                    </div>

                                    <QualityBadge score={profile.qualityScore} />

                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    </motion.div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{
                                                padding: '0 20px 20px 20px',
                                                borderTop: '1px solid rgba(255,255,255,0.04)'
                                            }}>
                                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                                                    {/* Stats */}
                                                    {profile.stats && (
                                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                                            <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                                                                Statistical Summary
                                                            </h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '6px' }}>
                                                                <StatPill label="Min" value={profile.stats.min.toLocaleString()} />
                                                                <StatPill label="Max" value={profile.stats.max.toLocaleString()} />
                                                                <StatPill label="Mean" value={profile.stats.mean.toFixed(2)} color="#818cf8" />
                                                                <StatPill label="Median" value={profile.stats.median.toFixed(2)} />
                                                                <StatPill label="Std Dev" value={profile.stats.stdDev.toFixed(2)} />
                                                                <StatPill label="Q1" value={profile.stats.q1.toFixed(2)} />
                                                                <StatPill label="Q3" value={profile.stats.q3.toFixed(2)} />
                                                                <StatPill label="Skew" value={profile.stats.skewness.toFixed(3)} color={Math.abs(profile.stats.skewness) > 1 ? '#f87171' : '#34d399'} />
                                                            </div>
                                                            {profile.outlierCount > 0 && (
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                    marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                                                                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                                                                    fontSize: '11px', color: '#f87171'
                                                                }}>
                                                                    <AlertTriangle size={14} />
                                                                    <span><strong>{profile.outlierCount}</strong> outliers detected ({((profile.outlierCount / profile.totalRows) * 100).toFixed(1)}% of rows)</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Distribution Histogram (expanded) */}
                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                                                            {profile.type === 'numeric' ? 'Value Distribution' : 'Top Values'}
                                                        </h4>
                                                        {profile.type === 'numeric' ? (
                                                            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                                <MiniHistogram data={profile.histogram} color={typeColor} height={60} />
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                                                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>{profile.stats?.min.toFixed(1)}</span>
                                                                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>{profile.stats?.max.toFixed(1)}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {profile.topValues.map((tv, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, minWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {tv.value}
                                                                        </span>
                                                                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${tv.percent}%` }}
                                                                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                                                                style={{ height: '100%', borderRadius: '3px', background: `linear-gradient(90deg, ${typeColor}60, ${typeColor})` }}
                                                                            />
                                                                        </div>
                                                                        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', minWidth: '40px', textAlign: 'right' }}>
                                                                            {tv.count}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Null & Quality */}
                                                    <div style={{ minWidth: '160px' }}>
                                                        <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                                                            Completeness
                                                        </h4>
                                                        <div style={{
                                                            padding: '14px', borderRadius: '12px',
                                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                                            display: 'flex', flexDirection: 'column', gap: '10px'
                                                        }}>
                                                            <div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Filled</span>
                                                                    <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{(100 - profile.nullPercent).toFixed(1)}%</span>
                                                                </div>
                                                                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${100 - profile.nullPercent}%` }}
                                                                        transition={{ duration: 0.8 }}
                                                                        style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #34d39960, #34d399)' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Nulls</span>
                                                                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: profile.nullCount > 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                                                                    {profile.nullCount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Distinct</span>
                                                                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#818cf8' }}>
                                                                    {profile.distinctCount.toLocaleString()} ({profile.distinctPercent.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
