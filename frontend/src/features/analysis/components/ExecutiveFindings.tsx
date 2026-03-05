import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, BarChart2, Pin, Zap, ChevronDown, TrendingUp, Gauge, ArrowUpRight, Layers, Clock, Flame, Sparkles, Brain, Shield, Lightbulb, Rocket, Eye, Copy, Check, BookOpen } from 'lucide-react';

interface ExecutiveFindingsProps {
    reasoning?: {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    };
    onDeploy?: () => void;
    onDrillDown?: (text: string) => void;
    onCreateTask?: (task: any) => void;
    onPin?: () => void;
}

const impactLevel = (s: string) => (s && s.toLowerCase().includes('high')) ? 'high' : (s && s.toLowerCase().includes('medium')) ? 'medium' : (s && s.toLowerCase().includes('low')) ? 'low' : null;
const effortLevel = (s: string) => (s && s.toLowerCase().includes('high')) ? 3 : (s && s.toLowerCase().includes('medium')) ? 2 : (s && s.toLowerCase().includes('low')) ? 1 : null;
const impactPercent = (s: string) => s?.toLowerCase().includes('high') ? 95 : s?.toLowerCase().includes('medium') ? 60 : s?.toLowerCase().includes('low') ? 30 : 0;

const impactConfig = (level: string | null) => {
    if (level === 'high') return { label: 'HIGH', color: '#22c55e', glow: 'rgba(34,197,94,0.35)', gradient: 'linear-gradient(135deg, #22c55e, #4ade80)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' };
    if (level === 'medium') return { label: 'MED', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' };
    if (level === 'low') return { label: 'LOW', color: '#94a3b8', glow: 'none', gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' };
    return { label: '—', color: '#475569', glow: 'none', gradient: 'var(--bg-surface)', bg: 'transparent', border: 'transparent' };
};

const effortConfig = (level: number | null) => {
    if (level === 3) return { label: 'HIGH', color: '#f97316', icon: Flame, bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' };
    if (level === 2) return { label: 'MED', color: '#eab308', icon: Clock, bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' };
    if (level === 1) return { label: 'LOW', color: '#22d3ee', icon: Sparkles, bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' };
    return { label: '—', color: '#475569', icon: Clock, bg: 'transparent', border: 'transparent' };
};

const quadrantLabel = (impact: string | null, effort: number | null) => {
    if (impact === 'high' && (effort === 1 || effort === 2)) return { text: 'Quick Win', color: '#22c55e', emoji: '🎯', priority: 1 };
    if (impact === 'high' && effort === 3) return { text: 'Major Project', color: '#f97316', emoji: '🏗️', priority: 2 };
    if ((impact === 'medium' || impact === 'low') && (effort === 1 || effort === 2)) return { text: 'Fill-In', color: '#3b82f6', emoji: '📋', priority: 3 };
    if ((impact === 'medium' || impact === 'low') && effort === 3) return { text: 'Reconsider', color: '#ef4444', emoji: '⚠️', priority: 4 };
    return { text: 'Evaluate', color: '#94a3b8', emoji: '🔍', priority: 5 };
};

/* ─── Animated Confidence Ring ─── */
const ConfidenceRing = ({ percent, color, size = 52 }: { percent: number; color: string; size?: number }) => {
    const r = (size - 6) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percent / 100) * circumference;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
                strokeLinecap="round" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
        </svg>
    );
};

/* ─── Typing Effect for Summary ─── */
const TypewriterText = ({ text }: { text: string }) => {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (text.length < 20) { setDisplayed(text); setDone(true); return; }
        let i = 0;
        const interval = setInterval(() => {
            i += 3;
            if (i >= text.length) { setDisplayed(text); setDone(true); clearInterval(interval); }
            else setDisplayed(text.slice(0, i));
        }, 8);
        return () => clearInterval(interval);
    }, [text]);
    return <>{displayed}{!done && <span className="ef-cursor">|</span>}</>;
};

/* ─── Scan Line Animation ─── */
const ScanLine = () => (
    <motion.div
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        style={{
            position: 'absolute', left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--primary-glow), transparent)',
            pointerEvents: 'none', zIndex: 2, opacity: 0.5,
        }}
    />
);

export const ExecutiveFindings = ({ reasoning, onDeploy, onDrillDown, onCreateTask, onPin }: ExecutiveFindingsProps) => {
    const [expandedRec, setExpandedRec] = useState<number | null>(null);
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [copiedSummary, setCopiedSummary] = useState(false);

    if (!reasoning) return null;

    const safeReasoning = typeof reasoning === 'string' ? {
        executiveSummary: reasoning, strategicAdvice: [], priorityMatrix: []
    } : {
        executiveSummary: reasoning.executiveSummary || 'No summary available.',
        strategicAdvice: Array.isArray(reasoning.strategicAdvice) ? reasoning.strategicAdvice : [],
        priorityMatrix: Array.isArray(reasoning.priorityMatrix) ? reasoning.priorityMatrix : []
    };

    const quickWins = safeReasoning.priorityMatrix.filter(item => {
        const impact = impactLevel(item.impact);
        const effort = effortLevel(item.effort);
        return impact === 'high' && (effort === 1 || effort === 2);
    }).length;
    const highImpactCount = safeReasoning.priorityMatrix.filter(item => impactLevel(item.impact) === 'high').length;

    const handleCopySummary = () => {
        navigator.clipboard.writeText(safeReasoning.executiveSummary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    const recIcons = [Lightbulb, Shield, Rocket, Brain, Target, Eye];

    return (
        <div className="flex flex-col gap-8 fade-in mb-8">
            {/* ═══════════════════════════════════════
                EXECUTIVE INTELLIGENCE SUMMARY — APEX
               ═══════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="ef-hero-card"
            >
                <ScanLine />

                {/* Ambient Background Orbs */}
                <div className="ef-orb ef-orb-1" />
                <div className="ef-orb ef-orb-2" />
                <div className="ef-orb ef-orb-3" />

                {/* Grid Pattern Overlay */}
                <div className="ef-grid-pattern" />

                {/* Corner Accents */}
                <div className="ef-corner ef-corner-tl" />
                <div className="ef-corner ef-corner-tr" />
                <div className="ef-corner ef-corner-bl" />
                <div className="ef-corner ef-corner-br" />

                <div style={{ position: 'relative', zIndex: 3 }}>
                    {/* Header Row */}
                    <div className="flex flex-responsive justify-between items-start gap-4" style={{ marginBottom: '24px' }}>
                        <div className="flex items-center gap-4">
                            <div className="ef-icon-container">
                                <div className="ef-icon-ring" />
                                <div className="ef-icon-inner">
                                    <Brain size={22} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 style={{
                                        fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 900,
                                        letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0,
                                    }}>
                                        Executive <span className="text-gradient">Intelligence</span>
                                    </h2>
                                    <div className="ef-ai-badge">
                                        <Sparkles size={10} />
                                        <span>AI SYNTHESIS</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="ef-status-indicator">
                                        <div className="ef-status-dot" />
                                        <span>Analysis Complete</span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.4 }}>•</span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        NEXUS ENGINE v3.0
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button onClick={handleCopySummary} className="ef-header-btn" title="Copy Summary">
                                {copiedSummary ? <Check size={13} /> : <Copy size={13} />}
                                <span>{copiedSummary ? 'Copied!' : 'Copy'}</span>
                            </button>
                            {onPin && (
                                <button onClick={onPin} className="ef-header-btn">
                                    <Pin size={13} />
                                    <span>Pin to Dashboard</span>
                                </button>
                            )}
                            {onDeploy && (
                                <button onClick={onDeploy} className="ef-deploy-btn">
                                    <div className="ef-deploy-glow" />
                                    <Zap size={14} fill="currentColor" />
                                    <span>Deploy Strategy</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Summary Text with Typewriter */}
                    <div className="ef-summary-container">
                        <div className="ef-summary-accent" />
                        <p style={{ fontSize: '15px', lineHeight: 1.75, fontWeight: 400, color: 'var(--text-primary)', opacity: 0.92, margin: 0 }}>
                            <TypewriterText text={safeReasoning.executiveSummary} />
                        </p>
                    </div>

                    {/* Summary Metrics Strip */}
                    <div className="ef-metrics-strip">
                        <div className="ef-metric-item">
                            <Target size={13} style={{ color: 'var(--primary)' }} />
                            <span className="ef-metric-label">Recommendations</span>
                            <span className="ef-metric-value">{safeReasoning.strategicAdvice.length}</span>
                        </div>
                        <div className="ef-metric-divider" />
                        <div className="ef-metric-item">
                            <Layers size={13} style={{ color: '#8b5cf6' }} />
                            <span className="ef-metric-label">Initiatives</span>
                            <span className="ef-metric-value">{safeReasoning.priorityMatrix.length}</span>
                        </div>
                        {quickWins > 0 && (<>
                            <div className="ef-metric-divider" />
                            <div className="ef-metric-item">
                                <Zap size={13} style={{ color: '#22c55e' }} />
                                <span className="ef-metric-label">Quick Wins</span>
                                <span className="ef-metric-value" style={{ color: '#22c55e' }}>{quickWins}</span>
                            </div>
                        </>)}
                        {highImpactCount > 0 && (<>
                            <div className="ef-metric-divider" />
                            <div className="ef-metric-item">
                                <TrendingUp size={13} style={{ color: '#f59e0b' }} />
                                <span className="ef-metric-label">High Impact</span>
                                <span className="ef-metric-value" style={{ color: '#f59e0b' }}>{highImpactCount}</span>
                            </div>
                        </>)}
                    </div>
                </div>
            </motion.div>

            {(safeReasoning.strategicAdvice.length > 0 || safeReasoning.priorityMatrix.length > 0) && (
                <div className="flex flex-col gap-8">

                    {/* ═══════════════════════════════════════
                        STRATEGIC RECOMMENDATIONS — ELEVATED
                       ═══════════════════════════════════════ */}
                    {safeReasoning.strategicAdvice.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="ef-section-icon" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <BookOpen size={15} style={{ color: '#3b82f6' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                                        Strategic Recommendations
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                                        {safeReasoning.strategicAdvice.length} data-driven actions identified
                                    </p>
                                </div>
                            </div>

                            <div className="ef-rec-container">
                                {safeReasoning.strategicAdvice.map((advice, i) => {
                                    const isExpanded = expandedRec === i;
                                    const RecIcon = recIcons[i % recIcons.length];
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.06 * i + 0.2 }}
                                            className={`ef-rec-item ${isExpanded ? 'ef-rec-expanded' : ''}`}
                                        >
                                            <button
                                                onClick={() => { setExpandedRec(isExpanded ? null : i); onDrillDown?.(advice); }}
                                                className="ef-rec-button"
                                            >
                                                <div className="ef-rec-number">
                                                    <RecIcon size={14} />
                                                </div>
                                                <span className="ef-rec-text">{advice}</span>
                                                <div className={`ef-rec-expand ${isExpanded ? 'ef-rec-expand-open' : ''}`}>
                                                    <ChevronDown size={14} />
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="ef-rec-detail">
                                                            <div className="ef-rec-detail-bar" />
                                                            <p>Leverage this recommendation to align strategy with emerging data-backed trends. Explore further to uncover deeper correlations and actionable sub-patterns.</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════
                        OPTIMIZATION MATRIX — PREMIUM REDESIGN
                       ═══════════════════════════════════════ */}
                    {safeReasoning.priorityMatrix.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col gap-5"
                        >
                            {/* Matrix Header */}
                            <div className="flex flex-responsive justify-between items-end gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="ef-section-icon" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        <Layers size={16} style={{ color: '#8b5cf6' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
                                            Optimization Matrix
                                        </h3>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                            Impact vs. Effort analysis · {safeReasoning.priorityMatrix.length} strategic initiatives
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {quickWins > 0 && (
                                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="ef-tag ef-tag-green">
                                            <span>🎯</span> {quickWins} Quick Win{quickWins > 1 ? 's' : ''}
                                        </motion.div>
                                    )}
                                    {highImpactCount > 0 && (
                                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 }} className="ef-tag ef-tag-blue">
                                            <TrendingUp size={11} /> {highImpactCount} High Impact
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Matrix Cards Grid */}
                            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
                                {safeReasoning.priorityMatrix.map((item, i) => {
                                    const impact = impactLevel(item.impact);
                                    const effort = effortLevel(item.effort);
                                    const ic = impactConfig(impact);
                                    const ec = effortConfig(effort);
                                    const quadrant = quadrantLabel(impact, effort);
                                    const isHovered = hoveredItem === i;
                                    const EffortIcon = ec.icon;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: 0.08 * i + 0.3, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                            onMouseEnter={() => setHoveredItem(i)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            className="ef-matrix-card"
                                            onClick={() => onCreateTask?.(item)}
                                            style={{ cursor: onCreateTask ? 'pointer' : 'default' }}
                                        >
                                            {/* Gradient border effect */}
                                            <div className="ef-matrix-border" style={{
                                                background: isHovered
                                                    ? `linear-gradient(135deg, ${ic.color}60, ${ec.color}40, transparent)`
                                                    : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02), transparent)`,
                                            }} />

                                            <div className="ef-matrix-inner" style={{
                                                background: isHovered
                                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))'
                                                    : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))',
                                            }}>
                                                {/* Ambient glow on hover */}
                                                <motion.div animate={{ opacity: isHovered ? 0.1 : 0 }} transition={{ duration: 0.3 }}
                                                    style={{ position: 'absolute', top: '-30%', right: '-20%', width: '70%', height: '100%', background: `radial-gradient(circle, ${ic.color}, transparent)`, pointerEvents: 'none', filter: 'blur(40px)' }} />

                                                {/* Top row */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ fontSize: '13px' }}>{quadrant.emoji}</span>
                                                        <span className="ef-quadrant-badge" style={{ color: quadrant.color, background: `${quadrant.color}15`, border: `1px solid ${quadrant.color}25` }}>
                                                            {quadrant.text}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', opacity: 0.4 }}>
                                                        #{String(i + 1).padStart(2, '0')}
                                                    </span>
                                                </div>

                                                {/* Task name */}
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: isHovered ? '#fff' : 'var(--text-primary)', lineHeight: 1.4, marginBottom: '16px', transition: 'color 0.2s' }}>
                                                    {item.task}
                                                </h4>

                                                {/* Gauges row */}
                                                <div className="flex items-end gap-6">
                                                    {/* Impact */}
                                                    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                                                        <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                                                            <ConfidenceRing percent={impactPercent(item.impact)} color={ic.color} />
                                                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: ic.color }}>
                                                                {impactPercent(item.impact)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ic.gradient, boxShadow: ic.glow !== 'none' ? `0 0 6px ${ic.glow}` : undefined }} />
                                                            <span className="ef-gauge-label">Impact</span>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: ic.color, fontFamily: 'var(--font-mono)' }}>{ic.label}</span>
                                                        </div>
                                                    </div>

                                                    {/* Effort bars */}
                                                    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                                                        <div className="flex items-center gap-1" style={{ height: '30px' }}>
                                                            {[1, 2, 3].map((level) => (
                                                                <motion.div key={level}
                                                                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                                                    transition={{ delay: 0.1 * level + 0.5 + 0.08 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                                    style={{
                                                                        width: '10px', height: `${8 + level * 7}px`, borderRadius: '3px',
                                                                        background: effort != null && level <= effort ? `linear-gradient(180deg, ${ec.color}, ${ec.color}80)` : 'rgba(255,255,255,0.04)',
                                                                        border: `1px solid ${effort != null && level <= effort ? ec.color + '40' : 'rgba(255,255,255,0.04)'}`,
                                                                        boxShadow: effort != null && level <= effort ? `0 0 8px ${ec.color}25` : 'none',
                                                                        transformOrigin: 'bottom', transition: 'background 0.3s, border 0.3s',
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <EffortIcon size={10} style={{ color: ec.color, opacity: 0.7 }} />
                                                            <span className="ef-gauge-label">Effort</span>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: ec.color, fontFamily: 'var(--font-mono)' }}>{ec.label}</span>
                                                        </div>
                                                    </div>

                                                    {/* ROI */}
                                                    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                                                        <motion.div
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            transition={{ delay: 0.6 + 0.08 * i, type: 'spring', stiffness: 200, damping: 15 }}
                                                            style={{
                                                                width: '36px', height: '36px', borderRadius: '10px',
                                                                background: impact === 'high' && (effort === 1 || effort === 2) ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' : impact === 'high' ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))' : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                                                                border: `1px solid ${impact === 'high' && (effort === 1 || effort === 2) ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}
                                                        >
                                                            <ArrowUpRight size={16} style={{ color: impact === 'high' && (effort === 1 || effort === 2) ? '#22c55e' : impact === 'high' ? '#3b82f6' : 'var(--text-muted)', opacity: impact === 'high' ? 0.9 : 0.4 }} />
                                                        </motion.div>
                                                        <span className="ef-gauge-label" style={{ marginTop: '2px' }}>ROI</span>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isHovered && onCreateTask && (
                                                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                                                            className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <Zap size={10} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                                                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary)', opacity: 0.6 }}>Click to create task</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Expert insight bar */}
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + safeReasoning.priorityMatrix.length * 0.05 }} className="ef-insight-bar">
                                <motion.div animate={{ x: ['0%', '200%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                                    style={{ position: 'absolute', top: 0, left: '-50%', width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.05), transparent)', pointerEvents: 'none' }} />
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Gauge size={14} style={{ color: '#8b5cf6' }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                                        <strong style={{ color: '#a78bfa', fontWeight: 700 }}>Strategic Insight:</strong>{' '}
                                        {quickWins > 0
                                            ? `${quickWins} quick-win opportunit${quickWins > 1 ? 'ies' : 'y'} identified — high impact with manageable effort. Prioritize these for immediate ROI acceleration.`
                                            : 'Evaluate each initiative against your current resource allocation. Focus on high-impact items that align with quarterly objectives.'}
                                    </p>
                                </div>
                                {quickWins > 0 && (
                                    <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,0.3)', flexShrink: 0, lineHeight: 1 }}>
                                        {quickWins}×
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* ═══════ STYLES ═══════ */}
            <style>{`
                /* Hero Card */
                .ef-hero-card {
                    position: relative; overflow: hidden; border-radius: 20px;
                    padding: 28px 32px;
                    background: linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.6) 100%);
                    border: 1px solid rgba(59,130,246,0.15);
                    box-shadow: 0 8px 40px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
                    backdrop-filter: blur(20px);
                }
                .ef-hero-card:hover {
                    border-color: rgba(59,130,246,0.25);
                    box-shadow: 0 12px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px -20px var(--primary-glow);
                }

                /* Background Orbs */
                .ef-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(60px); z-index: 0; }
                .ef-orb-1 { width: 300px; height: 300px; top: -100px; right: -80px; background: rgba(59,130,246,0.08); animation: ef-float-1 12s ease-in-out infinite; }
                .ef-orb-2 { width: 200px; height: 200px; bottom: -60px; left: -40px; background: rgba(139,92,246,0.06); animation: ef-float-2 15s ease-in-out infinite; }
                .ef-orb-3 { width: 150px; height: 150px; top: 50%; left: 60%; background: rgba(6,182,212,0.04); animation: ef-float-3 18s ease-in-out infinite; }
                @keyframes ef-float-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px,15px); } }
                @keyframes ef-float-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,-10px); } }
                @keyframes ef-float-3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-10px,20px); } }

                /* Grid Pattern */
                .ef-grid-pattern {
                    position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.02;
                    background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                /* Corner Accents */
                .ef-corner { position: absolute; width: 20px; height: 20px; z-index: 2; pointer-events: none; }
                .ef-corner-tl { top: 12px; left: 12px; border-top: 2px solid var(--primary); border-left: 2px solid var(--primary); border-radius: 3px 0 0 0; opacity: 0.3; }
                .ef-corner-tr { top: 12px; right: 12px; border-top: 2px solid var(--primary); border-right: 2px solid var(--primary); border-radius: 0 3px 0 0; opacity: 0.3; }
                .ef-corner-bl { bottom: 12px; left: 12px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); border-radius: 0 0 0 3px; opacity: 0.2; }
                .ef-corner-br { bottom: 12px; right: 12px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); border-radius: 0 0 3px 0; opacity: 0.2; }

                /* Icon Container */
                .ef-icon-container { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
                .ef-icon-ring {
                    position: absolute; inset: -3px; border-radius: 16px;
                    border: 2px solid transparent;
                    background: conic-gradient(from 0deg, var(--primary), var(--accent), var(--secondary-accent), var(--primary)) border-box;
                    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    animation: ef-ring-spin 6s linear infinite;
                    opacity: 0.6;
                }
                @keyframes ef-ring-spin { to { transform: rotate(360deg); } }
                .ef-icon-inner {
                    position: relative; width: 100%; height: 100%; border-radius: 14px;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    display: flex; align-items: center; justify-content: center; color: #fff;
                    box-shadow: 0 8px 24px -4px var(--primary-glow);
                }

                /* AI Badge */
                .ef-ai-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 3px 8px; border-radius: 6px;
                    background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08));
                    border: 1px solid rgba(139,92,246,0.2);
                    font-size: 9px; font-weight: 900; letter-spacing: 0.08em;
                    color: #a78bfa; font-family: var(--font-mono);
                }

                /* Status */
                .ef-status-indicator {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 10px; font-weight: 700; color: var(--success);
                }
                .ef-status-dot {
                    width: 6px; height: 6px; border-radius: 50%; background: var(--success);
                    animation: ef-breathe 2s ease-in-out infinite;
                    box-shadow: 0 0 8px var(--success-glow);
                }
                @keyframes ef-breathe { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

                /* Header Buttons */
                .ef-header-btn {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 14px; border-radius: 10px; font-size: 11px; font-weight: 700;
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle);
                    color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;
                    font-family: var(--font-main); text-transform: uppercase; letter-spacing: 0.04em;
                }
                .ef-header-btn:hover { background: var(--primary-subtle); border-color: var(--border-glow); color: var(--text-primary); }

                .ef-deploy-btn {
                    position: relative; display: flex; align-items: center; gap: 6px;
                    padding: 8px 18px; border-radius: 10px; font-size: 11px; font-weight: 900;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    border: none; color: #fff; cursor: pointer; overflow: hidden;
                    font-family: var(--font-main); text-transform: uppercase; letter-spacing: 0.06em;
                    box-shadow: 0 4px 20px -4px var(--primary-glow);
                    transition: all 0.3s ease;
                }
                .ef-deploy-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -4px var(--primary-glow), 0 0 50px -10px var(--accent-glow); }
                .ef-deploy-glow {
                    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    animation: ef-btn-shimmer 3s ease-in-out infinite;
                }
                @keyframes ef-btn-shimmer { 0% { left: -100%; } 100% { left: 200%; } }

                /* Summary */
                .ef-summary-container {
                    position: relative; padding: 20px 24px; border-radius: 14px;
                    background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04);
                    margin-bottom: 16px;
                }
                .ef-summary-accent {
                    position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; border-radius: 3px;
                    background: linear-gradient(180deg, var(--primary), var(--accent));
                }
                .ef-cursor { color: var(--primary); animation: ef-blink 0.8s step-end infinite; }
                @keyframes ef-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

                /* Metrics Strip */
                .ef-metrics-strip {
                    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
                    padding: 12px 16px; border-radius: 12px;
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
                }
                .ef-metric-item { display: flex; align-items: center; gap: 6px; }
                .ef-metric-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
                .ef-metric-value { font-size: 14px; font-weight: 900; font-family: var(--font-mono); color: var(--text-primary); }
                .ef-metric-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.06); }

                /* Section Icon */
                .ef-section-icon {
                    width: 34px; height: 34px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }

                /* Recommendations */
                .ef-rec-container {
                    display: flex; flex-direction: column; gap: 4px;
                    padding: 6px; border-radius: 16px;
                    background: rgba(255,255,255,0.01); border: 1px solid var(--border-subtle);
                }
                .ef-rec-item {
                    border-radius: 12px; overflow: hidden;
                    border: 1px solid transparent; transition: all 0.3s ease;
                }
                .ef-rec-item:hover { border-color: var(--border-subtle); background: rgba(255,255,255,0.015); }
                .ef-rec-expanded { background: rgba(59,130,246,0.03) !important; border-color: rgba(59,130,246,0.1) !important; }
                .ef-rec-button {
                    display: flex; align-items: center; gap: 12px;
                    width: 100%; text-align: left; padding: 14px 16px;
                    background: none; border: none; cursor: pointer; color: inherit;
                    font-family: var(--font-main); transition: background 0.2s;
                }
                .ef-rec-button:hover { background: rgba(255,255,255,0.02); }
                .ef-rec-number {
                    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
                    background: linear-gradient(135deg, var(--primary-subtle), rgba(139,92,246,0.06));
                    border: 1px solid rgba(59,130,246,0.12);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary); transition: all 0.3s ease;
                }
                .ef-rec-item:hover .ef-rec-number { background: var(--primary); color: #fff; box-shadow: 0 0 16px var(--primary-glow); }
                .ef-rec-text { flex: 1; font-size: 13.5px; line-height: 1.55; color: var(--text-primary); opacity: 0.92; }
                .ef-rec-expand {
                    width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-muted); transition: all 0.3s ease;
                }
                .ef-rec-expand-open { transform: rotate(180deg); color: var(--primary); }
                .ef-rec-detail {
                    position: relative; padding: 0 16px 14px 60px;
                }
                .ef-rec-detail-bar {
                    position: absolute; left: 32px; top: 0; bottom: 8px; width: 2px;
                    background: linear-gradient(180deg, var(--primary-subtle), transparent); border-radius: 2px;
                }
                .ef-rec-detail p {
                    font-size: 12px; line-height: 1.6; color: var(--text-muted); margin: 0;
                }

                /* Tags */
                .ef-tag {
                    padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    display: flex; align-items: center; gap: 5px;
                }
                .ef-tag-green { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }
                .ef-tag-blue { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #3b82f6; }

                /* Matrix Card */
                .ef-matrix-card { position: relative; border-radius: 16px; overflow: hidden; }
                .ef-matrix-border {
                    position: absolute; inset: 0; border-radius: 16px; padding: 1px;
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    transition: background 0.3s ease; pointer-events: none;
                }
                .ef-matrix-inner {
                    padding: 20px; border-radius: 16px; position: relative;
                    backdrop-filter: blur(20px); transition: background 0.3s ease;
                }
                .ef-quadrant-badge {
                    font-size: 9px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.1em; padding: 3px 8px; border-radius: 6px;
                }
                .ef-gauge-label {
                    font-size: 9px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.08em; color: var(--text-muted);
                }

                /* Insight Bar */
                .ef-insight-bar {
                    padding: 16px 20px; border-radius: 14px;
                    background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06), rgba(34,197,94,0.04));
                    border: 1px solid rgba(139,92,246,0.15);
                    display: flex; align-items: center; gap: 12px;
                    position: relative; overflow: hidden;
                }
            `}</style>
        </div>
    );
};
