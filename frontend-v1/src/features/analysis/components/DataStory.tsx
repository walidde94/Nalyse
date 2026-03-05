// ─── DataStory — AI-Generated Narrative Insights ────────────────────────────
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Target, ChevronDown, Sparkles, BarChart3, Minus, Layers
} from 'lucide-react';

interface Props {
    data: any[];
    columns: string[];
    dimensions: string[];
    measures: string[];
    analysisType?: string;
}

interface StorySection {
    title: string;
    icon: any;
    color: string;
    paragraphs: string[];
    stats: { label: string; value: string; color: string }[];
}

const fmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v % 1 === 0 ? v.toLocaleString() : v.toFixed(2);
};

export const DataStory = ({ data, columns, dimensions, measures, analysisType }: Props) => {
    const [expanded, setExpanded] = useState(true);

    const story = useMemo<StorySection[]>(() => {
        if (!data?.length || !columns.length) return [];

        const sections: StorySection[] = [];
        const totalRows = data.length;
        const totalCols = columns.length;

        // ─── 1. Data Overview ────────────────────────────────────────
        const nullCounts: Record<string, number> = {};
        columns.forEach(col => {
            nullCounts[col] = data.filter(r => r[col] == null || r[col] === '').length;
        });
        const totalNulls = Object.values(nullCounts).reduce((a, b) => a + b, 0);
        const totalCells = totalRows * totalCols;
        const completeness = ((1 - totalNulls / totalCells) * 100).toFixed(1);
        const worstCol = Object.entries(nullCounts).sort((a, b) => b[1] - a[1])[0];

        sections.push({
            title: 'Dataset Overview',
            icon: Layers,
            color: '#818cf8',
            paragraphs: [
                `This dataset contains **${totalRows.toLocaleString()} records** across **${totalCols} attributes**, with **${dimensions.length} categorical** and **${measures.length} numerical** fields.`,
                `Overall data completeness stands at **${completeness}%** (${totalNulls.toLocaleString()} missing values across ${totalCells.toLocaleString()} cells).${worstCol && worstCol[1] > 0 ? ` The column with the most missing data is "${worstCol[0]}" with ${worstCol[1]} nulls (${((worstCol[1] / totalRows) * 100).toFixed(1)}%).` : ' No significant null patterns detected.'}`
            ],
            stats: [
                { label: 'Records', value: totalRows.toLocaleString(), color: '#818cf8' },
                { label: 'Attributes', value: totalCols.toString(), color: '#34d399' },
                { label: 'Completeness', value: `${completeness}%`, color: parseFloat(completeness) > 95 ? '#34d399' : '#fbbf24' },
                { label: 'Dimensions', value: dimensions.length.toString(), color: '#f472b6' }
            ]
        });

        // ─── 2. Key Measures ─────────────────────────────────────────
        if (measures.length > 0) {
            const measureInsights: string[] = [];
            const measureStats: { label: string; value: string; color: string }[] = [];

            measures.slice(0, 4).forEach(col => {
                const nums = data.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
                if (nums.length === 0) return;
                const sum = nums.reduce((a, b) => a + b, 0);
                const avg = sum / nums.length;
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const range = max - min;
                const sorted = [...nums].sort((a, b) => a - b);
                const median = nums.length % 2 === 0 ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2 : sorted[Math.floor(nums.length / 2)];
                const stdDev = Math.sqrt(nums.reduce((a, v) => a + (v - avg) ** 2, 0) / nums.length);
                const cv = avg !== 0 ? (stdDev / Math.abs(avg)) * 100 : 0;

                const volatility = cv > 50 ? 'high volatility' : cv > 20 ? 'moderate variability' : 'stable distribution';
                const skewDir = median > avg ? 'left-skewed (median exceeds mean)' : median < avg * 0.9 ? 'right-skewed (mean exceeds median)' : 'approximately symmetric';

                measureInsights.push(
                    `**${col}**: Sum of ${fmt(sum)}, averaging ${fmt(avg)} per record. Range spans ${fmt(min)} to ${fmt(max)} (${fmt(range)} spread) with ${volatility}. Distribution is ${skewDir}.`
                );

                measureStats.push({ label: col, value: fmt(sum), color: '#818cf8' });
            });

            if (measureInsights.length > 0) {
                sections.push({
                    title: 'Key Measures Analysis',
                    icon: BarChart3,
                    color: '#34d399',
                    paragraphs: measureInsights,
                    stats: measureStats
                });
            }
        }

        // ─── 3. Dimension Breakdown ──────────────────────────────────
        if (dimensions.length > 0) {
            const dimInsights: string[] = [];
            const dimStats: { label: string; value: string; color: string }[] = [];

            dimensions.slice(0, 3).forEach(dim => {
                const valueCounts: Record<string, number> = {};
                data.forEach(r => {
                    const v = String(r[dim] ?? '');
                    if (v) valueCounts[v] = (valueCounts[v] || 0) + 1;
                });
                const entries = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
                const distinctCount = entries.length;
                const topVal = entries[0];
                const bottomVal = entries[entries.length - 1];
                const topShare = topVal ? ((topVal[1] / totalRows) * 100).toFixed(1) : '0';
                const concentration = entries.length > 1 ? (entries[0][1] / entries[entries.length - 1][1]).toFixed(1) : '1';

                dimInsights.push(
                    `**${dim}** has ${distinctCount} unique categories. "${topVal?.[0]}" dominates at ${topShare}% share (${topVal?.[1]} records), while "${bottomVal?.[0]}" is the least frequent at ${bottomVal?.[1]} records. Concentration ratio: ${concentration}:1.`
                );
                dimStats.push({ label: dim, value: `${distinctCount} cats`, color: '#f472b6' });
            });

            if (dimInsights.length > 0) {
                sections.push({
                    title: 'Segment Distribution',
                    icon: Target,
                    color: '#f472b6',
                    paragraphs: dimInsights,
                    stats: dimStats
                });
            }
        }

        // ─── 4. Correlations / Patterns ──────────────────────────────
        if (measures.length >= 2) {
            const m1 = measures[0], m2 = measures[1];
            const pairs = data
                .map(r => [parseFloat(r[m1]), parseFloat(r[m2])])
                .filter(([a, b]) => !isNaN(a) && !isNaN(b));

            if (pairs.length > 5) {
                const n = pairs.length;
                const sumX = pairs.reduce((s, p) => s + p[0], 0);
                const sumY = pairs.reduce((s, p) => s + p[1], 0);
                const sumXY = pairs.reduce((s, p) => s + p[0] * p[1], 0);
                const sumX2 = pairs.reduce((s, p) => s + p[0] ** 2, 0);
                const sumY2 = pairs.reduce((s, p) => s + p[1] ** 2, 0);
                const denom = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
                const corr = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;

                const strength = Math.abs(corr) > 0.7 ? 'strong' : Math.abs(corr) > 0.3 ? 'moderate' : 'weak';
                const direction = corr > 0 ? 'positive' : corr < 0 ? 'negative' : 'no';

                sections.push({
                    title: 'Pattern Recognition',
                    icon: Sparkles,
                    color: '#fbbf24',
                    paragraphs: [
                        `Between "${m1}" and "${m2}", there is a **${strength} ${direction} correlation** (r = ${corr.toFixed(3)}). ${Math.abs(corr) > 0.5 ? `This suggests a meaningful relationship — as ${m1} ${corr > 0 ? 'increases' : 'decreases'}, ${m2} tends to ${corr > 0 ? 'increase' : 'decrease'} proportionally.` : 'The relationship is not strong enough to suggest a causal dependency.'}`
                    ],
                    stats: [
                        { label: 'Correlation', value: corr.toFixed(3), color: Math.abs(corr) > 0.5 ? '#34d399' : '#fbbf24' },
                        { label: 'Strength', value: strength, color: Math.abs(corr) > 0.7 ? '#34d399' : '#fbbf24' },
                        { label: 'Sample Size', value: n.toLocaleString(), color: '#818cf8' }
                    ]
                });
            }
        }

        return sections;
    }, [data, columns, dimensions, measures]);

    if (!story.length) return null;

    const renderMarkdown = (text: string) => {
        return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px', overflow: 'hidden', position: 'relative'
            }}
        >
            {/* Top accent */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf2460, #f472b6, #818cf860, transparent)' }} />

            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(244,114,182,0.08))',
                        border: '1px solid rgba(251,191,36,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BookOpen size={22} color="#fbbf24" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                            Data Story
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            AI-generated narrative · {story.length} insights discovered
                        </p>
                    </div>
                </div>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />
                </motion.div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {story.map((section, i) => {
                                const Icon = section.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            padding: '20px', borderRadius: '14px',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: `${section.color}15`, border: `1px solid ${section.color}25`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Icon size={16} color={section.color} />
                                            </div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{section.title}</h4>
                                        </div>

                                        {/* Stats micro-bar */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                            {section.stats.map((stat, si) => (
                                                <div key={si} style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '4px 10px', borderRadius: '8px',
                                                    background: `${stat.color}10`, border: `1px solid ${stat.color}20`,
                                                    fontSize: '10px'
                                                }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                                                    <span style={{ color: stat.color, fontFamily: 'monospace', fontWeight: 900 }}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {section.paragraphs.map((p, pi) => (
                                            <p
                                                key={pi}
                                                style={{
                                                    fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)',
                                                    margin: pi === section.paragraphs.length - 1 ? 0 : '0 0 10px 0'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }}
                                            />
                                        ))}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
