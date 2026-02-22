import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb, TrendingUp, AlertTriangle, Shield, Users,
    Zap, Filter, Search, ChevronDown, Pin, PinOff,
    ArrowUpRight, ArrowDownRight, Minus, BarChart3,
    Target, Layers, Eye, EyeOff, SortAsc, SortDesc,
    Sparkles, Brain, Activity, CheckCircle2
} from 'lucide-react';

interface InsightsDashboardProps {
    insights: any[];
    onPinInsight?: (insight: any) => void;
    pinnedInsights?: any[];
}

type InsightCategory = 'all' | 'anomaly' | 'trend' | 'quality' | 'segment' | 'correlation' | 'pattern';
type SortMode = 'confidence' | 'type' | 'recent';

const CATEGORY_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    icon: any;
    gradient: string;
}> = {
    anomaly: {
        label: 'Anomaly',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.08)',
        icon: <AlertTriangle size={14} />,
        gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))'
    },
    trend: {
        label: 'Trend',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        icon: <TrendingUp size={14} />,
        gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))'
    },
    quality: {
        label: 'Quality',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.08)',
        icon: <Shield size={14} />,
        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))'
    },
    segment: {
        label: 'Segment',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.08)',
        icon: <Users size={14} />,
        gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.02))'
    },
    correlation: {
        label: 'Correlation',
        color: '#a78bfa',
        bgColor: 'rgba(167, 139, 250, 0.08)',
        icon: <Activity size={14} />,
        gradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(167, 139, 250, 0.02))'
    },
    pattern: {
        label: 'Pattern',
        color: '#818cf8',
        bgColor: 'rgba(129, 140, 248, 0.08)',
        icon: <Sparkles size={14} />,
        gradient: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(129, 140, 248, 0.02))'
    }
};

const getConfig = (type: string) => CATEGORY_CONFIG[type] || {
    label: type || 'Insight',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.08)',
    icon: <Lightbulb size={14} />,
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02))'
};

export const InsightsDashboard = ({ insights, onPinInsight, pinnedInsights = [] }: InsightsDashboardProps) => {
    const [activeCategory, setActiveCategory] = useState<InsightCategory>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('confidence');
    const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [minConfidence, setMinConfidence] = useState(0);

    // Category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: insights.length };
        insights.forEach(i => {
            const t = i.type || 'pattern';
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [insights]);

    // Summary stats
    const summaryStats = useMemo(() => {
        if (insights.length === 0) return null;

        const avgConfidence = insights.reduce((s, i) => s + (i.confidence || 0), 0) / insights.length;
        const highConfidence = insights.filter(i => (i.confidence || 0) >= 0.8).length;
        const anomalies = insights.filter(i => i.type === 'anomaly').length;
        const categories = new Set(insights.map(i => i.type || 'pattern')).size;

        return { avgConfidence, highConfidence, anomalies, categories, total: insights.length };
    }, [insights]);

    // Filter & sort
    const filteredInsights = useMemo(() => {
        let result = [...insights];

        // Category filter
        if (activeCategory !== 'all') {
            result = result.filter(i => (i.type || 'pattern') === activeCategory);
        }

        // Search filter
        if (searchTerm) {
            result = result.filter(i =>
                (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (i.type || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Confidence filter
        if (minConfidence > 0) {
            result = result.filter(i => (i.confidence || 0) >= minConfidence / 100);
        }

        // Pin filter
        if (showPinnedOnly) {
            const pinnedDescs = new Set(pinnedInsights.map(p => p.description));
            result = result.filter(i => pinnedDescs.has(i.description));
        }

        // Sort
        result.sort((a, b) => {
            switch (sortMode) {
                case 'confidence':
                    return (b.confidence || 0) - (a.confidence || 0);
                case 'type':
                    return (a.type || '').localeCompare(b.type || '');
                default:
                    return 0;
            }
        });

        return result;
    }, [insights, activeCategory, searchTerm, sortMode, minConfidence, showPinnedOnly, pinnedInsights]);

    const isPinned = (insight: any) => pinnedInsights.some(p => p.description === insight.description);

    if (insights.length === 0) {
        return (
            <div className="fade-in" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 40px', gap: '16px', opacity: 0.4
            }}>
                <Brain size={48} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>No Insights Generated</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    The AI engine hasn't detected any notable insights in this dataset yet.
                </p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Summary Dashboard ── */}
            {summaryStats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                }}>
                    {[
                        {
                            label: 'Total Insights',
                            value: summaryStats.total,
                            sub: `across ${summaryStats.categories} categories`,
                            color: '#6366f1',
                            icon: <Lightbulb size={16} />
                        },
                        {
                            label: 'Avg Confidence',
                            value: `${(summaryStats.avgConfidence * 100).toFixed(0)}%`,
                            sub: `${summaryStats.highConfidence} high-confidence`,
                            color: '#34d399',
                            icon: <Target size={16} />
                        },
                        {
                            label: 'Anomalies Detected',
                            value: summaryStats.anomalies,
                            sub: summaryStats.anomalies > 0 ? 'requires attention' : 'no issues found',
                            color: summaryStats.anomalies > 0 ? '#ef4444' : '#34d399',
                            icon: <AlertTriangle size={16} />
                        },
                        {
                            label: 'Pinned Insights',
                            value: pinnedInsights.length,
                            sub: 'saved for review',
                            color: '#f59e0b',
                            icon: <Pin size={16} />
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: `linear-gradient(135deg, ${stat.color}08, transparent)`,
                                border: `1px solid ${stat.color}15`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Subtle glow */}
                            <div style={{
                                position: 'absolute', top: '-20px', right: '-20px',
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: `${stat.color}10`, filter: 'blur(20px)'
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <span style={{ color: stat.color, opacity: 0.6 }}>{stat.icon}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                                    {stat.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                                {stat.sub}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Controls Bar ── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                {/* Category Filters (scrollable chips) */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1, minWidth: '200px' }}>
                    {(['all', ...Object.keys(CATEGORY_CONFIG)] as InsightCategory[]).map(cat => {
                        const count = categoryCounts[cat] || 0;
                        if (cat !== 'all' && count === 0) return null;
                        const cfg = cat === 'all' ? { label: 'All', color: '#6366f1', icon: <Layers size={12} /> } : getConfig(cat);
                        const isActive = activeCategory === cat;

                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '4px 10px', borderRadius: '8px',
                                    background: isActive ? `${cfg.color}20` : 'transparent',
                                    border: `1px solid ${isActive ? `${cfg.color}40` : 'rgba(255,255,255,0.06)'}`,
                                    color: isActive ? cfg.color : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '10px', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                                className={isActive ? '' : 'hover:bg-white/5'}
                            >
                                {cfg.icon}
                                {cfg.label}
                                <span style={{
                                    fontSize: '9px', padding: '1px 4px', borderRadius: '4px',
                                    background: isActive ? `${cfg.color}30` : 'rgba(255,255,255,0.06)',
                                    fontFamily: 'monospace'
                                }}>
                                    {cat === 'all' ? insights.length : count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                    padding: '4px 8px', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <Search size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input
                        type="text"
                        placeholder="Search insights..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#fff', fontSize: '11px', width: '130px'
                        }}
                    />
                </div>

                {/* Confidence slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)' }}>
                        Min {minConfidence}%
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={minConfidence}
                        onChange={e => setMinConfidence(Number(e.target.value))}
                        style={{ width: '60px', accentColor: '#34d399' }}
                    />
                </div>

                {/* Sort */}
                <button
                    onClick={() => setSortMode(m => m === 'confidence' ? 'type' : 'confidence')}
                    style={{
                        padding: '4px 8px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                        fontSize: '10px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                >
                    <SortDesc size={11} />
                    {sortMode === 'confidence' ? 'Confidence' : 'Type'}
                </button>

                {/* Pin toggle */}
                <button
                    onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                    style={{
                        padding: '4px 8px', borderRadius: '6px',
                        background: showPinnedOnly ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${showPinnedOnly ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                        color: showPinnedOnly ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                >
                    {showPinnedOnly ? <Eye size={11} /> : <EyeOff size={11} />}
                    Pinned
                </button>
            </div>

            {/* ── Insights Grid ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence mode="popLayout">
                    {filteredInsights.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                padding: '48px', textAlign: 'center',
                                color: 'rgba(255,255,255,0.3)', fontSize: '13px'
                            }}
                        >
                            No insights match your current filters. Try adjusting the criteria.
                        </motion.div>
                    ) : (
                        filteredInsights.map((insight, i) => {
                            const cfg = getConfig(insight.type);
                            const isExpanded = expandedInsight === i;
                            const pinned = isPinned(insight);
                            const confidence = (insight.confidence || 0);
                            const confidenceLabel = confidence >= 0.9 ? 'Very High' :
                                confidence >= 0.75 ? 'High' :
                                    confidence >= 0.5 ? 'Medium' : 'Low';

                            return (
                                <motion.div
                                    key={`${insight.type}-${i}`}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                    style={{
                                        borderRadius: '14px',
                                        background: cfg.gradient,
                                        border: `1px solid ${cfg.color}15`,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.3s, box-shadow 0.3s'
                                    }}
                                    onClick={() => setExpandedInsight(isExpanded ? null : i)}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = `${cfg.color}30`;
                                        e.currentTarget.style.boxShadow = `0 4px 20px ${cfg.color}10`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = `${cfg.color}15`;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Main Row */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px 18px'
                                    }}>
                                        {/* Category icon */}
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: `${cfg.color}12`,
                                            border: `1px solid ${cfg.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: cfg.color, flexShrink: 0
                                        }}>
                                            {cfg.icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 800,
                                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                                    color: cfg.color, padding: '2px 6px',
                                                    borderRadius: '4px', background: `${cfg.color}15`
                                                }}>
                                                    {cfg.label}
                                                </span>
                                                {pinned && (
                                                    <Pin size={10} style={{ color: '#f59e0b' }} />
                                                )}
                                            </div>
                                            <p style={{
                                                fontSize: '13px', lineHeight: 1.5,
                                                color: 'rgba(255,255,255,0.8)',
                                                margin: 0,
                                                overflow: isExpanded ? 'visible' : 'hidden',
                                                textOverflow: isExpanded ? 'unset' : 'ellipsis',
                                                whiteSpace: isExpanded ? 'normal' : 'nowrap'
                                            }}>
                                                {(insight.description || '').replace(/\*\*/g, '').replace(/^💡\s*/, '').replace(/^📈\s*/, '')}
                                            </p>
                                        </div>

                                        {/* Confidence & Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            {/* Confidence ring */}
                                            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                                <svg width="40" height="40" viewBox="0 0 40 40">
                                                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                                    <circle
                                                        cx="20" cy="20" r="16" fill="none"
                                                        stroke={cfg.color}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${confidence * 100.5} 100.5`}
                                                        strokeLinecap="round"
                                                        transform="rotate(-90 20 20)"
                                                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                                    />
                                                </svg>
                                                <span style={{
                                                    position: 'absolute', inset: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '9px', fontWeight: 800, fontFamily: 'monospace',
                                                    color: cfg.color
                                                }}>
                                                    {(confidence * 100).toFixed(0)}
                                                </span>
                                            </div>

                                            {/* Pin/Unpin */}
                                            {onPinInsight && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); onPinInsight(insight); }}
                                                    style={{
                                                        padding: '6px', borderRadius: '8px',
                                                        background: pinned ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.04)',
                                                        border: `1px solid ${pinned ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                                                        color: pinned ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                                                        cursor: 'pointer', display: 'flex',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={pinned ? 'Unpin' : 'Pin insight'}
                                                >
                                                    {pinned ? <PinOff size={12} /> : <Pin size={12} />}
                                                </button>
                                            )}

                                            {/* Expand toggle */}
                                            <ChevronDown
                                                size={14}
                                                style={{
                                                    color: 'rgba(255,255,255,0.2)',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                                                    transition: 'transform 0.2s'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded Panel */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    padding: '0 18px 14px 66px',
                                                    display: 'flex', flexDirection: 'column', gap: '10px'
                                                }}>
                                                    {/* Full description */}
                                                    <p style={{
                                                        fontSize: '13px', lineHeight: 1.6,
                                                        color: 'rgba(255,255,255,0.7)', margin: 0
                                                    }}>
                                                        {(insight.description || '').replace(/\*\*/g, '').replace(/^💡\s*/, '').replace(/^📈\s*/, '')}
                                                    </p>

                                                    {/* Metadata chips */}
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{
                                                            fontSize: '9px', padding: '3px 8px', borderRadius: '6px',
                                                            background: `${cfg.color}10`, color: cfg.color,
                                                            border: `1px solid ${cfg.color}20`,
                                                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                                                        }}>
                                                            {insight.type || 'insight'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '9px', padding: '3px 8px', borderRadius: '6px',
                                                            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            fontWeight: 700, fontFamily: 'monospace'
                                                        }}>
                                                            Confidence: {confidenceLabel} ({(confidence * 100).toFixed(0)}%)
                                                        </span>
                                                        {insight.impact && (
                                                            <span style={{
                                                                fontSize: '9px', padding: '3px 8px', borderRadius: '6px',
                                                                background: 'rgba(239, 68, 68, 0.06)',
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                                                fontWeight: 700
                                                            }}>
                                                                Impact: {insight.impact}
                                                            </span>
                                                        )}
                                                        {insight.column && (
                                                            <span style={{
                                                                fontSize: '9px', padding: '3px 8px', borderRadius: '6px',
                                                                background: 'rgba(56, 189, 248, 0.06)',
                                                                color: '#38bdf8',
                                                                border: '1px solid rgba(56, 189, 248, 0.15)',
                                                                fontWeight: 700, fontFamily: 'monospace'
                                                            }}>
                                                                Column: {insight.column}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Results Footer */}
            <div style={{
                textAlign: 'center', fontSize: '10px',
                color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace',
                padding: '8px'
            }}>
                Showing {filteredInsights.length} of {insights.length} insights
                {minConfidence > 0 && ` · Min confidence: ${minConfidence}%`}
                {activeCategory !== 'all' && ` · Category: ${getConfig(activeCategory).label}`}
            </div>
        </div>
    );
};
