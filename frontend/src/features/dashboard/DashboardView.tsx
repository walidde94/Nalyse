import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import {
    Folder, Trash2, FileText, FileSpreadsheet, Star, CloudUpload,
    BrainCircuit, BarChart3, Zap, ShieldCheck, ShieldAlert, TrendingUp,
    AlertTriangle, Activity, Clock, Sparkles, ArrowUpRight, ArrowDownRight,
    Search, ArrowRight, X, Lightbulb, Database, Table, Eye, Loader2,
    Layers, Target, Cpu, Archive, RotateCcw, HardDrive, CheckCircle2, FileJson,
    FilePlus, Gauge, Info, ArrowUp, ArrowDown, Wifi, Globe, Lock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip, BarChart, Bar, XAxis, LineChart, Line } from 'recharts';
import { calculatePulse } from './pulseEngine';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useArchitect } from '../../contexts/ArchitectContext';
import { AmbientStatusStrip, IntelligenceTimeline, PerformanceGauge, LiveClock } from './CommandHUD';
import { NeuralDropZone } from './NeuralDropZone';
import { ArchitectNode } from '../../components/layout/ArchitectNode';
import { DiagnosticOverlay } from '../../components/layout/DiagnosticOverlay';
import { ObservabilityDashboard } from './ObservabilityDashboard';
import { Responsive as ResponsiveGrid, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(ResponsiveGrid);


// ═══════════════════════════════════════════════════════════════════
// NEXT-LEVEL BENTO DASHBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const BENTO = {
    radius: 'var(--bento-radius)',
    glass: 'var(--bento-glass)',
    border: 'var(--bento-border)',
    borderHover: 'var(--bento-border-hover)',
    shadow: 'var(--bento-shadow)',
    blur: 'var(--bento-blur)',
};

// --- Animated SVG Radial Gauge ---
const RadialGauge = ({ value = 0, size = 120, label, color = '#6366f1' }: any) => {
    const { t } = useLanguage();
    const r = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, value));
    const offset = circ - (circ * pct) / 100;
    const gradId = `gauge-${label}`;
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={`${color}80`} />
                    </linearGradient>
                </defs>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke='var(--bg-surface-hover)' strokeWidth={6} />
                <motion.circle
                    cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={`url(#${gradId})`} strokeWidth={6}
                    strokeLinecap="round" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{pct}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
        </div>
    );
};

// --- Bento Stat Tile with inline sparkline ---
const BentoStat = ({ label, value, unit, icon: Icon, color = '#6366f1', sparkData, delta }: any) => {
    const isUp = delta && delta > 0;
    const isDown = delta && delta < 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, borderColor: BENTO.borderHover }}
            transition={{ duration: 0.3 }}
            style={{
                padding: '20px', borderRadius: BENTO.radius,
                background: BENTO.glass, border: `1px solid ${BENTO.border}`,
                backdropFilter: BENTO.blur,
                display: 'flex', flexDirection: 'column', gap: '12px',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.25s, transform 0.25s',
                cursor: 'default', flex: '1 1 0',
            }}
        >
            {/* accent glow */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: `${color}08`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} style={{ color }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                {delta !== undefined && delta !== 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isUp ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        {Math.abs(delta)}
                    </span>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{value}</span>
                    {unit && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{unit}</span>}
                </div>
                {sparkData && sparkData.length > 0 && (
                    <div style={{ width: '72px', height: '28px', opacity: 0.6 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${label})`} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// --- AI-generated Contextual Summary ---
const ContextualSummary = ({ metrics, fileCount, totalStorage }: any) => {
    const { t } = useLanguage();
    const lines = useMemo(() => {
        const l: string[] = [];
        if (fileCount === 0) {
            l.push(t('dashboard.uploadFirst'));
            return l;
        }
        // composition insight
        const dominant = [{ n: 'CSV', c: metrics.csvCount }, { n: 'JSON', c: metrics.jsonCount }, { n: 'Excel', c: metrics.excelCount }].sort((a, b) => b.c - a.c)[0];
        if (dominant.c > 0) l.push(`${t('dashboard.workspaceDominant').replace('{type}', dominant.n).replace('{count}', String(dominant.c)).replace('{total}', String(fileCount))}`);
        // health insight
        const healthPct = fileCount > 0 ? Math.round((metrics.processedCount / fileCount) * 100) : 0;
        if (healthPct === 100) l.push(t('dashboard.allAnalyzed'));
        else if (healthPct > 50) l.push(`${metrics.pendingCount} ${t('dashboard.pendingAnalysis')}`);
        else if (fileCount > 0) l.push(t('dashboard.needProcessing'));
        // recency insight
        if (metrics.newestUpload) l.push(`${t('dashboard.lastActivity')}: ${metrics.newestUpload}.`);
        // storage insight
        const storNum = Number(totalStorage);
        if (storNum > 50) l.push(`${t('dashboard.storageUsage')} ${totalStorage} ${t('common.mb')}.`);
        return l;
    }, [metrics, fileCount, totalStorage]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lines.map((line, i) => (
                <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6 }}
                >
                    {line}
                </motion.p>
            ))}
        </div>
    );
};

// --- File Type Donut with center label ---
const TypeDonut = ({ csvCount, jsonCount, excelCount, otherCount }: any) => {
    const { t } = useLanguage();
    const total = csvCount + jsonCount + excelCount + otherCount;
    const data = [
        { name: 'CSV', value: csvCount, color: '#10b981' },
        { name: 'JSON', value: jsonCount, color: '#6366f1' },
        { name: 'Excel', value: excelCount, color: '#f59e0b' },
        { name: 'Other', value: otherCount, color: '#8b5cf6' },
    ].filter(d => d.value > 0);
    if (total === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: '13px' }}>{t('dashboard.noFiles')}</div>;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
            <div style={{ width: 100, height: 100, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" innerRadius={30} outerRadius={46} paddingAngle={4} strokeWidth={0}>
                            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                {data.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Upload Activity mini area chart ---
const ActivityMini = ({ uploadsByDay }: { uploadsByDay: { day: string; count: number }[] }) => {
    const { t } = useLanguage();
    const hasData = uploadsByDay.some(d => d.count > 0);
    if (!hasData) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: '13px' }}>{t('dashboard.noActivity')}</div>;
    const totalUploads = uploadsByDay.reduce((a, d) => a + d.count, 0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalUploads}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{t('dashboard.uploadsPer14d')}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={uploadsByDay} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ fontWeight: 700, color: 'var(--text-primary)' }} cursor={false} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#actGrad)" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Live Data Ribbon (scrolling ticker) ---
const DataRibbon = ({ items }: { items: { label: string; value: string; color: string }[] }) => (
    <div style={{
        overflow: 'hidden', width: '100%', padding: '8px 0',
        borderTop: `1px solid ${BENTO.border}`, borderBottom: `1px solid ${BENTO.border}`,
        background: 'var(--bg-surface)',
    }}>
        <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', width: 'max-content' }}
        >
            {[...items, ...items].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{item.value}</span>
                </span>
            ))}
        </motion.div>
    </div>
);

// --- Bento Card wrapper with glass effect ---
const BentoCard = ({ children, span = 1, style, className = '' }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ borderColor: BENTO.borderHover }}
        transition={{ duration: 0.35 }}
        className={className}
        style={{
            gridColumn: `span ${span}`,
            padding: '24px', borderRadius: BENTO.radius,
            background: BENTO.glass, border: `1px solid ${BENTO.border}`,
            backdropFilter: BENTO.blur,
            boxShadow: BENTO.shadow,
            display: 'flex', flexDirection: 'column', gap: '16px',
            transition: 'border-color 0.25s',
            position: 'relative', overflow: 'hidden',
            ...style
        }}
    >
        {children}
    </motion.div>
);

const BentoCardHeader = ({ icon: Icon, title, badge }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon && <Icon size={15} style={{ color: 'var(--primary)' }} />}
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        </div>
        {badge && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)' }}>{badge}</span>}
    </div>
);

const RecentActivityItem = ({ file, onClick }: any) => {
    const { t } = useLanguage();
    return (
    <div
        className="flex items-center justify-between p-3 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer transition-colors group border-b border-[var(--border-subtle)] last:border-0"
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${file.filename.endsWith('.csv') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {file.filename.endsWith('.csv') ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
            </div>
            <div>
                <h4 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{file.originalName || file.filename}</h4>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Clock size={12} />
                    <span>{t('dashboard.updated')} {new Date(file.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{(file.size / 1024).toFixed(0)} {t('common.kb')}</span>
                </div>
            </div>
        </div>
        <button className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100">
            <ArrowUpRight size={16} />
        </button>
    </div>
    );
};

const WatchlistItem = ({ insight, onRemove }: any) => {
    const { t, pluralize } = useLanguage();
    return (
    <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-primary/30 transition-all group">
        <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-primary" />
                    <h4 className="text-sm font-bold text-primary">{insight.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                        {new Date(insight.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
                <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{insight.summary}</p>
                {insight.advice && insight.advice.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-tertiary">{pluralize(insight.advice.length, 'dashboard.recommendation', 'dashboard.recommendations')}</span>
                    </div>
                )}
            </div>
            <button
                onClick={onRemove}
                className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('dashboard.removeFromWatchlist')}
            >
                <X size={14} />
            </button>
        </div>
    </div>
    );
};
const QuotaGuard = ({ fileCount, storageUsed, maxStorage, userPlan, onUpgrade }: any) => {
    const { t } = useLanguage();
    const isPro = userPlan === 'pro' || userPlan === 'enterprise';
    const fileLimit = 5;
    const isFileLimitReached = fileCount >= fileLimit && !isPro;
    const isStorageLimitReached = storageUsed >= maxStorage && !isPro;
    const isApproaching = (fileCount >= fileLimit - 1 || storageUsed >= maxStorage * 0.8) && !isPro;

    const filePercent = Math.min(100, Math.round((fileCount / fileLimit) * 100));
    const storagePercent = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

    if (isPro) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`relative mb-10 overflow-hidden rounded-[32px] border ${isFileLimitReached || isStorageLimitReached ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--primary)]/20 bg-[var(--bg-card)]'}`}
            style={{
                boxShadow: isFileLimitReached || isStorageLimitReached ? '0 30px 60px -15px rgba(239, 68, 68, 0.2)' : '0 30px 60px -15px rgba(99, 102, 241, 0.15)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                padding: 'clamp(32px, 5vw, 48px)',
                isolation: 'isolate'
            }}
        >
            {/* Holographic Glowing Border / Beam Effect */}
            <div className="absolute inset-x-0 -top-px h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-70 blur-[1px]"></div>
            <div className="absolute inset-x-0 -bottom-px h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50 blur-[1px]"></div>

            {/* Ambient Animated Orbs */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[32px] mix-blend-screen mix-blend-plus-lighter pointer-events-none">
                <motion.div
                    animate={{ x: ['-20%', '20%', '-20%'], y: ['-20%', '20%', '-20%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -right-[10%] -top-[30%] w-[50%] h-[150%] rounded-full mix-blend-multiply"
                    style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.25 }}
                />
                <motion.div
                    animate={{ x: ['20%', '-20%', '20%'], y: ['20%', '-20%', '20%'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -left-[10%] -bottom-[30%] w-[40%] h-[120%] rounded-full mix-blend-multiply"
                    style={{ background: 'radial-gradient(circle, #c026d3 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.15 }}
                />
            </div>


            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', position: 'relative', zIndex: 10, alignItems: 'center' }}>

                {/* Left Side: Advanced Telemetry UI & Copy */}
                <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{
                            padding: '6px 20px', borderRadius: '99px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: isFileLimitReached || isStorageLimitReached ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(90deg, var(--primary-subtle), transparent)',
                            color: isFileLimitReached || isStorageLimitReached ? '#ef4444' : 'var(--primary)',
                            border: `1px solid ${isFileLimitReached || isStorageLimitReached ? 'rgba(239, 68, 68, 0.3)' : 'var(--primary-glow)'}`,
                            boxShadow: `0 0 20px ${isFileLimitReached || isStorageLimitReached ? 'rgba(239,68,68,0.2)' : 'var(--primary-glow)'}`
                        }}>
                            {isFileLimitReached || isStorageLimitReached ? (
                                <AlertTriangle size={14} className="animate-pulse" />
                            ) : (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="absolute w-4 h-4 rounded-full animate-ping" style={{ background: 'var(--primary)', opacity: 0.4 }} />
                                    <div className="relative w-2 h-2 rounded-full" style={{ background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                                </div>
                            )}
                            <span style={{ textShadow: `0 0 10px ${isFileLimitReached || isStorageLimitReached ? 'rgba(239,68,68,0.5)' : 'var(--primary)'}` }}>
                                {isFileLimitReached || isStorageLimitReached ? t('dashboard.quotaExhausted') : t('dashboard.storageQuota')}
                            </span>
                        </div>

                        {isApproaching && !isFileLimitReached && !isStorageLimitReached && (
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}
                            >
                                <Zap size={12} fill="currentColor" />
                                <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{t('dashboard.approachingLimit')}</span>
                            </motion.div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h2 style={{
                            fontSize: 'clamp(28px, 4vw, 42px)',
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                        }}>
                            {isFileLimitReached || isStorageLimitReached
                                ? t('dashboard.storageLimitReached')
                                : t('dashboard.upgradeTier')}
                        </h2>
                        <p style={{
                            fontSize: 'clamp(15px, 1.5vw, 17px)',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            lineHeight: 1.7,
                            maxWidth: '650px',
                            fontWeight: 500
                        }}>
                            {isFileLimitReached || isStorageLimitReached
                                ? t('dashboard.storageLimitReached') + '. ' + t('dashboard.upgradeDesc')
                                : t('dashboard.upgradeDesc')}
                        </p>
                    </div>
                </div>

                {/* Right Side: Futuristic Metrics & Action */}
                <div style={{ flex: '0 1 400px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

                    <div style={{
                        padding: '28px',
                        borderRadius: '24px',
                        background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}>
                        {/* Active Datasets Metric */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Database size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>{t('dashboard.activeDatasets')}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                                    <span style={{ color: isFileLimitReached ? '#ef4444' : 'var(--text-primary)', fontSize: '18px' }}>{fileCount}</span> / {fileLimit}
                                </span>
                            </div>
                            <div style={{ height: '8px', width: '100%', borderRadius: '99px', background: 'var(--bg-main)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${filePercent}%` }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    style={{
                                        height: '100%',
                                        borderRadius: '99px',
                                        background: isFileLimitReached ? '#ef4444' : 'linear-gradient(90deg, var(--primary), #a855f7)',
                                        boxShadow: '0 0 15px rgba(124, 58, 237, 0.6)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)' }} />

                        {/* Storage Metric */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Layers size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>{t('dashboard.neuralStorage')}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                                    <span style={{ color: isStorageLimitReached ? '#ef4444' : 'var(--text-primary)', fontSize: '18px' }}>{storageUsed}</span><span style={{ fontSize: '11px', marginLeft: '2px' }}>{t('common.mb')}</span> <span style={{ opacity: 0.5 }}>/</span> {maxStorage}<span style={{ fontSize: '11px', marginLeft: '2px' }}>{t('common.mb')}</span>
                                </span>
                            </div>
                            <div style={{ height: '8px', width: '100%', borderRadius: '99px', background: 'var(--bg-main)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${storagePercent}%` }}
                                    transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
                                    style={{
                                        height: '100%',
                                        borderRadius: '99px',
                                        background: isStorageLimitReached ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #0ea5e9)',
                                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        onClick={onUpgrade}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative"
                        style={{
                            minHeight: '72px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            borderRadius: '24px',
                            border: '1px solid var(--border-default)',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 50%, #d946ef 100%)',
                            backgroundSize: '200% auto',
                            boxShadow: '0 10px 40px -10px rgba(168, 85, 247, 0.8), inset 0 2px 0 rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            width: '100%'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] blur-[10px]"></div>

                        <span style={{
                            position: 'relative',
                            color: 'var(--text-primary)',
                            fontSize: '15px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <Sparkles size={16} className="text-white/80" />
                            {t('dashboard.upgradeNow')}
                        </span>
                        <ArrowRight size={20} className="relative group-hover:translate-x-2 transition-transform duration-300" style={{ color: 'var(--text-primary)' }} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};





// --- MAIN COMPONENT ---

export const DashboardView = ({
    userEmail,
    firstName,
    userPlan,
    files,
    groups,
    onUpload,
    onUpgrade,
    dragActive,
    handleDrag,
    handleDrop,
    onFileSelect,
    onDeleteFile,
    onToggleFavorite,
    onUpdateFileGroup,
    onUpdateFileWorkspace,
    onCreateGroup,
    onDeleteGroup,
    onDeleteMultiple,
    onViewReport,
    onArchiveFile,
    onRefresh,
}: any) => {
    const { workspaces, setActiveWorkspace } = useWorkspace();
    const { user, token, refreshProfile, syncSubscription } = useAuth();
    const { t, pluralize } = useLanguage();
    const { isArchitectMode, layoutMode, layoutState, updateLayoutSequence } = useArchitect();
    const maxStorageMB = userPlan === 'pro' ? 10240 : userPlan === 'enterprise' ? 1000000 : 100;
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [showTelemetry, setShowTelemetry] = useState(false);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupSummary, setCleanupSummary] = useState({ archived: 0, stagnant: 0, total: 0 });
    const [telemetryData, setTelemetryData] = useState({
        latency: 12,
        throughput: 840,
        memory: 1.2,
        cpu: 8,
        uptime: '00:00:00'
    });
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [pinnedInsights, setPinnedInsights] = useState<any[]>([]);

    // Metadata & Preview State
    const [viewingMeta, setViewingMeta] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [activeTab, setActiveTab] = useState<'properties' | 'preview'>('properties');
    const [datasetTab, setDatasetTab] = useState<'active' | 'archived'>('active');
    const [workspaceFilter, setWorkspaceFilter] = useState<string>('all'); // 'all', 'private', or specific workspaceId
    const safeFiles = Array.isArray(files) ? files : [];

    const filteredFiles = useMemo(() => {
        let list = safeFiles;
        
        // Tab Filter (Active/Archived)
        if (datasetTab === 'active') {
            list = list.filter(f => !f.isArchived);
        } else {
            list = list.filter(f => f.isArchived);
        }

        // Workspace Filter
        if (workspaceFilter === 'private') {
            list = list.filter(f => !f.workspaceId);
        } else if (workspaceFilter !== 'all') {
            list = list.filter(f => f.workspaceId === workspaceFilter);
        }

        // Search Filter
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            list = list.filter(f => (f.originalName || f.filename).toLowerCase().includes(low));
        }
        return list;
    }, [safeFiles, searchTerm, datasetTab, workspaceFilter]);

    const activeFilesCount = useMemo(() => safeFiles.filter(f => !f.isArchived).length, [safeFiles]);
    const archivedFilesCount = useMemo(() => safeFiles.filter(f => f.isArchived).length, [safeFiles]);

    useEffect(() => {
        if (viewingMeta) {
            const latest = safeFiles.find(f => f.id === viewingMeta.id);
            if (latest && (latest.isProcessed !== viewingMeta.isProcessed || latest.isFavorite !== viewingMeta.isFavorite || latest.groupId !== viewingMeta.groupId)) {
                setViewingMeta(latest);
            }
        }
    }, [safeFiles, viewingMeta]);

    useEffect(() => {
        if (viewingMeta) {
            fetchPreview();
            setActiveTab('properties');
        } else {
            setPreviewData([]);
        }
    }, [viewingMeta]);

    const fetchPreview = async () => {
        if (!viewingMeta) return;
        setLoadingPreview(true);
        try {
            const res = await fetch(`${API_URL}/api/files/${viewingMeta.id}/preview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewData(data);
            }
        } catch (e) {
            console.error('Preview error:', e);
            setPreviewData(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const getGroupName = (groupId: string) => groups.find((g: any) => g.id === groupId)?.name || t('dashboard.uncategorized');

    // Load pinned insights from localStorage
    useEffect(() => {
        const loadInsights = () => {
            try {
                const stored = localStorage.getItem('strategic_watchlist');
                setPinnedInsights(stored ? JSON.parse(stored) : []);
            } catch (e) {
                console.error('Failed to load insights:', e);
                setPinnedInsights([]);
            }
        };
        loadInsights();

        // Check for subscription callbacks
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            syncSubscription();

            // Start polling as webhooks can be slow
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                const isPro = await syncSubscription();

                // If plan is already updated or we exceeded attempts, stop polling
                if (isPro || attempts >= 5) {
                    clearInterval(interval);
                }
            }, 3000);

            // Remove params
            window.history.replaceState({}, '', window.location.pathname);

            return () => clearInterval(interval);
        }

        // Listen for storage changes (from other tabs/windows)
        window.addEventListener('strategic-update', loadInsights);
        window.addEventListener('storage', loadInsights);
        return () => {
            window.removeEventListener('strategic-update', loadInsights);
            window.removeEventListener('storage', loadInsights);
        };
    }, []);



    // Digital Pulse State (Backend Telemetry)
    const [pulseData, setPulseData] = useState<any>(null);
    const [loadingPulse, setLoadingPulse] = useState(true);

    const fetchPulse = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/pulse`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPulseData(data);
            }
        } catch (e) {
            console.error('Pulse sync failed:', e);
        } finally {
            setLoadingPulse(false);
        }
    }, [token]);


    useEffect(() => {
        fetchPulse();
        // Sync pulse every 3 seconds for real-time telemetry feel
        const interval = setInterval(fetchPulse, 3000);
        return () => clearInterval(interval);
    }, [fetchPulse]);

    // Real-time telemetry for the hero gauge (and the telemetry modal when open)
    useEffect(() => {
        const updateTelemetry = () => {
            // 1. Memory Measurement (Chrome/Edge/Opera supported)
            let currentMemory = 1.25;
            const perf = (window.performance as any);
            if (perf && perf.memory) {
                currentMemory = perf.memory.usedJSHeapSize / (1024 * 1024 * 1024);
            }

            // 2. Thread Load Estimation (Heuristic via event loop drift)
            const startTime = performance.now();
            setTimeout(() => {
                const endTime = performance.now();
                const drift = (endTime - startTime) - 50; // Delay was set to 50ms
                const load = Math.min(100, Math.max(2, Math.round(drift * 2.5)));
                
                setTelemetryData(prev => ({
                    ...prev,
                    memory: currentMemory,
                    cpu: load || 5 // Base browser overhead
                }));
            }, 50);

            // 3. Ops/s - Based on real-time dataset mapping density
            const ops = (safeFiles.length * 2.1) + (Math.random() * 3);
            setTelemetryData(prev => ({ ...prev, throughput: Math.round(ops) }));
        };

        updateTelemetry();
        const interval = setInterval(updateTelemetry, 2000);
        return () => clearInterval(interval);
    }, [safeFiles]);

    // Network latency for live health score (hero gauge)
    useEffect(() => {
        const measureLatency = async () => {
            const t1 = performance.now();
            try {
                // Profile a lightweight health check to measure real round-trip time
                await fetch(`${API_URL}/heartbeat`, { method: 'HEAD' }).catch(() => {});
                const t2 = performance.now();
                setTelemetryData(prev => ({ ...prev, latency: Math.round(t2 - t1) }));
            } catch {
                setTelemetryData(prev => ({ ...prev, latency: 42 }));
            }
        };
        measureLatency();
        const interval = setInterval(measureLatency, 5000);
        return () => clearInterval(interval);
    }, []);

    // Derived State
    const localMetrics = useMemo(() => calculatePulse(safeFiles), [safeFiles]);
    
    // Merge backend pulse with local file-based heuristics and LIVE TELEMETRY
    const metrics = useMemo(() => {
        // Calculate a live health score based on telemetry
        // CPU range: 0-100 (weighted 40%), Latency range: 0-200 (weighted 30%), Memory range: 1.0-4.0 (weighted 30%)
        const cpuScore = Math.min(100, Math.max(0, 100 - (telemetryData?.cpu || 0)));
        const latencyScore = Math.min(100, Math.max(0, 100 - ((telemetryData?.latency || 42) / 2)));
        const memoryScore = Math.min(100, Math.max(0, 100 - (((telemetryData?.memory || 1.25) - 1) * 33)));
        const liveHealth = Math.min(100, Math.round((cpuScore * 0.4) + (latencyScore * 0.3) + (memoryScore * 0.3)));

        if (!pulseData) return { ...localMetrics, systemHealth: liveHealth };
        return {
            ...localMetrics,
            revenue: pulseData.revenue || localMetrics.revenue,
            revenueGrowth: pulseData.revenueGrowth || localMetrics.revenueGrowth,
            anomalies: pulseData.anomalies ?? localMetrics.anomalies,
            findings: pulseData.findings || localMetrics.findings,
            systemHealth: liveHealth || pulseData.systemHealth || 100,
            telemetry: { ...pulseData.telemetry, ...telemetryData }
        };
    }, [localMetrics, pulseData, telemetryData]);
    const recentFiles = useMemo(() => [...safeFiles].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [safeFiles]);
    const starredFiles = useMemo(() => safeFiles.filter((f: any) => f.isFavorite), [safeFiles]);



    const totalStorage = (safeFiles.reduce((acc: number, f: any) => acc + Number(f.size), 0) / 1024 / 1024).toFixed(2);
    const totalStorageNum = Number(totalStorage);
    const fileCount = safeFiles.filter(f => !f.isArchived).length;
    const isOverLimit = (activeFilesCount >= 5 && (userPlan === 'free' || !userPlan)) || totalStorageNum >= maxStorageMB;

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        onCreateGroup(newGroupName, '');
        setNewGroupName('');
        setShowCreateGroup(false);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFiles(newSet);
    };

    const toggleAll = (groupFiles: any[]) => {
        const newSet = new Set(selectedFiles);
        const allSelected = groupFiles.every(f => newSet.has(f.id));

        if (allSelected) {
            groupFiles.forEach(f => newSet.delete(f.id));
        } else {
            groupFiles.forEach(f => newSet.add(f.id));
        }
        setSelectedFiles(newSet);
    };

    const handleBulkDelete = () => {
        if (selectedFiles.size === 0) return;
        if (confirm(t('dashboard.confirmDelete').replace('{count}', String(selectedFiles.size)))) {
            onDeleteMultiple(Array.from(selectedFiles));
            setSelectedFiles(new Set());
        }
    };

    const handleSystemCleanup = () => {
        // Prepare summary
        const archivedCount = safeFiles.filter((f: any) => f.isArchived).length;
        const stagnantCount = safeFiles.filter((f: any) => !f.isProcessed && !f.groupId && new Date(f.createdAt).getTime() < Date.now() - 3600000).length;
        
        if (archivedCount + stagnantCount === 0) {
            alert(t('dashboard.systemOptimized'));
            return;
        }

        setCleanupSummary({
            archived: archivedCount,
            stagnant: stagnantCount,
            total: archivedCount + stagnantCount
        });
        setShowCleanupModal(true);
    };

    const confirmSystemCleanup = async () => {
        setIsCleaningUp(true);
        try {
            const res = await fetch(`${API_URL}/api/files/cleanup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShowCleanupModal(false);
                onRefresh(); // Trigger a global refresh
                alert(`${t('dashboard.cleanupComplete')} ${data.purgedCount}`);
            } else {
                alert(t('dashboard.cleanupFailed'));
            }
        } catch (e) {
            console.error(e);
            alert(t('dashboard.networkError'));
        } finally {
            setIsCleaningUp(false);
        }
    };

    // Group logic for 'All Files' view
    const groupedFiles: Record<string, any[]> = { 'ungrouped': [] };
    const safeGroups = Array.isArray(groups) ? groups : [];
    safeGroups.forEach((g: any) => { groupedFiles[g.id] = []; });
    filteredFiles.forEach((f: any) => {
        if (f.groupId && groupedFiles[f.groupId]) {
            groupedFiles[f.groupId].push(f);
        } else {
            groupedFiles['ungrouped'].push(f);
        }
    });

    return (
        <div
            className="flex-col gap-6 fade-in main-content-mobile"
            style={{
                padding: 'clamp(16px, 5vw, 32px)',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%',
                fontFamily: 'Dubai, sans-serif',
                position: 'relative'
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Cinematic Full-Screen Drag & Drop Overlay */}
            <NeuralDropZone
                dragActive={dragActive}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                isOverLimit={isOverLimit}
            />



            {/* --- ARCHITECTURAL STAGE WRAPPER --- */}
            {(() => {
                const isCanvas = layoutMode === 'canvas';

                return (
                    <div style={{
                        display: isCanvas ? 'block' : 'flex',
                        flexDirection: layoutMode === 'vertical' ? 'column' : 'row',
                        flexWrap: 'wrap',
                        gap: isCanvas ? 0 : '24px',
                        width: '100%',
                        alignItems: 'flex-start'
                    }}>
                {/* --- AMBIENT STATUS STRIP --- */}
                {/* --- DYNAMIC COMMAND MATRIX --- */}
                {(() => {
                    // Define core segment definitions
                    const coreNodes = [
                        {
                            id: 'db-status-strip',
                            label: t('dashboard.ambientTelemetry'),
                            isDraggable: false,
                            component: <AmbientStatusStrip fileCount={fileCount} storageUsed={totalStorage} />
                        },
                        {
                            id: 'db-hero',
                            label: t('dashboard.overviewLabel'),
                            component: (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                                    {/* ── Hero Header ── */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                                                {t('header.welcome')}, <span style={{ color: 'var(--primary)' }}>{firstName || userEmail?.split('@')[0] || t('common.user')}</span>
                                            </h1>
                                            <ContextualSummary metrics={metrics} fileCount={fileCount} totalStorage={totalStorage} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ cursor: 'pointer' }} onClick={() => setShowTelemetry(true)}>
                                                <RadialGauge value={metrics.systemHealth} size={72} label={t('dashboard.systemHealth')} color={metrics.systemHealth > 80 ? '#10b981' : metrics.systemHealth > 50 ? '#f59e0b' : '#ef4444'} />
                                            </div>
                                            <LiveClock />
                                        </div>
                                    </div>

                                    {/* ── Live Data Ribbon ── */}
                                    <DataRibbon items={[
                                        { label: t('nav.workspace'), value: String(fileCount), color: '#6366f1' },
                                        { label: t('dashboard.storageQuota'), value: `${totalStorage} ${t('common.mb')}`, color: '#3b82f6' },
                                        { label: t('dashboard.analyzed'), value: `${metrics.processedCount}/${fileCount}`, color: '#10b981' },
                                        { label: t('dashboard.favorites'), value: String(metrics.favoriteCount), color: '#f59e0b' },
                                        { label: t('dashboard.archived'), value: String(metrics.archivedCount), color: '#64748b' },
                                        { label: t('dashboard.systemHealth'), value: `${metrics.systemHealth}%`, color: metrics.systemHealth > 80 ? '#10b981' : '#f59e0b' },
                                    ]} />

                                    {/* ── Bento Grid ── */}
                                    <div className="bento-grid-container" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gridAutoRows: 'auto',
                                        gap: '14px',
                                        width: '100%',
                                    }}>
                                        {/* Row 1: 4 stat tiles */}
                                        <div className="bento-card-span-1">
                                            <BentoStat label={t('nav.workspace')} value={fileCount} icon={Database} color="#6366f1" sparkData={metrics.uploadsByDay?.map((d: any) => ({ v: d.count }))} />
                                        </div>
                                        <div className="bento-card-span-1">
                                            <BentoStat label={t('dashboard.storageQuota')} value={totalStorage} unit={t('common.mb')} icon={HardDrive} color="#3b82f6" />
                                        </div>
                                        <div className="bento-card-span-1">
                                            <BentoStat label={t('dashboard.avgSize')} value={metrics.avgFileSizeKB > 0 ? metrics.avgFileSizeKB.toFixed(0) : '—'} unit={t('common.kb')} icon={Layers} color="#8b5cf6" />
                                        </div>
                                        <div className="bento-card-span-1">
                                            <BentoStat label={t('dashboard.favorites')} value={metrics.favoriteCount} icon={Star} color="#f59e0b" delta={0} />
                                        </div>

                                        {/* Row 2: File Types (2 cols) + Upload Activity (2 cols) */}
                                        <div className="bento-card-span-2" style={{ display: 'flex' }}>
                                            <BentoCard span={1} style={{ flex: 1, minHeight: '200px' }}>
                                                <BentoCardHeader icon={BarChart3} title={t('dashboard.fileTypes')} badge={`${metrics.csvCount + metrics.jsonCount + metrics.excelCount + metrics.otherCount} ${t('dashboard.total')}`} />
                                                <div style={{ flex: 1 }}>
                                                    <TypeDonut csvCount={metrics.csvCount} jsonCount={metrics.jsonCount} excelCount={metrics.excelCount} otherCount={metrics.otherCount} />
                                                </div>
                                            </BentoCard>
                                        </div>
                                        <div className="bento-card-span-2" style={{ display: 'flex' }}>
                                            <BentoCard span={1} style={{ flex: 1, minHeight: '200px' }}>
                                                <BentoCardHeader icon={TrendingUp} title={t('dashboard.uploadActivity')} badge={`14 ${t('dashboard.daysAgo')}`} />
                                                <div style={{ flex: 1, minHeight: 0 }}>
                                                    <ActivityMini uploadsByDay={metrics.uploadsByDay || []} />
                                                </div>
                                            </BentoCard>
                                        </div>

                                        {/* Row 3: Storage Quota (2 cols) + Data Health gauge (1 col) + Archived (1 col) */}
                                        <div className="bento-card-span-2" style={{ display: 'flex' }}>
                                            <BentoCard span={1} style={{ flex: 1 }}>
                                                <BentoCardHeader icon={HardDrive} title={t('dashboard.storageQuota')} />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalStorage}<span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}> / {maxStorageMB} {t('common.mb')}</span></span>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: totalStorageNum > maxStorageMB * 0.9 ? '#ef4444' : 'var(--text-tertiary)' }}>{Math.round((totalStorageNum / maxStorageMB) * 100)}%</span>
                                                    </div>
                                                    <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totalStorageNum / maxStorageMB) * 100)}%` }} transition={{ duration: 1.4, ease: 'easeOut' }}
                                                            style={{ height: '100%', borderRadius: 99, background: totalStorageNum > maxStorageMB * 0.9 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #6366f1, #a78bfa)' }} />
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{(maxStorageMB - totalStorageNum).toFixed(1)} {t('common.mb')} {t('dashboard.active')}</span>
                                                </div>
                                            </BentoCard>
                                        </div>
                                        <div className="bento-card-span-1" style={{ display: 'flex' }}>
                                            <BentoCard span={1} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <RadialGauge value={fileCount > 0 ? Math.round((metrics.processedCount / fileCount) * 100) : 0} size={100} label={t('dashboard.analyzed')} color="#10b981" />
                                            </BentoCard>
                                        </div>
                                        <div className="bento-card-span-1" style={{ display: 'flex' }}>
                                            <BentoCard span={1} style={{ flex: 1 }}>
                                                <BentoCardHeader icon={Archive} title={t('dashboard.archived')} />
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '4px' }}>
                                                    <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{metrics.archivedCount}</span>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{t('dashboard.datasetsShelved')}</span>
                                                </div>
                                            </BentoCard>
                                        </div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            id: 'db-workspace',
                            label: t('dashboard.datasetWorkspace'),
                            component: (
                                <section className="relative w-full" style={{ zIndex: 20 }}>
                                    <div style={{
                                        padding: '24px 32px', borderRadius: '24px',
                                        background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
                                        border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px'
                                    }}>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
                                            <span>{t('dashboard.total')}: {pluralize(files.length, 'dashboard.file', 'dashboard.files')}</span>
                                            <span>{t('dashboard.scoped')}: {pluralize(filteredFiles.length, 'dashboard.file', 'dashboard.files')}</span>
                                        </div>
                                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <div style={{
                                                    width: '48px', height: '48px', borderRadius: '16px',
                                                    background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                                                }}>
                                                    <CloudUpload size={24} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                                            {workspaceFilter === 'all' ? t('dashboard.universalHub') : workspaceFilter === 'private' ? t('dashboard.privateSpace') : workspaces.find(w => w.id === workspaceFilter)?.name || t('dashboard.activeWorkspace')}
                                                        </h3>
                                                        <div style={{ position: 'relative' }}>
                                                            <select 
                                                                value={workspaceFilter}
                                                                onChange={(e) => setWorkspaceFilter(e.target.value)}
                                                                style={{
                                                                    opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%'
                                                                }}
                                                            >
                                                                <option value="all">{t('dashboard.allAssets')}</option>
                                                                <option value="private">{t('dashboard.privateSpace')}</option>
                                                                <optgroup label={t('dashboard.workspaces')}>
                                                                    {workspaces.map(w => (
                                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                                    ))}
                                                                </optgroup>
                                                            </select>
                                                            <div style={{
                                                                padding: '2px 8px', borderRadius: '6px', background: 'var(--primary-subtle)', 
                                                                color: 'var(--primary)', fontSize: '10px', fontWeight: 800, border: '1px solid var(--primary-glow)',
                                                                display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                                                            }}>
                                                                {t('dashboard.switch')} <ArrowRight size={10} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                                        {filteredFiles.length} {workspaceFilter === 'all' ? t('dashboard.total') : t('dashboard.scoped')} {t('dashboard.datasetsLoaded')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
                                                <div className="relative flex-1 xl:w-72 xl:flex-none">
                                                    <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                                    <input type="text" placeholder={t('dashboard.searchDatasets')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 16px 0 40px', borderRadius: '12px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                                                </div>
                                                <div style={{ display: 'flex', padding: '4px', background: 'var(--bg-surface-hover)', borderRadius: '14px', border: '1px solid var(--border-subtle)', gap: '4px' }}>
                                                    <button onClick={() => setViewMode('list')} style={{
                                                        padding: '7px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                        background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                                        color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                                                    }}>{t('dashboard.list')}</button>
                                                    <button onClick={() => setViewMode('grid')} style={{
                                                        padding: '7px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                        background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                                        color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                                                    }}>{t('dashboard.grid')}</button>
                                                </div>
                                                <div style={{ display: 'flex', padding: '4px', background: 'var(--bg-surface-hover)', borderRadius: '14px', border: '1px solid var(--border-subtle)', gap: '4px' }}>
                                                    <button onClick={() => setDatasetTab('active')} style={{
                                                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                        background: datasetTab === 'active' ? 'var(--primary)' : 'transparent',
                                                        color: datasetTab === 'active' ? '#fff' : 'var(--text-secondary)',
                                                    }}>
                                                        {t('dashboard.active')}{activeFilesCount > 0 && <span style={{ marginLeft: '6px', opacity: 0.6 }}>({activeFilesCount})</span>}
                                                    </button>
                                                    <button onClick={() => setDatasetTab('archived')} style={{
                                                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                        background: datasetTab === 'archived' ? 'var(--bg-elevated)' : 'transparent',
                                                        color: datasetTab === 'archived' ? '#fff' : 'var(--text-secondary)',
                                                    }}>
                                                        {t('dashboard.archived')}{archivedFilesCount > 0 && <span style={{ marginLeft: '6px', opacity: 0.6 }}>({archivedFilesCount})</span>}
                                                    </button>
                                                </div>

                                                {selectedFiles.size > 0 ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', background: 'var(--primary-subtle)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--primary-glow)' }}>
                                                            {selectedFiles.size} {t('dashboard.analyzed')}
                                                        </span>
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBulkDelete} style={{
                                                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 16px', borderRadius: '10px',
                                                            fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}>
                                                            <Trash2 size={15} /> {t('dashboard.deleteSelected')}
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedFiles(new Set())} style={{
                                                            background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px',
                                                            fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}>
                                                            <X size={15} /> {t('dashboard.clear')}
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                                                            const newSet = new Set<string>();
                                                            filteredFiles.forEach((f: any) => newSet.add(f.id));
                                                            setSelectedFiles(newSet);
                                                        }} style={{
                                                            background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px',
                                                            fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}>
                                                            <CheckCircle2 size={15} /> {t('dashboard.selectAll')}
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSystemCleanup} title="Delete all archived & old unprocessed items" style={{
                                                            background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px',
                                                            fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}>
                                                            <Activity size={15} /> {t('dashboard.cleanUp')}
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => document.getElementById('file-input')?.click()} disabled={isOverLimit} style={{
                                                            background: 'var(--primary)',
                                                            color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px',
                                                            fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                                            opacity: isOverLimit ? 0.5 : 1,
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                        }}>
                                                            <CloudUpload size={15} /> {t('dashboard.upload')}
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-col gap-6">
                                        {groups.map((group: any) => {
                                            const groupFiles = groupedFiles[group.id] || [];
                                            if (groupFiles.length === 0 && searchTerm) return null;
                                            return (
                                                <div key={group.id} className="flex-col gap-3 mb-6">
                                                    <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-subtle)] border-dashed">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-[var(--primary-subtle)] rounded-lg text-primary"><Folder size={14} /></div>
                                                            <span className="font-black text-xs uppercase tracking-widest">{group.name}</span>
                                                        </div>
                                                        <button className="btn btn-icon btn-ghost btn-xs text-danger/50" onClick={() => onDeleteGroup(group.id)}><Trash2 size={12} /></button>
                                                    </div>
                                                    {viewMode === 'list' ? (
                                                        <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                                            <FileTable files={groupFiles} groups={groups} selectedFiles={selectedFiles} onToggleSelection={toggleSelection} onToggleAll={() => toggleAll(groupFiles)} onFileSelect={onFileSelect} onToggleFavorite={onToggleFavorite} onDeleteFile={onDeleteFile} onArchiveFile={onArchiveFile} onUpdateFileGroup={onUpdateFileGroup} onUpdateFileWorkspace={onUpdateFileWorkspace} onViewMeta={setViewingMeta} />
                                                        </div>
                                                    ) : (
                                                        <FileGrid files={groupFiles} selectedFiles={selectedFiles} onToggleSelection={toggleSelection} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} onToggleFavorite={onToggleFavorite} onArchiveFile={onArchiveFile} onViewMeta={setViewingMeta} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(groupedFiles['ungrouped'].length > 0 || groups.length === 0) && (
                                            <div className="flex-col gap-3">
                                                {viewMode === 'list' ? (
                                                    <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                                        <FileTable files={groupedFiles['ungrouped']} groups={groups} selectedFiles={selectedFiles} onToggleSelection={toggleSelection} onToggleAll={() => toggleAll(groupedFiles['ungrouped'])} onFileSelect={onFileSelect} onToggleFavorite={onToggleFavorite} onDeleteFile={onDeleteFile} onArchiveFile={onArchiveFile} onUpdateFileGroup={onUpdateFileGroup} onUpdateFileWorkspace={onUpdateFileWorkspace} onViewMeta={setViewingMeta} />
                                                    </div>
                                                ) : (
                                                    <FileGrid files={groupedFiles['ungrouped']} selectedFiles={selectedFiles} onToggleSelection={toggleSelection} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} onToggleFavorite={onToggleFavorite} onArchiveFile={onArchiveFile} onViewMeta={setViewingMeta} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )
                        },
                        {
                            id: 'db-intelligence',
                            label: t('dashboard.intelligenceStream'),
                            component: <IntelligenceTimeline files={safeFiles} />
                        }
                    ];

                    const dynamicNodes = Object.values(layoutState)
                        .filter(node => node.id.startsWith('ext-') && node.visible)
                        .map(node => ({
                            id: node.id,
                            label: node.label,
                            component: (
                                <div style={{ 
                                    background: 'var(--bg-card)', borderRadius: '24px', padding: '32px',
                                    border: '1px solid var(--border-subtle)', minHeight: '180px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'
                                }}>
                                    {node.label} {t('dashboard.streamConfigured')}
                                </div>
                            )
                        }));

                    const allNodes = [...coreNodes, ...dynamicNodes];
                    
                    if (isCanvas) {
                        const currentLayout = allNodes.map((node, idx) => {
                            const conf = layoutState[node.id];
                            return {
                                i: node.id,
                                x: conf?.x !== undefined ? Number(conf.x) : 0,
                                y: conf?.y !== undefined ? Number(conf.y) : (idx * 4),
                                w: conf?.w !== undefined ? Number(conf.w) : 12,
                                h: conf?.h !== undefined ? Number(conf.h) : 4,
                                minW: 2,
                                minH: 1
                            };
                        });

                        return (
                            <ResponsiveGridLayout
                                className="layout w-full"
                                layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout, xs: currentLayout, xxs: currentLayout }}
                                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                                rowHeight={80}
                                margin={[24, 24]}
                                onDragStop={(layout) => isArchitectMode && updateLayoutSequence(layout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))}
                                onResizeStop={(layout) => isArchitectMode && updateLayoutSequence(layout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))}
                                draggableHandle=".react-grid-drag-handle"
                                isDraggable={isArchitectMode}
                                isResizable={isArchitectMode}
                                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                                useCSSTransforms={true}
                            >
                                {allNodes.map((node) => (
                                    <div key={node.id} style={{ overflow: 'auto', height: '100%' }}>
                                        <ArchitectNode id={node.id} label={node.label} isDraggable={(node as any).isDraggable !== false}>
                                            {node.component}
                                        </ArchitectNode>
                                    </div>
                                ))}
                            </ResponsiveGridLayout>
                        );
                    }

                    // Fallback flex mapping
                    return allNodes
                        .sort((a, b) => (layoutState[a.id]?.order || 0) - (layoutState[b.id]?.order || 0))
                        .map(node => {
                            const w = layoutState[node.id]?.width;
                            let flexBasis = '1 1 100%';
                            if (layoutMode === 'grid') {
                                if (w === '50%') flexBasis = '1 1 calc(50% - 12px)';
                                else if (w === '33%') flexBasis = '1 1 calc(33.333% - 16px)';
                            }
                            return (
                            <ArchitectNode 
                                key={node.id} id={node.id} label={node.label}
                                isDraggable={(node as any).isDraggable !== false}
                                style={{ flex: flexBasis }}
                            >
                                {node.component}
                            </ArchitectNode>
                        );})
                })()}
                    </div>
                );
            })()}

            {/* Hidden Input, Modals */}
            <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                multiple
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onUpload(Array.from(e.target.files));
                    }
                }}
            />
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="card w-96 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-h3" style={{ fontSize: '18px' }}>{t('dashboard.createGroup')}</h2>
                        <input className="input w-full mb-4" placeholder={t('dashboard.groupName')} autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost" onClick={() => setShowCreateGroup(false)}>{t('app.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleCreateGroup}>{t('app.create')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Telemetry Modal */}
            {createPortal(
                <AnimatePresence>
                    {showTelemetry && (
                        <ObservabilityDashboard onClose={() => setShowTelemetry(false)} token={token || ''} />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Metadata Modal — Cinematic Redesign */}
            {createPortal(
                <AnimatePresence>
                    {viewingMeta && (() => {
                        const fileExt = (viewingMeta.originalName || viewingMeta.filename || '').split('.').pop()?.toLowerCase() || t('dashboard.fileTypeFallback');
                        const isCsv = fileExt === 'csv';
                        const displayName = viewingMeta.originalName || viewingMeta.filename;
                        const sizeKB = (viewingMeta.size / 1024).toFixed(1);
                        const sizeMB = (viewingMeta.size / 1024 / 1024).toFixed(2);
                        const fileAge = Math.floor((Date.now() - new Date(viewingMeta.createdAt).getTime()) / 86400000);
                        const accentColor = isCsv ? '#10b981' : '#6366f1';
                        const accentGlow = isCsv ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)';
                        return (
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-max flex items-center justify-center p-4"
                            style={{ backdropFilter: 'blur(20px) saturate(1.8)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 100%)' }}
                            onClick={() => setViewingMeta(null)}
                        >
                            <motion.div
                                key="modal-content"
                                initial={{ scale: 0.88, opacity: 0, y: 40, rotateX: 8 }}
                                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                                exit={{ scale: 0.92, opacity: 0, y: 30 }}
                                transition={{ type: "spring", duration: 0.7, bounce: 0.18 }}
                                className="relative w-full max-w-3xl rounded-3xl flex flex-col overflow-hidden"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    maxHeight: '88vh',
                                    background: 'linear-gradient(170deg, rgba(15,15,25,0.97) 0%, rgba(8,8,18,0.99) 100%)',
                                    border: '1px solid var(--border-default)',
                                    boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 80px -20px ${accentGlow}, 0 40px 100px -30px rgba(0,0,0,0.7)`,
                                }}
                            >
                                {/* Animated top border glow */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent 0%, ${accentColor} 30%, #c084fc 70%, transparent 100%)`, opacity: 0.8 }} />

                                {/* Hero Header */}
                                <div style={{ position: 'relative', padding: '32px 32px 24px', overflow: 'hidden' }}>
                                    {/* Gradient mesh background */}
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${accentGlow} 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(192,132,252,0.12) 0%, transparent 50%)`, pointerEvents: 'none' }} />
                                    
                                    {/* Close button */}
                                    <motion.button 
                                        whileHover={{ scale: 1.15, rotate: 90 }} 
                                        whileTap={{ scale: 0.9 }} 
                                        onClick={() => setViewingMeta(null)}
                                        style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10, transition: 'color 0.2s' }}
                                    >
                                        <X size={16} />
                                    </motion.button>

                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20 }}>
                                        {/* Animated file icon orb */}
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', delay: 0.15, stiffness: 200, damping: 15 }}
                                            style={{
                                                width: 64, height: 64, borderRadius: 20,
                                                background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
                                                border: `1px solid ${accentColor}30`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: accentColor,
                                                boxShadow: `0 0 30px -8px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                                                position: 'relative', overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(from 0deg, transparent, ${accentColor}15, transparent)`, animation: 'spin 4s linear infinite' }} />
                                            {isCsv ? <FileSpreadsheet size={28} /> : <FileText size={28} />}
                                        </motion.div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: accentColor, padding: '3px 10px', borderRadius: 6, background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}>
                                                        {fileExt.toUpperCase()} {t('dashboard.dataset')}
                                                    </span>
                                                    {viewingMeta.isProcessed && (
                                                        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#10b981', padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <ShieldCheck size={10} /> {t('dashboard.analyzedStatus')}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, letterSpacing: '-0.02em' }} title={displayName}>
                                                    {displayName}
                                                </h3>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                                                    {t('dashboard.ingested')} {fileAge === 0 ? t('dashboard.today') : fileAge === 1 ? t('dashboard.yesterday') : `${fileAge} ${t('dashboard.daysAgoSuffix')}`} · {t('common.id')}: {viewingMeta.id?.slice(0, 8)}…
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs — Pill Style */}
                                <div style={{ padding: '0 32px', display: 'flex', gap: 4, background: 'var(--bg-surface-hover)' }}>
                                    {(['properties', 'preview'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                padding: '12px 20px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                                                background: activeTab === tab ? 'var(--border-default)' : 'transparent',
                                                border: 'none', borderBottom: activeTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
                                                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                                                cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8,
                                                borderRadius: '8px 8px 0 0'
                                            }}
                                        >
                                            {tab === 'preview' && <Eye size={12} />}
                                            {tab === 'properties' ? t('dashboard.properties') : t('dashboard.dataPreview')}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

                                {/* Content */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                                    {activeTab === 'properties' ? (
                                        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: 28 }}>
                                            {/* Stats Grid — 4 columns */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                                                {[
                                                    { label: t('dashboard.volume'), value: sizeKB, unit: t('common.kb'), sub: `${sizeMB} ${t('common.mb')}`, color: '#10b981', icon: <Database size={16} /> },
                                                    { label: t('dashboard.format'), value: fileExt.toUpperCase(), unit: '', sub: t('dashboard.structured'), color: '#6366f1', icon: <Layers size={16} /> },
                                                    { label: t('dashboard.status'), value: viewingMeta.isProcessed ? t('dashboard.ready') : t('dashboard.pending'), unit: '', sub: viewingMeta.isProcessed ? t('dashboard.analysisCached') : t('dashboard.awaitingProcess'), color: viewingMeta.isProcessed ? '#10b981' : '#f59e0b', icon: viewingMeta.isProcessed ? <ShieldCheck size={16} /> : <Activity size={16} /> },
                                                    { label: t('dashboard.age'), value: fileAge === 0 ? '<1' : String(fileAge), unit: fileAge <= 1 ? t('dashboard.day') : t('dashboard.days'), sub: new Date(viewingMeta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#c084fc', icon: <Clock size={16} /> },
                                                ].map((stat, si) => (
                                                    <motion.div
                                                        key={stat.label}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 + si * 0.06 }}
                                                        style={{
                                                            padding: 20, borderRadius: 16,
                                                            background: 'var(--bg-surface)',
                                                            border: '1px solid var(--border-default)',
                                                            position: 'relative', overflow: 'hidden',
                                                            transition: 'all 0.3s',
                                                            cursor: 'default'
                                                        }}
                                                        className="hover:!border-[rgba(255,255,255,0.12)]"
                                                    >
                                                        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${stat.color}06`, pointerEvents: 'none' }} />
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                                            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)' }}>{stat.label}</span>
                                                            <div style={{ color: stat.color, opacity: 0.6 }}>{stat.icon}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                                            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</span>
                                                            {stat.unit && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{stat.unit}</span>}
                                                        </div>
                                                        <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontWeight: 600, marginTop: 6, display: 'block' }}>{stat.sub}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Metadata Rows */}
                                            <div style={{ borderRadius: 16, border: '1px solid var(--border-default)', overflow: 'hidden', background: 'var(--bg-surface-hover)' }}>
                                                {[
                                                    { label: t('dashboard.group'), value: getGroupName(viewingMeta.groupId), icon: <Folder size={14} /> },
                                                    { label: t('dashboard.created'), value: new Date(viewingMeta.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), icon: <Clock size={14} /> },
                                                    { label: t('dashboard.time'), value: new Date(viewingMeta.createdAt).toLocaleTimeString(), icon: <Activity size={14} /> },
                                                    { label: t('dashboard.nodeId'), value: viewingMeta.id || '—', icon: <Target size={14} /> },
                                                ].map((row, ri) => (
                                                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap: 14 }}>
                                                        <div style={{ color: 'var(--text-disabled)', flexShrink: 0 }}>{row.icon}</div>
                                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', minWidth: 80 }}>{row.label}</span>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: row.label === t('dashboard.nodeId') ? 'var(--font-mono, monospace)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 p-6 flex flex-col min-h-0">
                                            {loadingPreview ? (
                                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                                                    <div className="relative">
                                                        <Loader2 size={48} className="animate-spin" style={{ color: accentColor, opacity: 0.2 }} />
                                                        <Loader2 size={48} className="animate-spin absolute top-0 left-0" style={{ color: accentColor, animationDuration: '3s', animationDirection: 'reverse' }} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: accentColor }} className="animate-pulse block mb-1">{t('dashboard.analyzingSchema')}</span>
                                                        <span style={{ fontSize: 9, color: 'var(--text-disabled)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{t('dashboard.inferenceEngine')}: {t('dashboard.activeStatus')}</span>
                                                    </div>
                                                </div>
                                            ) : (previewData && previewData.rows && previewData.rows.length > 0) ? (
                                                <div className="flex-1 flex flex-col gap-4 min-h-0">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                                                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981' }}>{previewData.metadata.rowCount} {t('dashboard.rows')}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1' }}>{previewData.columns.length} {t('dashboard.fields')}</span>
                                                        </div>
                                                        <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-disabled)' }}>{previewData.metadata.format}</div>
                                                    </div>
                                                    <div style={{ flex: 1, overflow: 'hidden', borderRadius: 16, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                                            <table className="w-full text-left border-collapse min-w-max">
                                                                <thead className="sticky top-0 z-20">
                                                                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}>
                                                                        <th style={{ padding: 14, width: 48, fontSize: 9, fontWeight: 900, color: 'var(--text-disabled)', position: 'sticky', left: 0, zIndex: 30, background: 'var(--bg-card)', borderRight: '1px solid var(--border-default)' }}>#</th>
                                                                        {previewData.columns.map((col: any) => (
                                                                            <th key={col.name} style={{ padding: 14, borderRight: '1px solid var(--border-default)', minWidth: 120 }}>
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{col.name}</span>
                                                                                    <span style={{
                                                                                        fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                                                                                        padding: '2px 8px', borderRadius: 5, width: 'fit-content',
                                                                                        background: col.type.toLowerCase() === 'numeric' ? 'rgba(16,185,129,0.08)' : col.type.toLowerCase() === 'date' ? 'rgba(192,132,252,0.08)' : 'var(--bg-surface)',
                                                                                        color: col.type.toLowerCase() === 'numeric' ? '#10b981' : col.type.toLowerCase() === 'date' ? '#c084fc' : 'var(--text-muted)',
                                                                                        border: `1px solid ${col.type.toLowerCase() === 'numeric' ? 'rgba(16,185,129,0.15)' : col.type.toLowerCase() === 'date' ? 'rgba(192,132,252,0.15)' : 'var(--bg-surface-hover)'}`
                                                                                    }}>{col.type}</span>
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {previewData.rows.map((row: any, i: number) => (
                                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background 0.15s' }} className="hover:!bg-[rgba(255,255,255,0.02)]">
                                                                            <td style={{ padding: '12px 14px', width: 48, fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-disabled)', position: 'sticky', left: 0, zIndex: 10, background: 'rgba(10,10,20,0.8)', borderRight: '1px solid var(--border-default)' }}>{i + 1}</td>
                                                                            {previewData.columns.map((col: any) => {
                                                                                const val = row[col.name];
                                                                                const isNull = val === null || val === undefined || val === '';
                                                                                return (
                                                                                    <td key={col.name} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 500, borderRight: '1px solid var(--border-default)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                        {isNull ? (
                                                                                            <span style={{ color: 'var(--bg-elevated)', fontStyle: 'italic', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em' }}>NULL</span>
                                                                                        ) : (
                                                                                            <span style={{ color: col.type.toLowerCase() === 'numeric' ? '#10b981' : 'var(--text-secondary)', fontFamily: col.type.toLowerCase() === 'numeric' ? 'var(--font-mono, monospace)' : 'inherit', fontSize: col.type.toLowerCase() === 'numeric' ? 12 : 11 }}>{String(val)}</span>
                                                                                        )}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 0', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.06)', background: 'var(--bg-surface)' }}>
                                                    <Table size={32} style={{ opacity: 0.12, color: 'var(--text-primary)' }} />
                                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-disabled)' }}>{t('dashboard.noReadableSectors')}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer — Cinematic Launch Button */}
                                <div style={{ padding: '20px 28px 24px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.015, y: -1 }}
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => { onFileSelect(viewingMeta); setViewingMeta(null); }}
                                        style={{
                                            width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                                            background: `linear-gradient(135deg, ${accentColor} 0%, #c084fc 50%, ${accentColor} 100%)`,
                                            backgroundSize: '200% 100%',
                                            color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
                                            boxShadow: `0 8px 30px -8px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            position: 'relative', overflow: 'hidden',
                                            animation: 'shimmerBg 3s ease infinite',
                                            transition: 'box-shadow 0.3s'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)', transform: 'skewX(-20deg) translateX(-100%)', animation: 'sweepShine 3s ease-in-out infinite' }} />
                                        <BrainCircuit size={16} />
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {viewingMeta.isProcessed ? t('dashboard.openAnalysis') : t('dashboard.launchNeural')}
                                        </span>
                                        <Sparkles size={14} style={{ opacity: 0.7 }} />
                                    </motion.button>
                                </div>
                            </motion.div>
                            </motion.div>
                            );
                        })()}
                    </AnimatePresence>,
                    document.body
                )}

                {/* --- SYSTEM CLEANUP MODAL --- */}
                <AnimatePresence>
                    {showCleanupModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !isCleaningUp && setShowCleanupModal(false)}
                                style={{ position: 'absolute', inset: 0, background: 'var(--bg-card)', backdropFilter: 'blur(12px)' }} 
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                style={{
                                    width: '100%', maxWidth: '420px', background: 'var(--bg-app)', borderRadius: '24px',
                                    border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.6)', padding: '32px'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
                                    <div style={{ 
                                        width: 64, height: 64, borderRadius: '20px', background: 'rgba(239,68,68,0.1)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' 
                                    }}>
                                        <HardDrive size={32} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>{t('dashboard.robustSystemPurge')}</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            {t('dashboard.optimizeEnv')}
                                        </p>
                                    </div>

                                    <div style={{ width: '100%', background: 'var(--bento-glass)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Archive size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('dashboard.archivedFiles')}</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{cleanupSummary.archived}</span>
                                        </div>
                                        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('dashboard.stagnantUploads')}</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{cleanupSummary.stagnant}</span>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                                        <button 
                                            disabled={isCleaningUp}
                                            onClick={() => setShowCleanupModal(false)}
                                            style={{ 
                                                flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bento-glass)', 
                                                border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', 
                                                fontSize: '13px', fontWeight: 700, cursor: 'pointer' 
                                            }}
                                        >
                                            {t('app.cancel')}
                                        </button>
                                        <button 
                                            disabled={isCleaningUp}
                                            onClick={confirmSystemCleanup}
                                            style={{ 
                                                flex: 1.5, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                                                border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 8px 16px -4px rgba(239,68,68,0.3)'
                                            }}
                                        >
                                            {isCleaningUp ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            {isCleaningUp ? t('dashboard.purging') : t('dashboard.confirmPurge')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showTelemetry && (
                        <DiagnosticOverlay />
                    )}
                </AnimatePresence>
            </div>
        );
};

// --- TELEMETRY COMPONENTS ---

const TelemetryStat = ({ label, value, sub, icon, color, compact }: any) => (
    <div className={`bg-white/[0.03] border border-white/5 rounded-xl flex flex-col transition-colors overflow-hidden ${compact ? 'p-3 gap-1' : 'p-5 gap-4'}`}>
        <div className="flex items-start justify-between gap-4">
            <div className={`rounded-lg bg-white/[0.02] text-white/40 flex items-center justify-center shrink-0 ${compact ? 'p-1.5' : 'p-2.5'}`} style={{ color: `${color}80` }}>
                {icon}
            </div>
            <div className="text-right min-w-0">
                <span className={`block font-black text-white/30 uppercase tracking-[0.2em] truncate ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
                <span className={`font-black italic text-white block leading-tight ${compact ? 'text-base' : 'text-2xl'}`}>{value}</span>
            </div>
        </div>
        <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden mt-auto">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                className="h-full"
                style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
            />
        </div>
        {!compact && sub && <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate">{sub}</span>}
    </div>
);

// --- UTILITY COMPONENTS (Unchanged logic, updated styling) ---

const FileGrid = ({ files, selectedFiles, onToggleSelection, onFileSelect, onDeleteFile, onToggleFavorite, onArchiveFile, onViewMeta }: any) => {
    const { t } = useLanguage();
    if (files.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {files.map((f: any, idx: number) => {
                const isSelected = selectedFiles.has(f.id);
                const isCsv = (f.originalName || f.filename || '').endsWith('.csv');
                const accent = isCsv ? '#10b981' : '#6366f1';
                const accentGlow = isCsv ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)';
                const displayName = f.originalName || f.filename;
                return (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.04, duration: 0.35 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        style={{
                            position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                            background: 'linear-gradient(160deg, rgba(18,18,30,0.95) 0%, rgba(10,10,22,0.98) 100%)',
                            border: isSelected ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: isSelected
                                ? `0 0 0 1px ${accent}40, 0 8px 30px -10px ${accentGlow}`
                                : '0 4px 20px -8px rgba(0,0,0,0.3)',
                            transition: 'border-color 0.3s, box-shadow 0.3s',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* Animated top accent line */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`, opacity: isSelected ? 1 : 0.4, transition: 'opacity 0.3s' }} />

                        {/* Background gradient orb */}
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${accent}08`, pointerEvents: 'none', filter: 'blur(20px)' }} />

                        {/* Top row: Icon + Favorite */}
                        <div style={{ padding: '18px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative' }}>
                                <div onClick={e => { e.stopPropagation(); onToggleSelection(f.id); }} style={{ position: 'absolute', top: -4, left: -4, zIndex: 5, cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox" checked={isSelected} onChange={() => onToggleSelection(f.id)}
                                        style={{ width: 16, height: 16, accentColor: accent, opacity: isSelected ? 1 : 0, transition: 'opacity 0.2s' }}
                                    />
                                </div>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
                                    border: `1px solid ${accent}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: accent,
                                    boxShadow: `0 0 20px -6px ${accentGlow}`,
                                }}>
                                    {isCsv ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.85 }}
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(f); }}
                                style={{
                                    width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                                    background: f.isFavorite ? 'rgba(251,191,36,0.1)' : 'transparent',
                                    color: f.isFavorite ? '#fbbf24' : 'var(--text-disabled)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Star size={15} fill={f.isFavorite ? 'currentColor' : 'none'} />
                            </motion.button>
                        </div>

                        {/* Title + Status */}
                        <div style={{ padding: '14px 18px 0', flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, letterSpacing: '-0.01em' }} title={displayName}>{displayName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{(f.size / 1024).toFixed(1)} {t('common.kb')}</span>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                                    padding: '3px 8px', borderRadius: 6,
                                    background: f.isProcessed ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    color: f.isProcessed ? '#10b981' : '#f59e0b',
                                    border: `1px solid ${f.isProcessed ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
                                }}>
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: f.isProcessed ? '0 0 6px rgba(16,185,129,0.5)' : '0 0 6px rgba(245,158,11,0.5)' }} />
                                    {f.isProcessed ? t('dashboard.processed') : t('dashboard.pendingStatus')}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ padding: '14px 18px 18px', display: 'flex', gap: 8, marginTop: 4 }}>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}
                                style={{
                                    flex: 1, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                                    background: f.isProcessed
                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                        : `linear-gradient(135deg, ${accent}, #c084fc)`,
                                    color: 'var(--text-primary)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                                    boxShadow: f.isProcessed
                                        ? '0 4px 15px -5px rgba(16,185,129,0.4)'
                                        : `0 4px 15px -5px ${accentGlow}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', transform: 'skewX(-20deg) translateX(-100%)', animation: 'sweepShine 4s ease-in-out infinite' }} />
                                <BrainCircuit size={13} />
                                <span style={{ position: 'relative', zIndex: 1 }}>{f.isProcessed ? t('dashboard.open') : t('dashboard.process')}</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={(e) => { e.stopPropagation(); onArchiveFile(f.id); }}
                                style={{
                                    width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border-default)',
                                    background: f.isArchived ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface)', cursor: 'pointer',
                                    color: f.isArchived ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                title={f.isArchived ? "Restore dataset" : "Archive dataset"}
                            >
                                {f.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={(e) => { e.stopPropagation(); onViewMeta(f); }}
                                style={{
                                    width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border-default)',
                                    background: 'var(--bg-surface)', cursor: 'pointer',
                                    color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'border-color 0.2s, background 0.2s'
                                }}
                                title="Inspect"
                            >
                                <Eye size={15} />
                            </motion.button>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

const FileTable = ({ files, groups, selectedFiles, onToggleSelection, onToggleAll, onFileSelect, onToggleFavorite, onDeleteFile, onArchiveFile, onUpdateFileGroup, onUpdateFileWorkspace, onViewMeta }: any) => {
    const { workspaces } = useWorkspace();
    const { t } = useLanguage();
    const allSelected = files.length > 0 && files.every((f: any) => selectedFiles.has(f.id));
    return (
        <div style={{ padding: '0 4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderSpacing: '0 12px', borderCollapse: 'separate', textAlign: 'left', minWidth: '1000px' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '0 20px', width: '50px' }}>
                            <input
                                type="checkbox"
                                className="checkbox cursor-pointer"
                                checked={allSelected}
                                onChange={onToggleAll}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                            />
                        </th>
                        <th style={{ padding: '0 16px', width: '50px', color: 'var(--text-tertiary)' }}><Star size={14} /></th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.datasetNode')}</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.format')}</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.volume')}</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.timestamp')}</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.topologyGroup')}</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>{t('dashboard.sharedWorkspace')}</th>
                        <th style={{ padding: '0 24px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)', textAlign: 'right' }}>{t('dashboard.directives')}</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {files.map((f: any, i: number) => {
                            const isSelected = selectedFiles.has(f.id);
                            return (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: i * 0.03 }}
                                    key={f.id}
                                    className="group"
                                    onClick={() => onToggleSelection(f.id)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                                        boxShadow: isSelected
                                            ? '0 8px 30px -10px rgba(168, 85, 247, 0.4), inset 0 0 0 1px var(--primary)'
                                            : '0 4px 20px -5px rgba(0,0,0,0.05), inset 0 0 0 1px var(--border-subtle)',
                                        position: 'relative',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.005)';
                                            e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(0,0,0,0.1), inset 0 0 0 1px var(--border-default)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0,0,0,0.05), inset 0 0 0 1px var(--border-subtle)';
                                        }
                                    }}
                                >
                                    {/* Seamless border radius trick for table rows */}
                                    <td onClick={e => e.stopPropagation()} style={{ padding: '16px 20px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                                        <input
                                            type="checkbox"
                                            className="checkbox cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => onToggleSelection(f.id)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                        />
                                    </td>

                                    <td onClick={e => e.stopPropagation()} style={{ padding: '16px 16px', position: 'relative', zIndex: 20 }}>
                                        <div
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(f); }}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                background: f.isFavorite ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                color: f.isFavorite ? '#f59e0b' : 'var(--text-tertiary)',
                                            }}
                                            className="hover:bg-[var(--bg-surface)] hover:text-amber-400"
                                        >
                                            <Star size={16} fill={f.isFavorite ? 'currentColor' : 'none'} style={{ transition: 'all 0.3s', transform: f.isFavorite ? 'scale(1.1)' : 'scale(1)' }} />
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: (f.originalName || f.filename).endsWith('.csv') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: (f.originalName || f.filename).endsWith('.csv') ? '#10b981' : '#3b82f6',
                                                boxShadow: (f.originalName || f.filename).endsWith('.csv') ? 'inset 0 0 0 1px rgba(16, 185, 129, 0.2)' : 'inset 0 0 0 1px rgba(59, 130, 246, 0.2)'
                                            }}>
                                                {(f.originalName || f.filename).endsWith('.csv') ? <FileSpreadsheet size={18} /> : <Database size={18} />}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                                    {f.originalName || f.filename}
                                                </span>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content',
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800,
                                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    background: f.isProcessed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: f.isProcessed ? '#10b981' : '#f59e0b',
                                                    border: `1px solid ${f.isProcessed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                                }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                                                    {f.isProcessed ? t('dashboard.processed') : t('dashboard.awaitingProcessing')}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            background: (f.originalName || f.filename).endsWith('.csv') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: (f.originalName || f.filename).endsWith('.csv') ? '#10b981' : '#3b82f6',
                                            border: `1px solid ${(f.originalName || f.filename).endsWith('.csv') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                        }}>
                                            {(f.originalName || f.filename).endsWith('.csv') ? 'CSV' : (f.originalName || f.filename).endsWith('.json') ? 'JSON' : 'DATA'}
                                        </span>
                                    </td>

                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 700 }}>
                                                {(f.size / 1024).toFixed(1)} {t('common.kb')}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {(f.size / 1024 / 1024).toFixed(2)} {t('common.mb')}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                                {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500 }}>
                                                <Clock size={10} />
                                                {new Date(f.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 16px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                style={{
                                                    background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: '10px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    padding: '8px 32px 8px 12px',
                                                    outline: 'none',
                                                    appearance: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    width: '100%',
                                                    maxWidth: '160px'
                                                }}
                                                value={f.groupId || ''}
                                                onChange={(e) => onUpdateFileGroup(f.id, e.target.value || null)}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                                            >
                                                <option value="">{t('dashboard.ungrouped')}</option>
                                                {groups.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }}>
                                                <ArrowDownRight size={14} />
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 16px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '8px 12px', borderRadius: '10px',
                                                background: f.workspaceId ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)',
                                                border: `1px solid ${f.workspaceId ? 'rgba(99,102,241,0.2)' : 'var(--border-subtle)'}`,
                                                color: f.workspaceId ? 'var(--primary)' : 'var(--text-muted)',
                                                fontSize: '11px', fontWeight: 700, transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}>
                                                {f.workspaceId ? (
                                                    <>
                                                        <Globe size={12} />
                                                        <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {workspaces.find(w => w.id === f.workspaceId)?.name || t('dashboard.shared')}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={12} />
                                                        <span>{t('dashboard.private')}</span>
                                                    </>
                                                )}
                                                <ArrowDown size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                            </div>
                                            <select
                                                style={{
                                                    position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%'
                                                }}
                                                value={f.workspaceId || ''}
                                                onChange={(e) => onUpdateFileWorkspace?.(f.id, e.target.value || null)}
                                            >
                                                <option value="">{t('dashboard.private')} ({t('dashboard.meOnly')})</option>
                                                {workspaces?.map((w: any) => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', transition: 'all 0.2s' }} className={`group-hover:opacity-100 group-hover:pointer-events-auto ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => { e.stopPropagation(); onArchiveFile(f.id); }}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 12px',
                                                    borderRadius: '10px',
                                                    background: f.isArchived ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: f.isArchived ? 'var(--primary)' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    cursor: 'pointer'
                                                }}
                                                title={f.isArchived ? "Restore dataset" : "Archive dataset"}
                                            >
                                                {f.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />} {f.isArchived ? t('dashboard.restore') : t('dashboard.archive')}
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => { e.stopPropagation(); onViewMeta(f); }}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 12px',
                                                    borderRadius: '10px',
                                                    background: 'var(--bg-surface)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    cursor: 'pointer'
                                                }}
                                                title="View Topology Metadata"
                                            >
                                                <Eye size={14} style={{ color: 'var(--primary)' }} /> {t('dashboard.inspect')}
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 16px',
                                                    borderRadius: '10px',
                                                    background: f.isProcessed
                                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                        : 'linear-gradient(135deg, var(--primary) 0%, #c026d3 100%)',
                                                    border: 'none',
                                                    color: 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 800,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    boxShadow: f.isProcessed
                                                        ? '0 4px 15px -5px rgba(16, 185, 129, 0.5)'
                                                        : '0 4px 15px -5px rgba(192, 38, 211, 0.5)',
                                                    cursor: 'pointer'
                                                }}
                                                title={f.isProcessed ? 'Open cached analysis' : 'Process this dataset'}
                                            >
                                                <BrainCircuit size={14} /> {f.isProcessed ? t('dashboard.open') : t('dashboard.process')}
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => { e.stopPropagation(); onDeleteFile(f); }}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '10px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                title="Delete Dataset"
                                            >
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};
