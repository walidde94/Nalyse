import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Pin, Zap, ChevronDown, CheckCircle2, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';

interface ExecutiveFindingsProps {
    analysis?: any;
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

export const ExecutiveFindings = ({ analysis, reasoning, onDeploy, onDrillDown, onCreateTask, onPin }: ExecutiveFindingsProps) => {
    const [expandedRec, setExpandedRec] = useState<number | null>(null);
    const [liveReasoning, setLiveReasoning] = useState<any>(reasoning);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    useEffect(() => {
        if (!analysis || !analysis.summary) return;

        const generateAiSynthesis = async () => {
            setIsAiGenerating(true);
            try {
                const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const token = localStorage.getItem('token');

                const payload = {
                    datasetName: analysis.type,
                    rows: analysis.summary.rows,
                    columns: analysis.summary.columns,
                    metrics: analysis.metrics || {},
                    anomalies: analysis.aiInsights?.filter((i: any) => i.type === 'anomaly') || [],
                    trends: analysis.aiInsights?.filter((i: any) => i.type === 'trend') || []
                };

                const res = await fetch(`${API_URL_BASE}/api/ai/synthesis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.executiveSummary) {
                        setLiveReasoning(data);
                    }
                }
            } catch (err) {
                console.error("Failed to generate AI Synthesis:", err);
            } finally {
                setIsAiGenerating(false);
            }
        };

        generateAiSynthesis();

    }, [analysis]);

    if (!liveReasoning && !isAiGenerating) return null;

    const safeReasoning = liveReasoning && typeof liveReasoning === 'string' ? {
        executiveSummary: liveReasoning,
        strategicAdvice: [],
        priorityMatrix: []
    } : {
        executiveSummary: liveReasoning?.executiveSummary || '',
        strategicAdvice: Array.isArray(liveReasoning?.strategicAdvice) ? liveReasoning.strategicAdvice : [],
        priorityMatrix: Array.isArray(liveReasoning?.priorityMatrix) ? liveReasoning.priorityMatrix : []
    };

    return (

        <div className="flex flex-col gap-8 fade-in">
            {/* ═══════ EXECUTIVE INTELLIGENCE HERO CARD ═══════ */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                }}
            >
                {/* Top accent bar */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24)' }} />

                {/* Subtle background gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(129,140,248,0.04), rgba(52,211,153,0.03), transparent)', pointerEvents: 'none' }} />

                <div style={{ padding: 'clamp(20px, 3vw, 32px)', position: 'relative', zIndex: 1 }}>
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-5">
                        <div className="flex items-start gap-4">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 250, delay: 0.15 }}
                                style={{
                                    flexShrink: 0,
                                    width: '48px', height: '48px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(52,211,153,0.15))',
                                    border: '1px solid rgba(129,140,248,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 24px rgba(129,140,248,0.12)'
                                }}
                            >
                                <Target size={22} style={{ color: '#818cf8' }} />
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                                    <h3 style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.3px' }}>Executive Intelligence Summary</h3>
                                    <span style={{
                                        fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                                        background: 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(52,211,153,0.1))',
                                        border: '1px solid rgba(129,140,248,0.15)',
                                        padding: '3px 10px', borderRadius: '20px', color: '#818cf8',
                                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <Sparkles size={8} /> Nexus AI
                                    </span>
                                </div>
                                {isAiGenerating ? (
                                    <div className="flex flex-col gap-3 mt-4">
                                        <div className="h-4 bg-indigo-500/10 rounded w-full animate-pulse" />
                                        <div className="h-4 bg-indigo-500/10 rounded w-[90%] animate-pulse" />
                                        <div className="h-4 bg-indigo-500/10 rounded w-[95%] animate-pulse" />
                                        <div className="h-4 bg-indigo-500/10 rounded w-[85%] mt-3 animate-pulse" />
                                        <div className="h-4 bg-indigo-500/10 rounded w-[92%] animate-pulse" />
                                        <div className="h-4 bg-indigo-500/10 rounded w-[40%] animate-pulse" />
                                    </div>
                                ) : (
                                    <p style={{
                                        fontSize: '13.5px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.7,
                                        maxWidth: '700px',
                                        whiteSpace: 'pre-line' /* To render paragraph breaks cleanly */
                                    }}>
                                        {safeReasoning.executiveSummary}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap flex-shrink-0">
                            {onPin && (
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onPin}
                                    style={{
                                        padding: '8px 16px', borderRadius: '12px',
                                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    className="hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                >
                                    <Pin size={13} />
                                    Pin to Dashboard
                                </motion.button>
                            )}
                            {onDeploy && (
                                <motion.button
                                    whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(129,140,248,0.35)' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onDeploy}
                                    style={{
                                        padding: '8px 20px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #818cf8, #34d399)',
                                        border: 'none', color: '#fff',
                                        fontSize: '12px', fontWeight: 800,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(129,140,248,0.25)'
                                    }}
                                >
                                    <Zap size={13} fill="currentColor" />
                                    Deploy Strategy
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {!isAiGenerating && (safeReasoning.strategicAdvice.length > 0 || safeReasoning.priorityMatrix.length > 0) && (
                <div className="grid gap-8 grid-responsive" style={{ gridTemplateColumns: safeReasoning.strategicAdvice.length > 0 && safeReasoning.priorityMatrix.length > 0 ? '1.15fr 1fr' : '1fr' }}>

                    {/* ═══════ STRATEGIC RECOMMENDATIONS ═══════ */}
                    {safeReasoning.strategicAdvice.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={14} style={{ color: '#818cf8' }} />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.2px' }}>Strategic Recommendations</h3>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(129,140,248,0.08)', color: '#818cf8' }}>{safeReasoning.strategicAdvice.length}</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {safeReasoning.strategicAdvice.map((advice: string, i: number) => {
                                    const isExpanded = expandedRec === i;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.06 * i + 0.2 }}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: `1px solid ${isExpanded ? 'rgba(129,140,248,0.3)' : 'var(--border-subtle)'}`,
                                                borderRadius: '14px',
                                                overflow: 'hidden',
                                                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                                                boxShadow: isExpanded ? '0 4px 20px rgba(129,140,248,0.08)' : 'none'
                                            }}
                                        >
                                            <button
                                                onClick={() => { setExpandedRec(isExpanded ? null : i); onDrillDown?.(advice); }}
                                                className="flex gap-4 items-center w-full text-left p-4 group"
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                title="Click to expand"
                                            >
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '7px',
                                                    background: isExpanded ? 'rgba(129,140,248,0.15)' : 'var(--bg-surface)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, transition: 'all 0.3s ease'
                                                }}>
                                                    <ChevronRight
                                                        size={14}
                                                        strokeWidth={3}
                                                        style={{
                                                            color: isExpanded ? '#818cf8' : 'var(--text-tertiary)',
                                                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.25s ease, color 0.25s ease'
                                                        }}
                                                    />
                                                </div>
                                                <span style={{
                                                    fontSize: '13px', fontWeight: 500,
                                                    color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    flex: 1, lineHeight: 1.6,
                                                    transition: 'color 0.2s ease'
                                                }}>
                                                    {advice}
                                                </span>
                                                <ArrowUpRight
                                                    size={14}
                                                    className="opacity-0 group-hover:opacity-60 transition-all"
                                                    style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}
                                                />
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div style={{ padding: '0 20px 16px 60px', borderTop: '1px solid var(--border-subtle)' }}>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.7, marginTop: '14px' }}>
                                                                Use this recommendation to align strategy with data-backed trends. Click again or use Explore to drill into the analysis.
                                                            </p>
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

                    {/* ═══════ OPTIMIZATION MATRIX ═══════ */}
                    {safeReasoning.priorityMatrix.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={14} style={{ color: '#34d399' }} />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.2px' }}>Optimization Matrix</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* Header */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 90px 80px', gap: '12px',
                                    padding: '8px 16px',
                                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                                    color: 'var(--text-tertiary)'
                                }}>
                                    <span>Action Item</span>
                                    <span style={{ textAlign: 'center' }}>Impact</span>
                                    <span style={{ textAlign: 'center' }}>Effort</span>
                                </div>

                                {safeReasoning.priorityMatrix.map((item: any, i: number) => {
                                    const impact = impactLevel(item.impact);
                                    const effortDots = effortLevel(item.effort);
                                    const impactColors = {
                                        high: { bar: 'linear-gradient(90deg, #34d399, #10b981)', width: '100%', glow: 'rgba(52,211,153,0.2)' },
                                        medium: { bar: 'linear-gradient(90deg, #818cf8, #6366f1)', width: '65%', glow: 'rgba(129,140,248,0.15)' },
                                        low: { bar: 'var(--text-disabled)', width: '35%', glow: 'none' },
                                    };
                                    const ic = impact ? impactColors[impact] : null;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * i + 0.35 }}
                                            style={{
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: '12px',
                                                padding: '14px 16px',
                                                display: 'grid', gridTemplateColumns: '1fr 90px 80px', gap: '12px',
                                                alignItems: 'center',
                                                background: 'var(--bg-card)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            className="hover:border-[var(--primary-subtle)]"
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.task}</span>
                                            <div className="flex justify-center">
                                                {ic ? (
                                                    <div style={{ width: '100%', maxWidth: '72px', height: '6px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: ic.width }}
                                                            transition={{ delay: i * 0.05 + 0.5, duration: 0.6 }}
                                                            style={{ height: '100%', borderRadius: '10px', background: ic.bar, boxShadow: `0 0 8px ${ic.glow}` }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </div>
                                            <div className="flex justify-center gap-1.5">
                                                {effortDots != null ? (
                                                    [1, 2, 3].map(dot => (
                                                        <motion.div
                                                            key={dot}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: i * 0.05 + dot * 0.1 + 0.4 }}
                                                            style={{
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                background: dot <= effortDots ? '#fbbf24' : 'rgba(255,255,255,0.06)',
                                                                boxShadow: dot <= effortDots ? '0 0 6px rgba(251,191,36,0.3)' : 'none',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Expert note */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    style={{
                                        marginTop: '8px', padding: '14px 18px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(129,140,248,0.04), rgba(52,211,153,0.04))',
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex', alignItems: 'flex-start', gap: '12px'
                                    }}
                                >
                                    <div style={{ flexShrink: 0, marginTop: '1px' }}>
                                        <Sparkles size={14} style={{ color: '#fbbf24' }} />
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Expert Note:</strong> Prioritize high-impact, low-effort items for immediate ROI. Deploy to the Strategic Board for team collaboration.
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExecutiveFindings;
