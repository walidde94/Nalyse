import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar, Webhook, BellRing, Plus, Clock, Activity, Zap, Play, Pause, Trash2,
    ChevronRight, Shield, RefreshCw, Terminal, Cpu, Globe, ArrowRight,
    CheckCircle2, XCircle, AlertTriangle, Timer, Sparkles, Eye, Edit3,
    Radio, Layers, BarChart3, TrendingUp, Send, Link2, Search, Filter, Target,
    Database, Workflow, ArrowUpRight, ArrowDownRight, Settings2, X,
    Copy, ExternalLink, Code2, Loader2, HelpCircle, BookOpen, Info,
    MoreVertical, ChevronDown, Lightbulb, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { SchedulesTab } from './SchedulesTab';
import { WebhooksTab } from './WebhooksTab';
import { AlertsTab } from './AlertsTab';

/* ═══════════════════════════════════════════════════════════
   AUTOMATION COMMAND CENTER — REAL DATA + USER GUIDANCE
   ═══════════════════════════════════════════════════════════ */

// ─── Helpers ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) return 'scheduled';
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

const statusColors: Record<string, string> = { active: '#10b981', inactive: '#6b7280', error: '#ef4444', pending: '#f59e0b' };
const typeColors: Record<string, string> = { schedule: '#10b981', webhook: '#f59e0b', alert: '#8b5cf6' };

// ─── Mini Sparkline ─────────────────────────────────────────
const MiniSparkline = ({ data, color = '#3b82f6' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1); const min = Math.min(...data, 0); const range = max - min || 1;
    const w = 80, h = 28;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`sp-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
            <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#sp-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
};

// ─── Stat Card ──────────────────────────────────────────────
const StatOrb = ({ label, value, sub, color, icon: Icon, sparkData, index }: any) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden', borderLeft: `3px solid ${color}` }}>
        <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.04, filter: 'blur(20px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{value}</div>
            </div>
            <div style={{ padding: 8, borderRadius: 12, background: `${color}15`, color }}><Icon size={18} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{sub}</span>
            {sparkData && <MiniSparkline data={sparkData} color={color} />}
        </div>
    </motion.div>
);

// ─── Quick Action Card ──────────────────────────────────────
const QuickActionCard = ({ label, desc, icon: Icon, color, onClick, index }: any) => (
    <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + index * 0.06, duration: 0.5 }}
        whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }} onClick={onClick}
        className="card" style={{ padding: 20, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border-subtle)', transition: 'border-color 0.3s', position: 'relative', overflow: 'hidden', width: '100%' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = ''; }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(25px)' }} />
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} /></div>
        <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{desc}</div>
        </div>
    </motion.button>
);

// ─── Onboarding / Help Guide ────────────────────────────────
const GUIDE_STEPS = [
    { icon: Calendar, color: '#10b981', title: 'Create a Scheduled Pipeline', desc: 'Go to the Pipelines tab and click "Add Schedule". Set a CRON expression (e.g. "0 9 * * *" for daily at 9 AM) to automatically run analysis on your datasets at regular intervals.', cta: 'Go to Pipelines' },
    { icon: Webhook, color: '#f59e0b', title: 'Set Up a Webhook', desc: 'Go to the Webhooks tab and click "Add Webhook". Paste any HTTPS endpoint URL (Slack, Zapier, custom API). Events like "analysis.completed" will be forwarded as JSON payloads in real-time.', cta: 'Go to Webhooks' },
    { icon: BellRing, color: '#8b5cf6', title: 'Configure Alert Rules', desc: 'Go to Alert Rules and click "Add Alert". Define a metric (e.g. "cpu_usage"), a condition (e.g. > 85), and a threshold. When breached, the system fires an action — email, webhook, or in-app notification.', cta: 'Go to Alerts' },
];

const CRON_EXAMPLES = [
    { expr: '0 * * * *', label: 'Every hour' },
    { expr: '0 9 * * *', label: 'Daily at 9 AM' },
    { expr: '0 9 * * 1', label: 'Every Monday at 9 AM' },
    { expr: '0 0 1 * *', label: 'First of every month' },
    { expr: '*/15 * * * *', label: 'Every 15 minutes' },
    { expr: '0 9,17 * * 1-5', label: 'Weekdays at 9 AM & 5 PM' },
];

const OnboardingGuide = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
    const [showCronHelp, setShowCronHelp] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            {/* Getting Started Header */}
            <div className="card" style={{ padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: '#3b82f6', opacity: 0.04, filter: 'blur(30px)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>Getting Started with Automation</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, maxWidth: 600 }}>
                            Automate your entire data analysis workflow. Set up scheduled pipelines, webhook integrations, and real-time alert rules in minutes. Follow the steps below to get started.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {GUIDE_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                            className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: `3px solid ${step.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${step.color}12`, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={18} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: step.color }}>Step {i + 1}</span>
                            </div>
                            <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{step.title}</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65, flex: 1 }}>{step.desc}</p>
                            <button onClick={() => onNavigate(i === 0 ? 'schedules' : i === 1 ? 'webhooks' : 'alerts')}
                                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: step.color, background: `${step.color}10`, border: `1px solid ${step.color}30`, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                                {step.cta} <ArrowRight size={12} />
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* CRON Reference */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <button onClick={() => setShowCronHelp(!showCronHelp)}
                    className="card" style={{ width: '100%', padding: '16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <HelpCircle size={16} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>CRON Expression Reference</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>— Click to {showCronHelp ? 'hide' : 'expand'}</span>
                    </div>
                    <motion.div animate={{ rotate: showCronHelp ? 180 : 0 }}><ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} /></motion.div>
                </button>
                <AnimatePresence>
                    {showCronHelp && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden' }}>
                            <div className="card" style={{ padding: '20px 24px', marginTop: 8, borderLeft: '3px solid #f59e0b' }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                                    Format: minute hour day-of-month month day-of-week
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '12px 16px', borderRadius: 8, background: 'var(--bg-surface)', marginBottom: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                                    ┌───────────── minute (0–59)<br />
                                    │ ┌─────────── hour (0–23)<br />
                                    │ │ ┌───────── day of month (1–31)<br />
                                    │ │ │ ┌─────── month (1–12)<br />
                                    │ │ │ │ ┌───── day of week (0–6, Sun=0)<br />
                                    * * * * *
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                    {CRON_EXAMPLES.map((ex, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                                            <code style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{ex.expr}</code>
                                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ex.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

// ─── Item Row (unified for schedules/webhooks/alerts) ───────
const AutomationItemRow = ({ item, type, index }: { item: any; type: string; index: number }) => {
    const color = typeColors[type] || '#3b82f6';
    const icon = type === 'schedule' ? <Calendar size={14} /> : type === 'webhook' ? <Webhook size={14} /> : <BellRing size={14} />;
    const isActive = item.isActive !== false;
    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * index, duration: 0.35 }}
            className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}12`, color, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || 'Unnamed'}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: isActive ? '#10b981' : '#6b7280', letterSpacing: '0.05em' }}>
                            {isActive ? 'Active' : 'Paused'}
                        </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)' }}>
                        {type === 'schedule' && item.cronExpression && <span>CRON: {item.cronExpression}</span>}
                        {type === 'webhook' && item.url && <span style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>}
                        {type === 'alert' && <span>IF {item.metric} {item.operator === 'gt' ? '>' : item.operator === 'lt' ? '<' : '='} {item.threshold}</span>}
                        {item.createdAt && <span style={{ fontSize: 10 }}>Created {timeAgo(item.createdAt)}</span>}
                    </div>
                </div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: `${color}10`, color, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{type}</span>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const AutomationView: React.FC = () => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedules' | 'webhooks' | 'alerts'>('overview');

    // Real data from API
    const [schedules, setSchedules] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [showHelp, setShowHelp] = useState(false);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [sRes, wRes, aRes] = await Promise.allSettled([
                api.get('/automation/schedules'),
                api.get('/automation/webhooks'),
                api.get('/automation/alerts'),
            ]);
            if (sRes.status === 'fulfilled') setSchedules(sRes.value.data || []);
            if (wRes.status === 'fulfilled') setWebhooks(wRes.value.data || []);
            if (aRes.status === 'fulfilled') setAlerts(aRes.value.data || []);
            setLastRefresh(new Date());
        } catch (e: any) {
            addToast('Failed to load automation data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Derived stats from real data
    const totalRules = schedules.length + webhooks.length + alerts.length;
    const activeRules = [...schedules, ...webhooks, ...alerts].filter((r: any) => r.isActive !== false).length;
    const allItems = useMemo(() => [
        ...schedules.map((s: any) => ({ ...s, _type: 'schedule' })),
        ...webhooks.map((w: any) => ({ ...w, _type: 'webhook' })),
        ...alerts.map((a: any) => ({ ...a, _type: 'alert' })),
    ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()), [schedules, webhooks, alerts]);

    const isEmpty = totalRules === 0 && !isLoading;

    const tabs = [
        { id: 'overview' as const, label: 'Mission Control', icon: Cpu, count: totalRules },
        { id: 'schedules' as const, label: 'Pipelines', icon: Calendar, count: schedules.length },
        { id: 'webhooks' as const, label: 'Webhooks', icon: Webhook, count: webhooks.length },
        { id: 'alerts' as const, label: 'Alert Rules', icon: BellRing, count: alerts.length },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text-primary)' }}>

            {/* ═══ HEADER ═══ */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ padding: '28px 36px 0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: '10%', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
                        <div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 14px', borderRadius: 99 }}>
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                    {activeRules} ACTIVE RULES
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                    Refreshed {timeAgo(lastRefresh.toISOString())}
                                </span>
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                                style={{ fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 900, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Automation Command Center
                            </motion.h1>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                                style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0', maxWidth: 600, lineHeight: 1.6, fontWeight: 500 }}>
                                Orchestrate scheduled pipelines, webhook integrations, and threshold-based alerts for your data workflows.
                            </motion.p>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                            style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                            <button onClick={() => setShowHelp(!showHelp)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
                                <HelpCircle size={14} /> {showHelp ? 'Hide Guide' : 'Help'}
                            </button>
                            <button onClick={fetchAll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
                                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                            </button>
                            <button className="btn btn-primary" onClick={() => setActiveTab('schedules')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 20px -4px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.2)', fontWeight: 800, fontSize: 12 }}>
                                <Plus size={14} /> New Pipeline
                            </button>
                        </motion.div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)' }}>
                        {tabs.map((t) => {
                            const Icon = t.icon; const isActive = activeTab === t.id;
                            return (
                                <motion.button key={t.id} onClick={() => setActiveTab(t.id)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? '#10b981' : 'var(--text-secondary)', background: isActive ? 'rgba(16,185,129,0.06)' : 'transparent', border: 'none', borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent', borderRadius: '8px 8px 0 0', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Icon size={14} /> {t.label}
                                    {t.count > 0 && <span style={{ width: 20, height: 20, borderRadius: '50%', background: isActive ? '#10b981' : 'var(--bg-surface)', color: isActive ? '#fff' : 'var(--text-tertiary)', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.count}</span>}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ═══ CONTENT ═══ */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 36px 36px' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>

                    {/* Help Guide (toggleable) */}
                    <AnimatePresence>
                        {showHelp && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 24 }}>
                                <OnboardingGuide onNavigate={(tab) => { setActiveTab(tab as any); setShowHelp(false); }} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading State */}
                    {isLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: '#10b981', marginRight: 12 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Loading automation rules...</span>
                        </div>
                    )}

                    {!isLoading && (
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>

                                    {/* Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                                        <StatOrb label="Total Rules" value={totalRules} sub={`${activeRules} active`} color="#3b82f6" icon={Layers} sparkData={[totalRules]} index={0} />
                                        <StatOrb label="Schedules" value={schedules.length} sub={`${schedules.filter((s: any) => s.isActive !== false).length} running`} color="#10b981" icon={Calendar} sparkData={[schedules.length]} index={1} />
                                        <StatOrb label="Webhooks" value={webhooks.length} sub={`${webhooks.filter((w: any) => w.isActive !== false).length} connected`} color="#f59e0b" icon={Webhook} sparkData={[webhooks.length]} index={2} />
                                        <StatOrb label="Alert Rules" value={alerts.length} sub={`${alerts.filter((a: any) => a.isActive !== false).length} armed`} color="#8b5cf6" icon={BellRing} sparkData={[alerts.length]} index={3} />
                                    </div>

                                    {/* Empty State with Guidance */}
                                    {isEmpty ? (
                                        <div>
                                            <div className="card" style={{ padding: '48px 36px', textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, borderRadius: '50%', background: '#10b981', opacity: 0.04, filter: 'blur(60px)' }} />
                                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                                                    <Workflow size={48} style={{ color: '#10b981', margin: '0 auto 16px', opacity: 0.6 }} />
                                                </motion.div>
                                                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>No automation rules yet</h3>
                                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 auto 24px', maxWidth: 480, lineHeight: 1.6 }}>
                                                    Start automating your data workflows by creating your first scheduled pipeline, webhook, or alert rule. Click the <strong>Help</strong> button above for a step-by-step guide.
                                                </p>
                                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <button onClick={() => setActiveTab('schedules')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
                                                        <Calendar size={14} /> Create Schedule
                                                    </button>
                                                    <button onClick={() => setActiveTab('webhooks')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
                                                        <Webhook size={14} /> Add Webhook
                                                    </button>
                                                    <button onClick={() => setActiveTab('alerts')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
                                                        <BellRing size={14} /> Create Alert
                                                    </button>
                                                    <button onClick={() => setShowHelp(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
                                                        <BookOpen size={14} /> View Getting Started Guide
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Always show guide on empty */}
                                            <OnboardingGuide onNavigate={(tab) => setActiveTab(tab as any)} />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                                            {/* All Rules List */}
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Layers size={12} /> All Automation Rules
                                                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>({totalRules} total)</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {allItems.map((item, i) => <AutomationItemRow key={item.id} item={item} type={item._type} index={i} />)}
                                                </div>
                                            </div>

                                            {/* Sidebar: Quick Actions + Tips */}
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Zap size={12} /> Quick Actions
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                                    <QuickActionCard label="Schedule Pipeline" desc="Automate recurring analysis on a CRON schedule" icon={Calendar} color="#10b981" onClick={() => setActiveTab('schedules')} index={0} />
                                                    <QuickActionCard label="Deploy Webhook" desc="Forward events to Slack, Zapier, or custom APIs" icon={Webhook} color="#f59e0b" onClick={() => setActiveTab('webhooks')} index={1} />
                                                    <QuickActionCard label="Create Alert Rule" desc="Monitor any metric threshold automatically" icon={BellRing} color="#8b5cf6" onClick={() => setActiveTab('alerts')} index={2} />
                                                </div>

                                                {/* Pro Tips */}
                                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Lightbulb size={12} /> Pro Tips
                                                </div>
                                                <div className="card" style={{ padding: '16px 20px' }}>
                                                    {[
                                                        { tip: 'Use "0 9 * * 1-5" to run analyses on weekdays only.' },
                                                        { tip: 'Webhook URLs must start with https:// for security.' },
                                                        { tip: 'Combine alerts with webhooks to get Slack notifications on threshold breaches.' },
                                                        { tip: 'Set isActive to false to pause rules without deleting them.' },
                                                    ].map((t, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : undefined }}>
                                                            <Info size={12} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
                                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.tip}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'schedules' && (
                                <motion.div key="schedules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="card" style={{ padding: 28 }}>
                                    <SchedulesTab />
                                </motion.div>
                            )}
                            {activeTab === 'webhooks' && (
                                <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="card" style={{ padding: 28 }}>
                                    <WebhooksTab />
                                </motion.div>
                            )}
                            {activeTab === 'alerts' && (
                                <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="card" style={{ padding: 28 }}>
                                    <AlertsTab />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};
