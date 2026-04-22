import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit, Loader2, Target, AlertTriangle, Zap, Clock,
    ChevronDown, ChevronUp, ArrowRight, Shield, TrendingUp,
    Activity, Lightbulb, X, Sparkles, Link2, GitBranch,
    CircleDot, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import type { AnomalyPoint, KpiSummary } from './anomalyHelpers';

// ─── Types ───────────────────────────────────────────────────
interface RootCause {
    cause: string;
    confidence: number;
    evidence: string;
    category: string;
}

interface CrossCorrelation {
    metric: string;
    relationship: string;
    insight: string;
}

interface RecommendedAction {
    action: string;
    priority: 'immediate' | 'short_term' | 'long_term';
    effort: 'low' | 'medium' | 'high';
}

interface RCAResult {
    rootCauses: RootCause[];
    crossCorrelations: CrossCorrelation[];
    timeline: string;
    impactAssessment: string;
    recommendedActions: RecommendedAction[];
    summary: string;
}

interface RCAPanelProps {
    anomaly: AnomalyPoint;
    kpiSummary: KpiSummary | undefined;
    allKpis: KpiSummary[];
    surroundingData: Record<string, any>[];
    datasetName?: string;
    onClose: () => void;
}

// ─── Category config ─────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    data_quality: { icon: AlertTriangle, color: '#f59e0b', label: 'Data Quality' },
    process_change: { icon: GitBranch, color: '#8b5cf6', label: 'Process Change' },
    external_event: { icon: Zap, color: '#ec4899', label: 'External Event' },
    system_error: { icon: Shield, color: '#ef4444', label: 'System Error' },
    seasonal: { icon: Clock, color: '#06b6d4', label: 'Seasonal' },
    correlation: { icon: Link2, color: '#6366f1', label: 'Correlation' },
    trend_shift: { icon: TrendingUp, color: '#34d399', label: 'Trend Shift' },
    capacity: { icon: BarChart3, color: '#f97316', label: 'Capacity' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
    immediate: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    short_term: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    long_term: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
};

// ─── Confidence Bar ──────────────────────────────────────────
const ConfidenceBar = ({ value }: { value: number }) => {
    const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : value >= 40 ? '#f97316' : '#ef4444';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border-default)', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}90)` }}
                />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color, minWidth: 36 }}>{value}%</span>
        </div>
    );
};

// ─── Main RCA Panel ──────────────────────────────────────────
export const RCAPanel = ({ anomaly, kpiSummary, allKpis, surroundingData, datasetName, onClose }: RCAPanelProps) => {
    const { token } = useAuth();
    const [result, setResult] = useState<RCAResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCause, setExpandedCause] = useState<number>(0);

    const runRCA = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/ai/rca`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    anomaly: {
                        metric: anomaly.metric,
                        value: anomaly.value,
                        expected: anomaly.expected,
                        deviation: ((anomaly.value - anomaly.expected) / (anomaly.expected || 1) * 100).toFixed(1),
                        severity: anomaly.severity,
                        type: anomaly.type,
                        timestamp: anomaly.timestamp,
                        zScore: anomaly.zScore,
                        explanation: anomaly.explanation,
                    },
                    kpiSummary,
                    allKpis,
                    surroundingData: surroundingData.slice(0, 20),
                    datasetName,
                })
            });

            if (!res.ok) throw new Error('RCA service unavailable');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (e: any) {
            setError(e.message || 'Failed to analyze root cause');
        } finally {
            setLoading(false);
        }
    }, [anomaly, kpiSummary, allKpis, surroundingData, datasetName, token]);

    // Auto-run on mount
    useState(() => { runRCA(); });

    const severityColor = anomaly.severity === 'critical' ? '#ef4444' : anomaly.severity === 'high' ? '#f97316' : anomaly.severity === 'medium' ? '#fbbf24' : '#34d399';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(560px, 95vw)',
                background: 'var(--bg-card)', borderLeft: '1px solid var(--border-default)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.3)', zIndex: 1200,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
                background: `linear-gradient(135deg, ${severityColor}08, transparent)`,
                flexShrink: 0,
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${severityColor}, ${severityColor}40, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 14,
                        background: `linear-gradient(135deg, ${severityColor}20, ${severityColor}08)`,
                        border: `1px solid ${severityColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BrainCircuit size={20} style={{ color: severityColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Root Cause Analysis</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{
                                padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                background: `${severityColor}15`, color: severityColor, border: `1px solid ${severityColor}30`
                            }}>{anomaly.severity}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{anomaly.metric}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                    }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Anomaly summary bar */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                    marginTop: 14, padding: '10px 12px', borderRadius: 12,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                }}>
                    {[
                        { label: 'Value', val: anomaly.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
                        { label: 'Expected', val: anomaly.expected.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
                        { label: 'Z-Score', val: anomaly.zScore.toFixed(2) },
                        { label: 'Confidence', val: anomaly.confidence.toFixed(0) + '%' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: `radial-gradient(circle, ${severityColor}20, transparent 70%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Loader2 size={28} style={{ color: severityColor }} className="animate-spin" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>AI Analyzing Root Causes</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cross-referencing {allKpis.length} metrics and {surroundingData.length} data points…</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 280 }}>
                            {['Extracting anomaly context…', 'Analyzing correlations…', 'Generating hypotheses…', 'Ranking root causes…'].map((step, i) => (
                                <motion.div key={step}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.8 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}
                                >
                                    <CircleDot size={10} style={{ color: severityColor }} />
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{
                        padding: 16, borderRadius: 14,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                        color: '#ef4444', fontSize: 13, marginBottom: 16,
                    }}>
                        <strong>Error:</strong> {error}
                        <button onClick={runRCA} style={{
                            display: 'block', marginTop: 8, padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>Retry Analysis</button>
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Executive Summary */}
                        <div style={{
                            padding: '16px 18px', borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
                            border: '1px solid rgba(99,102,241,0.12)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#818cf8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <Sparkles size={12} /> Executive Summary
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                                {result.summary}
                            </p>
                        </div>

                        {/* Root Causes */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                                Root Cause Hypotheses ({result.rootCauses.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {result.rootCauses.map((rc, i) => {
                                    const cat = CATEGORY_CONFIG[rc.category] || CATEGORY_CONFIG.trend_shift;
                                    const CatIcon = cat.icon;
                                    const isExpanded = expandedCause === i;
                                    return (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            style={{
                                                borderRadius: 14, overflow: 'hidden',
                                                border: `1px solid ${isExpanded ? cat.color + '30' : 'var(--border-subtle)'}`,
                                                background: isExpanded ? `${cat.color}06` : 'var(--bg-surface)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <button
                                                onClick={() => setExpandedCause(isExpanded ? -1 : i)}
                                                style={{
                                                    width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer',
                                                    background: 'transparent', textAlign: 'left',
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                }}
                                            >
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                                    background: `${cat.color}15`, border: `1px solid ${cat.color}25`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <CatIcon size={15} style={{ color: cat.color }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{rc.cause}</div>
                                                    <ConfidenceBar value={rc.confidence} />
                                                </div>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                                                    background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}25`,
                                                    textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
                                                }}>{cat.label}</span>
                                                {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                                                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Evidence:</strong> {rc.evidence}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cross-Correlations */}
                        {result.crossCorrelations.length > 0 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                                    Cross-Metric Correlations
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {result.crossCorrelations.map((cc, i) => (
                                        <div key={i} style={{
                                            padding: '12px 16px', borderRadius: 12,
                                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <Link2 size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                                    {cc.metric} <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600 }}>({cc.relationship})</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cc.insight}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline narrative */}
                        <div style={{
                            padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#34d399', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <Clock size={12} /> Event Timeline
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                                {result.timeline}
                            </p>
                        </div>

                        {/* Impact Assessment */}
                        <div style={{
                            padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#ef4444', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <AlertTriangle size={12} /> Business Impact
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                                {result.impactAssessment}
                            </p>
                        </div>

                        {/* Recommended Actions */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                                Recommended Actions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {result.recommendedActions.map((ra, i) => {
                                    const prio = PRIORITY_CONFIG[ra.priority] || PRIORITY_CONFIG.short_term;
                                    return (
                                        <div key={i} style={{
                                            padding: '12px 16px', borderRadius: 12,
                                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <CheckCircle2 size={15} style={{ color: prio.color, flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{ra.action}</div>
                                            </div>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                                                background: prio.bg, color: prio.color,
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                            }}>{ra.priority.replace('_', ' ')}</span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                                                background: 'var(--bg-surface-hover)', color: 'var(--text-tertiary)',
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                            }}>{ra.effort}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div style={{
                padding: '10px 20px', borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0,
            }}>
                <Sparkles size={10} style={{ color: severityColor }} />
                <span>AI Root Cause Analysis · Phase 2</span>
                {result && (
                    <button onClick={runRCA} style={{
                        marginLeft: 'auto', padding: '4px 10px', borderRadius: 6,
                        background: 'transparent', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Activity size={10} /> Re-analyze
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default RCAPanel;
