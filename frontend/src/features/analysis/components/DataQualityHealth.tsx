import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
    Database, Hash, Type, Calendar, ToggleLeft, TrendingUp,
    Eye, Fingerprint, BarChart3
} from 'lucide-react';

interface DataQualityProps {
    data: any[];
    columns: string[];
}

interface ColumnQuality {
    name: string;
    type: string;
    completeness: number; // 0-1
    uniqueness: number; // ratio of unique values
    nullCount: number;
    totalCount: number;
    distinctCount: number;
    duplicateCount: number;
    issues: string[];
    score: number; // 0-100
}

function detectType(values: any[]): string {
    const sample = values.filter(v => v != null && v !== '').slice(0, 100);
    if (sample.length === 0) return 'empty';

    const numCount = sample.filter(v => !isNaN(Number(v))).length;
    const dateCount = sample.filter(v => {
        if (typeof v !== 'string') return false;
        return !isNaN(new Date(v).getTime()) && /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(v);
    }).length;
    const boolCount = sample.filter(v =>
        typeof v === 'boolean' || ['true', 'false', '0', '1', 'yes', 'no'].includes(String(v).toLowerCase())
    ).length;

    if (dateCount > sample.length * 0.7) return 'date';
    if (boolCount > sample.length * 0.7) return 'boolean';
    if (numCount > sample.length * 0.7) return 'number';
    return 'text';
}

const TYPE_ICONS: Record<string, any> = {
    number: <Hash size={12} />,
    text: <Type size={12} />,
    date: <Calendar size={12} />,
    boolean: <ToggleLeft size={12} />,
    empty: <XCircle size={12} />
};

const TYPE_COLORS: Record<string, string> = {
    number: '#61afef',
    text: '#98c379',
    date: '#e5c07b',
    boolean: '#c678dd',
    empty: '#ef4444'
};

export const DataQualityHealth = ({ data, columns }: DataQualityProps) => {
    const qualityData = useMemo((): {
        columns: ColumnQuality[];
        overallScore: number;
        totalRecords: number;
        totalNulls: number;
        completeness: number;
        typeBreakdown: Record<string, number>;
    } => {
        if (!data || data.length === 0) return {
            columns: [], overallScore: 0, totalRecords: 0,
            totalNulls: 0, completeness: 0, typeBreakdown: {}
        };

        const typeBreakdown: Record<string, number> = {};
        let totalNulls = 0;

        const colQuality: ColumnQuality[] = columns.map(col => {
            const values = data.map(r => r[col]);
            const type = detectType(values);
            typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

            const nullCount = values.filter(v => v == null || v === '' || v === undefined).length;
            totalNulls += nullCount;
            const completeness = 1 - (nullCount / values.length);

            const unique = new Set(values.filter(v => v != null && v !== ''));
            const distinctCount = unique.size;
            const nonNullCount = values.length - nullCount;
            const uniqueness = nonNullCount > 0 ? distinctCount / nonNullCount : 0;
            const duplicateCount = nonNullCount - distinctCount;

            // Detect issues
            const issues: string[] = [];
            if (completeness < 0.5) issues.push('High null rate');
            if (completeness < 0.95 && completeness >= 0.5) issues.push('Missing values');
            if (uniqueness === 1 && nonNullCount > 10) issues.push('Potential ID column');
            if (uniqueness < 0.01 && nonNullCount > 10) issues.push('Low cardinality');
            if (type === 'number') {
                const nums = values.filter(v => !isNaN(Number(v))).map(Number);
                if (nums.length > 3) {
                    const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
                    const std = Math.sqrt(nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length);
                    const outliers = nums.filter(n => Math.abs(n - mean) > 3 * std).length;
                    if (outliers > 0) issues.push(`${outliers} outlier${outliers > 1 ? 's' : ''}`);
                }
            }

            // Calculate quality score
            let score = completeness * 40; // 40% weight on completeness
            score += Math.min(uniqueness * 100, 30); // 30% on uniqueness (capped)
            score += (issues.length === 0 ? 30 : Math.max(0, 30 - issues.length * 10)); // 30% on no-issues

            return {
                name: col, type, completeness,
                uniqueness, nullCount, totalCount: values.length,
                distinctCount, duplicateCount, issues,
                score: Math.min(100, Math.round(score))
            };
        });

        const overallScore = colQuality.length > 0
            ? Math.round(colQuality.reduce((s, c) => s + c.score, 0) / colQuality.length)
            : 0;

        const totalCells = data.length * columns.length;
        const completeness = totalCells > 0 ? 1 - (totalNulls / totalCells) : 0;

        return {
            columns: colQuality,
            overallScore,
            totalRecords: data.length,
            totalNulls,
            completeness,
            typeBreakdown
        };
    }, [data, columns]);

    if (!data || data.length === 0) return null;

    const scoreColor = qualityData.overallScore >= 90 ? '#34d399' :
        qualityData.overallScore >= 70 ? '#f59e0b' :
            qualityData.overallScore >= 50 ? '#f97316' : '#ef4444';

    const scoreLabel = qualityData.overallScore >= 90 ? 'Excellent' :
        qualityData.overallScore >= 70 ? 'Good' :
            qualityData.overallScore >= 50 ? 'Fair' : 'Needs Attention';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                borderRadius: '20px',
                background: 'linear-gradient(160deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                backdropFilter: 'blur(24px)'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: `${scoreColor}12`,
                        border: `1px solid ${scoreColor}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: scoreColor
                    }}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                            Data Quality Health
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                            Automated quality assessment · {qualityData.totalRecords.toLocaleString()} records · {columns.length} columns
                        </p>
                    </div>
                </div>

                {/* Overall Score Ring */}
                <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="23" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
                        <motion.circle
                            cx="28" cy="28" r="23" fill="none"
                            stroke={scoreColor}
                            strokeWidth="4"
                            strokeDasharray={`${qualityData.overallScore * 1.445} 144.5`}
                            strokeLinecap="round"
                            transform="rotate(-90 28 28)"
                            initial={{ strokeDasharray: '0 144.5' }}
                            animate={{ strokeDasharray: `${qualityData.overallScore * 1.445} 144.5` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor, fontFamily: 'monospace' }}>
                            {qualityData.overallScore}
                        </span>
                        <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                            Score
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                {[
                    { label: 'Quality Score', value: `${qualityData.overallScore}%`, sub: scoreLabel, color: scoreColor, icon: <ShieldCheck size={14} /> },
                    { label: 'Completeness', value: `${(qualityData.completeness * 100).toFixed(1)}%`, sub: `${qualityData.totalNulls} nulls`, color: qualityData.completeness >= 0.95 ? '#34d399' : '#f59e0b', icon: <Database size={14} /> },
                    { label: 'Issues Found', value: qualityData.columns.reduce((s, c) => s + c.issues.length, 0).toString(), sub: qualityData.columns.filter(c => c.issues.length > 0).length + ' columns', color: qualityData.columns.some(c => c.issues.length > 0) ? '#f59e0b' : '#34d399', icon: <AlertTriangle size={14} /> },
                    { label: 'Data Types', value: Object.keys(qualityData.typeBreakdown).length.toString(), sub: Object.entries(qualityData.typeBreakdown).map(([k, v]) => `${v} ${k}`).join(', '), color: '#6366f1', icon: <Fingerprint size={14} /> }
                ].map((stat, i) => (
                    <div key={i} style={{
                        padding: '14px 16px',
                        borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: '4px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stat.color, opacity: 0.6 }}>
                            {stat.icon}
                            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {stat.label}
                            </span>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: stat.color }}>
                            {stat.value}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stat.sub}
                        </span>
                    </div>
                ))}
            </div>

            {/* Column Quality Bars */}
            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <Eye size={12} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                        Column Health Overview
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {qualityData.columns.map((col, i) => {
                        const colColor = col.score >= 80 ? '#34d399' :
                            col.score >= 60 ? '#f59e0b' : '#ef4444';

                        return (
                            <motion.div
                                key={col.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '6px 8px', borderRadius: '8px'
                                }}
                                className="hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                {/* Type icon */}
                                <span style={{ color: TYPE_COLORS[col.type] || '#fff', flexShrink: 0 }}>
                                    {TYPE_ICONS[col.type] || <Type size={12} />}
                                </span>

                                {/* Column name */}
                                <span style={{
                                    fontSize: '11px', fontFamily: 'monospace',
                                    color: 'var(--text-secondary)',
                                    width: '140px', overflow: 'hidden',
                                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}>
                                    {col.name}
                                </span>

                                {/* Health bar */}
                                <div style={{
                                    flex: 1, height: '6px', borderRadius: '3px',
                                    background: 'var(--bg-card)',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${col.score}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', borderRadius: '3px',
                                            background: `linear-gradient(90deg, ${colColor}cc, ${colColor})`,
                                            boxShadow: `0 0 8px ${colColor}40`
                                        }}
                                    />
                                </div>

                                {/* Score */}
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, fontFamily: 'monospace',
                                    color: colColor, width: '32px', textAlign: 'right', flexShrink: 0
                                }}>
                                    {col.score}%
                                </span>

                                {/* Completeness */}
                                <span style={{
                                    fontSize: '9px', fontFamily: 'monospace',
                                    color: 'var(--text-tertiary)',
                                    width: '40px', textAlign: 'right', flexShrink: 0
                                }}>
                                    {col.nullCount > 0 ? `${col.nullCount}∅` : '✓'}
                                </span>

                                {/* Issues indicator */}
                                {col.issues.length > 0 && (
                                    <div
                                        style={{
                                            padding: '2px 6px', borderRadius: '4px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.15)',
                                            fontSize: '8px', fontWeight: 700,
                                            color: '#f59e0b', whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}
                                        title={col.issues.join(', ')}
                                    >
                                        {col.issues[0]}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
