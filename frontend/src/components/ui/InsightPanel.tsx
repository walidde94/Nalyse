/**
 * InsightPanel — Reusable UI component that renders AI-generated insights.
 * 
 * Drop this into any analysis view to display:
 * - Intelligent insight cards with significance badges
 * - Summary banner
 * - Chart reasoning tooltips
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Link, BarChart3, ChevronDown, ChevronUp, Brain, Zap } from 'lucide-react';
import { analyzeDataset, type InsightReport, type DataInsight } from '../../engine/InsightEngine';

// ─── Insight Badge Colors ──────────────────────────────────────

const SIGNIFICANCE_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  high: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171', glow: '0 0 12px rgba(239,68,68,0.15)' },
  medium: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24', glow: '0 0 12px rgba(251,191,36,0.1)' },
  low: { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa', glow: 'none' },
};

const TYPE_ICONS: Record<string, any> = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  correlation: Link,
  distribution: BarChart3,
  concentration: Zap,
  comparison: BarChart3,
};

// ─── Insight Card ──────────────────────────────────────────────

const InsightCard = ({ insight, index }: { insight: DataInsight; index: number }) => {
  const style = SIGNIFICANCE_STYLES[insight.significance];
  const Icon = TYPE_ICONS[insight.type] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        padding: '16px 20px',
        borderRadius: '14px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.glow,
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: `${style.text}15`, border: `1px solid ${style.text}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: style.text
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {insight.title}
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: '4px',
            background: `${style.text}20`, color: style.text,
          }}>
            {insight.significance}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {insight.description}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Main Panel ────────────────────────────────────────────────

interface InsightPanelProps {
  data: any[];
  context?: string;
  /** If true, only show the summary banner (no full insight list) */
  compact?: boolean;
  /** Max insights to display */
  maxInsights?: number;
}

export const InsightPanel = ({ data, context, compact = false, maxInsights = 6 }: InsightPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const report: InsightReport = useMemo(() => {
    return analyzeDataset(data, context);
  }, [data, context]);

  if (!report || report.insights.length === 0) return null;

  const visibleInsights = expanded ? report.insights : report.insights.slice(0, compact ? 2 : maxInsights);
  const highCount = report.insights.filter(i => i.significance === 'high').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: '18px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.15))',
            border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8b5cf6'
          }}>
            <Brain size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Insight Engine
              </span>
              {highCount > 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  {highCount} Critical
                </span>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, marginTop: '2px', lineHeight: 1.3, maxWidth: '600px' }}>
              {report.summary.slice(0, 120)}{report.summary.length > 120 ? '…' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
            {report.insights.length} patterns
          </span>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
      </div>

      {/* Insights List */}
      <AnimatePresence>
        {(expanded || !compact) && (
          <motion.div
            initial={compact ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              overflow: 'hidden'
            }}
          >
            {visibleInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
            
            {!expanded && report.insights.length > maxInsights && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                style={{
                  padding: '10px', borderRadius: '10px', border: '1px solid var(--border-subtle)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                Show {report.insights.length - maxInsights} more insights
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Hook to consume insight reports in views that need programmatic access */
export const useInsights = (data: any[], context?: string): InsightReport => {
  return useMemo(() => analyzeDataset(data, context), [data, context]);
};

export default InsightPanel;
