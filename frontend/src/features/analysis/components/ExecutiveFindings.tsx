import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, ChevronRight, BarChart2, Pin } from 'lucide-react';

import { Zap } from 'lucide-react';

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

export const ExecutiveFindings = ({ reasoning, onDeploy, onDrillDown, onCreateTask, onPin }: ExecutiveFindingsProps) => {
    if (!reasoning) return null;

    // Robustness check for malformed or legacy string data
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
        <div className="flex-col gap-6 fade-in mb-8">
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
                <div className="grid gap-6 grid-responsive" style={{ gridTemplateColumns: safeReasoning.strategicAdvice.length > 0 && safeReasoning.priorityMatrix.length > 0 ? '1.2fr 1fr' : '1fr' }}>
                    {/* Strategic Advice */}
                    {safeReasoning.strategicAdvice.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card flex-col gap-4 rounded-xl inner-bevel"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-success/10 text-success">
                                    <TrendingUp size={16} />
                                </div>
                                <h3 className="text-h3 tracking-tight-titles" style={{ fontSize: '16px' }}>Strategic Recommendations</h3>
                            </div>
                            <div className="flex-col gap-2">
                                {safeReasoning.strategicAdvice.map((advice, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i + 0.3 }}
                                        onClick={() => onDrillDown?.(advice)}
                                        className="flex gap-3 items-start group p-3 rounded-xl hover-lift bg-white/[0.01] hover:bg-primary/[0.03] transition-all border border-transparent hover:border-primary/10 w-full text-left"
                                        title="Click to analyze this finding"
                                    >
                                        <div className="mt-1 text-primary group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={14} />
                                        </div>
                                        <span className="text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                            {advice}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Priority Matrix */}
                    {safeReasoning.priorityMatrix.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card flex-col gap-4 rounded-xl inner-bevel"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-warning/10 text-warning">
                                    <AlertTriangle size={16} />
                                </div>
                                <h3 className="text-h3 tracking-tight-titles" style={{ fontSize: '16px' }}>Optimization Matrix</h3>
                            </div>
                            <div className="flex-col gap-2">
                                <div className="flex items-center gap-2 px-3 py-1 mb-1 text-[10px] uppercase font-bold text-tertiary tracking-wider opacity-60">
                                    <span className="flex-1">Action Item</span>
                                    <span className="w-[80px] text-center">Impact</span>
                                    <span className="w-[60px] text-center">Effort</span>
                                </div>
                                {safeReasoning.priorityMatrix.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i + 0.4 }}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group"
                                    >
                                        <span className="text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity" style={{ flex: 1 }}>{item.task}</span>
                                        <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                                            <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: item.impact === 'High' ? '100%' : '50%',
                                                        background: item.impact === 'High'
                                                            ? 'linear-gradient(90deg, var(--success), #4ade80)'
                                                            : 'linear-gradient(90deg, var(--primary), #60a5fa)',
                                                        boxShadow: item.impact === 'High' ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(dot => (
                                                    <div key={dot} className={`w-1.5 h-1.5 rounded-full transition-colors ${(item.effort === 'High' && dot <= 3) || (item.effort === 'Medium' && dot <= 2) || (item.effort === 'Low' && dot <= 1)
                                                        ? 'bg-[var(--warning)]'
                                                        : 'bg-[var(--bg-surface)] opacity-30'
                                                        }`} />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-auto p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-start gap-2">
                                <div className="mt-0.5 text-[var(--primary)]"><Zap size={12} fill="currentColor" /></div>
                                <p className="text-[11px] leading-relaxed opacity-80">
                                    <strong className="text-[var(--primary)]">Expert Note:</strong> Prioritize high-impact items for immediate ROI.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
