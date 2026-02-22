import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, BarChart2, Pin, Zap, ChevronDown } from 'lucide-react';

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

export const ExecutiveFindings = ({ reasoning, onDeploy, onDrillDown, onCreateTask, onPin }: ExecutiveFindingsProps) => {
    const [expandedRec, setExpandedRec] = useState<number | null>(null);

    if (!reasoning) return null;

    const safeReasoning = typeof reasoning === 'string' ? {
        executiveSummary: reasoning,
        strategicAdvice: [],
        priorityMatrix: []
    } : {
        executiveSummary: reasoning.executiveSummary || 'No summary available.',
        strategicAdvice: Array.isArray(reasoning.strategicAdvice) ? reasoning.strategicAdvice : [],
        priorityMatrix: Array.isArray(reasoning.priorityMatrix) ? reasoning.priorityMatrix : []
    };

    return (
        <div className="flex flex-col gap-8 fade-in mb-8">
            {/* Main Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card glass-noise rounded-2xl inner-bevel shadow-hover"
                style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                    border: '1px solid var(--primary-glow)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '2rem'
                }}
            >
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.03 }}>
                    <BarChart2 size={160} />
                </div>

                <div className="flex-col gap-6">
                    <div className="flex flex-responsive justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className="icon-glass" style={{ width: '48px', height: '48px', background: 'var(--primary)', color: 'white', boxShadow: '0 8px 16px var(--primary-glow)', flexShrink: 0 }}>
                                <Target size={24} />
                            </div>
                            <div>
                                <h2 className="text-h2 tracking-tight-titles" style={{ fontSize: '24px', fontWeight: 800 }}>Executive Intelligence Summary</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="label-premium italic animate-breathe" style={{ color: 'var(--primary)' }}>Expert Analysis</span>
                                    <span className="opacity-20">•</span>
                                    <span className="label-premium opacity-40">Nexus AI</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {onPin && (
                                <button
                                    onClick={onPin}
                                    className="btn btn-ghost btn-sm flex items-center gap-2 hover:bg-primary/10 transition-all w-full md:w-auto"
                                    style={{ borderRadius: '12px', padding: '0 16px', height: '36px', border: '1px solid var(--border-subtle)' }}
                                >
                                    <Pin size={14} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Pin to Dashboard</span>
                                </button>
                            )}
                            {onDeploy && (
                                <button
                                    onClick={onDeploy}
                                    className="btn btn-primary btn-sm flex items-center gap-2 shadow-glow-primary hover:scale-105 transition-transform w-full md:w-auto"
                                    style={{ borderRadius: '12px', padding: '0 16px', height: '36px' }}
                                >
                                    <Zap size={14} fill="currentColor" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">Deploy Strategy</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-lg leading-relaxed" style={{ fontWeight: 400, opacity: 0.9 }}>
                        {safeReasoning.executiveSummary}
                    </p>
                </div>
            </motion.div>

            {(safeReasoning.strategicAdvice.length > 0 || safeReasoning.priorityMatrix.length > 0) && (
                <div className="grid gap-8 grid-responsive" style={{ gridTemplateColumns: safeReasoning.strategicAdvice.length > 0 && safeReasoning.priorityMatrix.length > 0 ? '1.15fr 1fr' : '1fr' }}>
                    {/* Strategic Recommendations — expandable */}
                    {safeReasoning.strategicAdvice.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.35 }}
                            className="flex flex-col gap-4"
                        >
                            <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>Strategic Recommendations</h3>
                            <div className="architect-section-card flex flex-col gap-1 p-1 rounded-xl">
                                {safeReasoning.strategicAdvice.map((advice, i) => {
                                    const isExpanded = expandedRec === i;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * i + 0.2 }}
                                            className="rounded-lg overflow-hidden border border-transparent hover:border-[var(--border-subtle)] transition-colors"
                                        >
                                            <button
                                                onClick={() => { setExpandedRec(isExpanded ? null : i); onDrillDown?.(advice); }}
                                                className="flex gap-3 items-start w-full text-left p-4 group hover:bg-white/[0.03] transition-colors"
                                                title="Click to expand or analyze"
                                            >
                                                <span className={`mt-0.5 text-[var(--primary)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                                    <ChevronRight size={18} strokeWidth={2.5} />
                                                </span>
                                                <span className="text-sm leading-relaxed text-[var(--text-primary)] opacity-95 group-hover:opacity-100 flex-1">
                                                    {advice}
                                                </span>
                                                <ChevronDown size={14} className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
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
                                                        <div className="px-4 pb-4 pt-0 pl-[52px] border-t border-[var(--border-subtle)]/50">
                                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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

                    {/* Optimization Matrix — Impact/Effort with placeholders */}
                    {safeReasoning.priorityMatrix.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.35 }}
                            className="flex flex-col gap-4"
                        >
                            <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>Optimization Matrix</h3>
                            <div className="architect-section-card rounded-xl p-5 flex flex-col gap-4">
                                <div className="grid gap-1">
                                    <div className="grid grid-cols-[1fr_100px_90px] gap-3 px-1 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                        <span>Action Item</span>
                                        <span className="text-center">Impact</span>
                                        <span className="text-center">Effort</span>
                                    </div>
                                    {safeReasoning.priorityMatrix.map((item, i) => {
                                        const impact = impactLevel(item.impact);
                                        const effortDots = effortLevel(item.effort);
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * i + 0.35 }}
                                                className="grid grid-cols-[1fr_100px_90px] gap-3 items-center p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
                                            >
                                                <span className="text-sm font-medium text-[var(--text-primary)] opacity-95 group-hover:opacity-100 truncate pr-2">{item.task}</span>
                                                <div className="flex justify-center">
                                                    {impact ? (
                                                        <div className="w-full max-w-[80px] h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-300"
                                                                style={{
                                                                    width: impact === 'high' ? '100%' : impact === 'medium' ? '65%' : '35%',
                                                                    background: impact === 'high'
                                                                        ? 'linear-gradient(90deg, var(--success), #4ade80)'
                                                                        : impact === 'medium'
                                                                            ? 'linear-gradient(90deg, var(--primary), #60a5fa)'
                                                                            : 'linear-gradient(90deg, var(--text-muted), var(--text-tertiary))',
                                                                    boxShadow: impact === 'high' ? '0 0 10px rgba(34, 197, 94, 0.35)' : 'none'
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-[var(--text-muted)] italic">—</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-center gap-1">
                                                    {effortDots != null ? (
                                                        [1, 2, 3].map(dot => (
                                                            <div
                                                                key={dot}
                                                                className="w-2 h-2 rounded-full transition-colors"
                                                                style={{
                                                                    backgroundColor: dot <= effortDots ? 'var(--warning)' : 'var(--bg-surface)',
                                                                    opacity: dot <= effortDots ? 1 : 0.35
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-[var(--text-muted)] italic">—</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-start gap-3">
                                    <Zap size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                                        <strong className="text-[var(--primary)]">Expert Note:</strong> Prioritize high-impact items for immediate ROI.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
