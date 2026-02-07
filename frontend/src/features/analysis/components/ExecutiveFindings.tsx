import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, ChevronRight, BarChart2 } from 'lucide-react';

import { Zap } from 'lucide-react';

interface ExecutiveFindingsProps {
    reasoning?: {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    };
    onDeploy?: () => void;
}

export const ExecutiveFindings = ({ reasoning, onDeploy }: ExecutiveFindingsProps) => {
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
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="icon-glass" style={{ width: '48px', height: '48px', background: 'var(--primary)', color: 'white', boxShadow: '0 8px 16px var(--primary-glow)' }}>
                                <Target size={24} />
                            </div>
                            <div>
                                <h2 className="text-h2 tracking-tight-titles" style={{ fontSize: '24px', fontWeight: 800 }}>Executive Intelligence Summary</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="label-premium italic animate-breathe" style={{ color: 'var(--primary)' }}>Synthesized Expert Analysis</span>
                                    <span className="opacity-20">•</span>
                                    <span className="label-premium opacity-40">Field: General Enterprise Intelligence</span>
                                </div>
                            </div>
                        </div>

                        {onDeploy && (
                            <button
                                onClick={onDeploy}
                                className="btn btn-primary btn-sm flex items-center gap-2 shadow-glow-primary hover:scale-105 transition-transform"
                                style={{ borderRadius: '12px', padding: '0 16px', height: '36px' }}
                            >
                                <Zap size={14} fill="currentColor" />
                                <span className="text-[11px] font-black uppercase tracking-wider">Deploy Strategy</span>
                            </button>
                        )}
                    </div>

                    <p className="text-lg leading-relaxed" style={{ fontWeight: 400, opacity: 0.9 }}>
                        {safeReasoning.executiveSummary}
                    </p>
                </div>
            </motion.div>

            {(safeReasoning.strategicAdvice.length > 0 || safeReasoning.priorityMatrix.length > 0) && (
                <div className="grid gap-6" style={{ gridTemplateColumns: safeReasoning.strategicAdvice.length > 0 && safeReasoning.priorityMatrix.length > 0 ? '1.2fr 1fr' : '1fr' }}>
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
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i + 0.3 }}
                                        className="flex gap-3 items-start group p-3 rounded-xl hover-lift bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/10"
                                    >
                                        <div className="mt-1 text-primary group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={14} />
                                        </div>
                                        <span className="text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{advice}</span>
                                    </motion.div>
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
                                <div className="flex items-center gap-2 px-2 mb-1">
                                    <span className="label-premium flex-1">Priority Task</span>
                                    <span className="label-premium w-[60px] text-center">Impact</span>
                                    <span className="label-premium w-[60px] text-center">Effort</span>
                                </div>
                                {safeReasoning.priorityMatrix.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i + 0.4 }}
                                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/30 transition-all active-press"
                                    >
                                        <span className="text-sm font-medium opacity-80" style={{ flex: 1 }}>{item.task}</span>
                                        <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ height: '6px', width: '40px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: item.impact === 'High' ? '100%' : '50%',
                                                    background: item.impact === 'High' ? 'var(--success)' : 'var(--primary)',
                                                    boxShadow: item.impact === 'High' ? '0 0 10px var(--success)' : 'none'
                                                }}></div>
                                            </div>
                                        </div>
                                        <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ height: '100%', display: 'flex', gap: '2px' }}>
                                                {[1, 2, 3].map(dot => (
                                                    <div key={dot} style={{
                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                        background: (item.effort === 'High' && dot <= 3) || (item.effort === 'Medium' && dot <= 2) || (item.effort === 'Low' && dot <= 1)
                                                            ? 'var(--warning)' : 'var(--bg-surface)'
                                                    }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-auto p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-[11px] leading-relaxed opacity-70">
                                    <strong>Expert Note:</strong> High impact / Low effort tasks should be prioritized in the next sprint cycle to maximize institutional ROI.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
