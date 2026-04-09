import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import {
    LayoutList,
    LayoutGrid,
    Folder,
    Trash2,
    FileText,
    FileSpreadsheet,
    Star,
    CloudUpload,
    BrainCircuit,
    BarChart3,
    Zap,
    ShieldCheck,
    ShieldAlert,
    TrendingUp,
    AlertTriangle,
    Activity,
    Clock,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ArrowRight,
    X,
    Lightbulb,
    Database,
    Table,
    Eye,
    Loader2,
    Globe,
    Layers,
    Target,
    Cpu,
} from 'lucide-react';
import { calculatePulse } from './pulseEngine';
import { useAuth } from '../../contexts/AuthContext';
import { NeuralCanvas } from './NeuralCanvas';
import { AmbientStatusStrip, OrbitalMetric, IntelligenceTimeline, PerformanceGauge, QuickActionsBar, LiveClock } from './CommandHUD';
import { ProHeroBadge } from './ProBeastMode';
import { NeuralDropZone } from './NeuralDropZone';


// --- SUB-COMPONENTS for Dashboard ---

const MetricCard = ({ label, value, trend, trendLabel, color, icon: Icon }: any) => {
    const isPositive = trend?.includes('+') || trend?.includes('Up') || (!trend?.includes('-') && !trend?.includes('Down'));
    const colorVar = color === 'success' ? '#10b981' : color === 'danger' ? '#ef4444' : color === 'warning' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="card hover-glow p-5 flex flex-col justify-between" style={{ height: '140px', borderLeft: `4px solid ${colorVar}` }}>
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-secondary text-xs font-bold uppercase tracking-wider">{label}</span>
                    <h3 className="text-h2 font-black mt-2" style={{ fontSize: '28px' }}>{value}</h3>
                </div>
                <div className="p-2.5 rounded-lg flex items-center justify-center" style={{ background: `${colorVar}15`, color: colorVar, width: '40px', height: '40px' }}>
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold flex items-center ${isPositive ? 'text-success' : 'text-danger'}`} style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                    </span>
                    <span className="text-xs text-secondary opacity-70">{trendLabel}</span>
                </div>
            )}
        </div>
    );
};

const ExecutiveSummary = ({ metrics, fileCount, anomalyCount, onViewReport, userPlan, onUpgrade }: any) => {
    const isFree = userPlan === 'free' || !userPlan;

    return (
        <div className={`card relative overflow-hidden p-6 mb-8 border border-[var(--primary)]/30 ${!isFree ? 'pro-executive-summary' : ''}`} style={{ background: isFree ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' : undefined }}>
            {!isFree && (
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--primary)] blur-[80px]"
                    />
                </div>
            )}
            <div className="absolute -right-12 -top-12 pointer-events-none" style={{ opacity: 0.05 }}>
                <Sparkles size={200} />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-600 shadow-lg text-white">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-black text-primary">Nexus AI Executive Brief</h3>
                            <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/20">LIVE ANALYSIS</span>
                        </div>
                        <p className="text-secondary text-sm leading-relaxed max-w-2xl">
                            Across your <strong className="text-primary">{fileCount} active datasets</strong>,
                            {metrics.revenueGrowth === '—' || metrics.revenueGrowth === 'Waiting for Data' ? (
                                <span> the intelligence engine is currently <strong className="text-primary">mapping your business topology</strong>. </span>
                            ) : (
                                <span> current intelligence indicates a <strong className="text-success">{metrics.revenueGrowth} growth trajectory</strong>. </span>
                            )}
                            {anomalyCount > 0 ? (
                                <span> Attention is required for <strong className="text-danger">{anomalyCount} detected {anomalyCount === 1 ? 'anomaly' : 'anomalies'}</strong>. </span>
                            ) : (
                                <span> Data stability is optimal. </span>
                            )}
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button className="btn btn-sm btn-primary flex items-center gap-2" onClick={onViewReport}>
                                <FileText size={14} /> View Strategic Report
                            </button>
                        </div>
                    </div>
                </div>

                {isFree && (
                    <div className="lg:border-l lg:border-[var(--border-subtle)] lg:pl-8 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Upgrade Required</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] max-w-[200px] leading-tight font-medium">
                            Upgrade to Professional for advanced analytics and unlimited dataset storage.
                        </p>
                        <button
                            onClick={onUpgrade}
                            className="text-xs font-black uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            <span className="shimmer-text">Upgrade Plan</span> <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-[var(--primary)]" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const RecentActivityItem = ({ file, onClick }: any) => (
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
                    <span>Updated {new Date(file.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{(file.size / 1024).toFixed(0)} KB</span>
                </div>
            </div>
        </div>
        <button className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100">
            <ArrowUpRight size={16} />
        </button>
    </div>
);

const WatchlistItem = ({ insight, onRemove }: any) => (
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
                        <span className="text-xs text-tertiary">{insight.advice.length} recommendations</span>
                    </div>
                )}
            </div>
            <button
                onClick={onRemove}
                className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from watchlist"
            >
                <X size={14} />
            </button>
        </div>
    </div>
);
const QuotaGuard = ({ fileCount, storageUsed, maxStorage, userPlan, onUpgrade }: any) => {
    const isPro = userPlan === 'pro' || userPlan === 'enterprise';
    const fileLimit = 5;
    const isFileLimitReached = fileCount >= fileLimit && !isPro;
    const isStorageLimitReached = storageUsed >= maxStorage && !isPro;
    const isApproaching = (fileCount >= fileLimit - 1 || storageUsed >= maxStorage * 0.8) && !isPro;

    const filePercent = Math.min(100, Math.round((fileCount / fileLimit) * 100));
    const storagePercent = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

    if (isPro) return (
        <ProPowerBanner fileCount={fileCount} storageUsed={storageUsed} maxStorage={maxStorage} />
    );

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
                                {isFileLimitReached || isStorageLimitReached ? 'SYSTEM QUOTA EXHAUSTED' : 'STORAGE QUOTA'}
                            </span>
                        </div>

                        {isApproaching && !isFileLimitReached && !isStorageLimitReached && (
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}
                            >
                                <Zap size={12} fill="currentColor" />
                                <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Approaching Limit</span>
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
                                ? 'Storage Limit Reached'
                                : 'Upgrade to Professional Tier'}
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
                                ? 'System resources have hit their tier limits. Upgrade to Professional for unlimited throughput and advanced data mapping.'
                                : 'Unlock the full potential of your data. Upgrade to the Professional Tier to remove limits and enable advanced enterprise capabilities.'}
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
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>Active Datasets</span>
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
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>Neural Storage</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                                    <span style={{ color: isStorageLimitReached ? '#ef4444' : 'var(--text-primary)', fontSize: '18px' }}>{storageUsed}</span><span style={{ fontSize: '11px', marginLeft: '2px' }}>MB</span> <span style={{ opacity: 0.5 }}>/</span> {maxStorage}<span style={{ fontSize: '11px', marginLeft: '2px' }}>MB</span>
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
                            border: '1px solid rgba(255,255,255,0.1)',
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
                            color: '#fff',
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
                            Upgrade Now
                        </span>
                        <ArrowRight size={20} className="relative group-hover:translate-x-2 transition-transform duration-300" style={{ color: '#fff' }} />
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
    onCreateGroup,
    onDeleteGroup,
    onDeleteMultiple,
    onViewReport
}: any) => {
    const { refreshProfile, syncSubscription } = useAuth();
    const maxStorageMB = userPlan === 'pro' ? 10240 : userPlan === 'enterprise' ? 1000000 : 100;
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [showTelemetry, setShowTelemetry] = useState(false);
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
    const { token } = useAuth();
    const safeFiles = Array.isArray(files) ? files : [];

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

    const getGroupName = (groupId: string) => groups.find((g: any) => g.id === groupId)?.name || 'Uncategorized';

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

    // Real-time Telemetry Measurements (True Hardware & Network Metrics)
    useEffect(() => {
        const updateTelemetry = () => {
            if (!showTelemetry) return;

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

        const interval = setInterval(updateTelemetry, 2000);
        return () => clearInterval(interval);
    }, [showTelemetry, safeFiles]);

    // 4. Actual Network Latency (Ping and API Response profiling)
    useEffect(() => {
        if (!showTelemetry) return;
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
    }, [showTelemetry]);

    // Derived State
    const localMetrics = useMemo(() => calculatePulse(safeFiles), [safeFiles]);
    
    // Merge backend pulse with local file-based heuristics and LIVE TELEMETRY
    const metrics = useMemo(() => {
        // Calculate a live health score based on telemetry
        // CPU range: 0-100 (weighted 40%), Latency range: 0-200 (weighted 30%), Memory range: 1.0-4.0 (weighted 30%)
        const cpuScore = Math.max(0, 100 - telemetryData.cpu);
        const latencyScore = Math.max(0, 100 - (telemetryData.latency / 2));
        const memoryScore = Math.max(0, 100 - ((telemetryData.memory - 1) * 33));
        const liveHealth = Math.round((cpuScore * 0.4) + (latencyScore * 0.3) + (memoryScore * 0.3));

        if (!pulseData) return { ...localMetrics, systemHealth: liveHealth };
        return {
            ...localMetrics,
            revenue: pulseData.revenue || localMetrics.revenue,
            revenueGrowth: pulseData.revenueGrowth || localMetrics.revenueGrowth,
            anomalies: pulseData.anomalies ?? localMetrics.anomalies,
            projects: pulseData.projects || localMetrics.projects,
            systemHealth: liveHealth || pulseData.systemHealth || 100,
            telemetry: { ...pulseData.telemetry, ...telemetryData }
        };
    }, [localMetrics, pulseData, telemetryData]);
    const recentFiles = useMemo(() => [...safeFiles].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [safeFiles]);
    const starredFiles = useMemo(() => safeFiles.filter((f: any) => f.isFavorite), [safeFiles]);

    const filteredFiles = safeFiles.filter((f: any) => {
        return (f.originalName || f.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalStorage = (safeFiles.reduce((acc: number, f: any) => acc + Number(f.size), 0) / 1024 / 1024).toFixed(2);
    const fileCount = safeFiles.length;
    const totalStorageNum = Number(totalStorage);
    const isOverLimit = totalStorageNum >= maxStorageMB;

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
        if (confirm(`Delete ${selectedFiles.size} selected items?`)) {
            onDeleteMultiple(Array.from(selectedFiles));
            setSelectedFiles(new Set());
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

            {/* Neural Network Canvas Background */}
            <NeuralCanvas intensity={0.8} />
            <div className="scanline-overlay" />

            {/* --- AMBIENT STATUS STRIP --- */}
            <AmbientStatusStrip fileCount={fileCount} storageUsed={totalStorage} />

             {/* --- CINEMATIC HERO SECTION --- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="command-hero"
            >
                {/* Ambient orbs */}
                <div className="hero-ambient-orb orb-1" />
                <div className="hero-ambient-orb orb-2" />
                <div className="hero-ambient-orb orb-3" />

                {/* Animated mesh background */}
                <div className="hero-mesh-bg" />

                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="hero-greeting-sup"
                        >
                            <span className="sup-line" style={{ width: '40px' }} />
                            {(userPlan === 'pro' || userPlan === 'enterprise') && <ProHeroBadge />}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                        >
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)', opacity: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '1px', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Synthesis Active</span>
                        </motion.div>

                         <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="hero-greeting"
                            style={{ fontSize: '48px', letterSpacing: '-0.04em', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', position: 'relative' }}
                        >
                            <span style={{ opacity: 0.9 }}>Neural Command</span> <span style={{ color: 'var(--primary)', fontWeight: 200, margin: '0 4px' }}>/</span> <span className="name-highlight" style={{ 
                                background: 'linear-gradient(135deg, var(--primary, #3b82f6) 0%, #8b5cf6 100%)', 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                display: 'inline-block',
                                verticalAlign: 'bottom',
                                fontWeight: 950
                            }}>
                                {firstName || userEmail?.split('@')[0]}
                            </span>
                            <motion.div 
                                animate={{ height: ['10px', '24px', '10px'] }} 
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ width: '2px', background: 'var(--primary)', opacity: 0.8, display: 'inline-block', marginLeft: '12px' }} 
                            />
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="hero-subtitle"
                            style={{ fontSize: '15px', color: 'var(--text-primary)', opacity: 0.6, maxWidth: '650px', lineHeight: '1.7', fontWeight: 500 }}
                        >
                            {metrics.revenueGrowth === '—' || metrics.revenueGrowth === 'Waiting for Data' ? (
                                <>Core systems in <code style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>L0</code> standby. Currently <strong>analyzing {fileCount} neural {fileCount === 1 ? 'topology' : 'topologies'}</strong>. Latency is sub-ms. Intelligence systems are nominal.</>
                            ) : (
                                <>Processing <code style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{fileCount}</code> active streams. Intelligence indicates a <strong style={{ color: 'var(--text-primary)' }}>{metrics.revenueGrowth}</strong> optimization trajectory. <span style={{ color: '#10b981' }}>Stability: 99.8%</span> peak performance.</>
                            )}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="hero-stats-row"
                        >
                            <div className="hero-stat" style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))' }}>
                                <span className="hero-stat-label" style={{ color: 'var(--text-secondary, rgba(0,0,0,0.4))' }}>Datasets</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="hero-stat-value" style={{ color: 'var(--text-primary, #000)' }}>{fileCount}</span>
                                    {(userPlan === 'pro' || userPlan === 'enterprise') && (
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>∞</span>
                                    )}
                                </div>
                            </div>
                            <div className="hero-stat" style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))' }}>
                                <span className="hero-stat-label" style={{ color: 'var(--text-secondary, rgba(0,0,0,0.4))' }}>Storage</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="hero-stat-value" style={{ color: 'var(--text-primary, #000)' }}>{totalStorage}<span style={{ fontSize: 12, opacity: 0.5, marginLeft: 2 }}>MB</span></span>
                                    <div style={{ width: '40px', height: '4px', background: 'var(--border-subtle, rgba(0,0,0,0.05))', borderRadius: '2px', overflow: 'hidden' }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (totalStorageNum / maxStorageMB) * 100)}%` }}
                                            style={{ height: '100%', background: '#3b82f6' }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right side: Performance Gauge + Clock */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                    >
                        <PerformanceGauge 
                            value={metrics.systemHealth} 
                            label="System Health" 
                            onClick={() => setShowTelemetry(true)}
                        />
                        <LiveClock />
                    </motion.div>
                </div>

            </motion.div>

            {/* --- QUICK ACTIONS COMMAND PALETTE --- */}


            {/* --- ORBITAL METRIC ORBS --- */}




            {/* --- ACTIVE WORKSPACE (DATASET MATRIX) --- */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-12 relative"
                style={{ zIndex: 20 }}
            >
                {/* Advanced Workspace Header Card */}
                <div style={{
                    padding: '24px 32px',
                    borderRadius: '24px',
                    background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    marginBottom: '32px'
                }}>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">

                        {/* Title & Badge */}
                        <div className="flex items-center gap-4">
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                boxShadow: '0 10px 20px -5px rgba(168, 85, 247, 0.5), inset 0 2px 0 rgba(255,255,255,0.3)'
                            }}>
                                <CloudUpload size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Active Workspace</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                    <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>
                                        {fileCount} Data Topologies Loaded
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ultra-Premium Action Bar */}
                        <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">

                            {/* Purge Button (Contextual) */}
                            <AnimatePresence>
                                {selectedFiles.size > 0 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                        exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                        onClick={handleBulkDelete}
                                        style={{
                                            height: '48px',
                                            padding: '0 20px',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.5)',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Trash2 size={16} /> Purge ({selectedFiles.size})
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Search Glass Input */}
                            <div className="relative flex-1 xl:w-72 xl:flex-none">
                                <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search data nodes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        padding: '0 20px 0 44px',
                                        borderRadius: '14px',
                                        background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.background = 'color-mix(in srgb, var(--primary) 5%, transparent)';
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 4px var(--primary-glow)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.background = 'color-mix(in srgb, var(--text-primary) 5%, transparent)';
                                        e.target.style.borderColor = 'var(--border-subtle)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* View Toggle Segmented Control */}
                            <div style={{
                                display: 'flex',
                                padding: '4px',
                                background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                                borderRadius: '14px',
                                border: '1px solid var(--border-subtle)',
                                gap: '4px'
                            }}>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        height: '38px',
                                        padding: '0 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                                        color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        boxShadow: viewMode === 'list' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <LayoutList size={16} /> List
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        height: '38px',
                                        padding: '0 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                                        color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        boxShadow: viewMode === 'grid' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <LayoutGrid size={16} /> Grid
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ width: '1px', height: '32px', background: 'var(--border-subtle)', margin: '0 8px' }} className="hidden xl:block" />

                            {/* Action Buttons */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCreateGroup(true)}
                                style={{
                                    height: '48px',
                                    padding: '0 20px',
                                    borderRadius: '14px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Folder size={18} style={{ color: 'var(--primary)' }} /> Group
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                id="tour-upload-btn"
                                onClick={() => document.getElementById('file-input')?.click()}
                                disabled={isOverLimit}
                                style={{
                                    height: '48px',
                                    padding: '0 24px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    boxShadow: '0 10px 20px -5px rgba(168, 85, 247, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
                                    cursor: isOverLimit ? 'not-allowed' : 'pointer',
                                    opacity: isOverLimit ? 0.5 : 1
                                }}
                            >
                                <Database size={18} /> Upload Dataset
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* File Explorer Content */}
                <div className="flex-col gap-6">
                    {/* Groups */}
                    {groups.map((group: any) => {
                        const groupFiles = groupedFiles[group.id] || [];
                        if (groupFiles.length === 0 && searchTerm) return null;
                        return (
                            <div key={group.id} className="flex-col gap-3 mb-6">
                                <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-subtle)] border-dashed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-[var(--primary-subtle)] rounded-lg text-primary">
                                            <Folder size={14} />
                                        </div>
                                        <span className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">{group.name}</span>
                                        <div className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[10px] font-bold opacity-60">
                                            {groupFiles.length} Assets
                                        </div>
                                    </div>
                                    <button className="btn btn-icon btn-ghost btn-xs text-danger/50 hover:text-danger" onClick={() => confirm('Delete group?') && onDeleteGroup(group.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                {viewMode === 'list' ? (
                                    <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                        <FileTable
                                            files={groupFiles}
                                            groups={groups}
                                            selectedFiles={selectedFiles}
                                            onToggleSelection={toggleSelection}
                                            onToggleAll={() => toggleAll(groupFiles)}
                                            onFileSelect={onFileSelect}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteFile={onDeleteFile}
                                            onUpdateFileGroup={onUpdateFileGroup}
                                            onViewMeta={setViewingMeta}
                                        />
                                    </div>
                                ) : (
                                    <FileGrid
                                        files={groupFiles}
                                        selectedFiles={selectedFiles}
                                        onToggleSelection={toggleSelection}
                                        onFileSelect={onFileSelect}
                                        onDeleteFile={onDeleteFile}
                                        onToggleFavorite={onToggleFavorite}
                                        onViewMeta={setViewingMeta}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Ungrouped */}
                    {(groupedFiles['ungrouped'].length > 0 || groups.length === 0) && (
                        <div className="flex-col gap-3">
                            {groups.length > 0 && (
                                <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-subtle)] border-dashed">
                                    <div className="p-1.5 bg-[var(--bg-surface)] rounded-lg text-tertiary">
                                        <FileText size={14} />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-widest text-secondary">Uncategorized Intelligence</span>
                                </div>
                            )}
                            {viewMode === 'list' ? (
                                <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                    {groupedFiles['ungrouped'].length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center gap-4">
                                            <div className="p-4 bg-[var(--bg-surface)] rounded-full text-tertiary opacity-20">
                                                <CloudUpload size={48} />
                                            </div>
                                            <div>
                                                <p className="text-secondary font-bold">No data assets detected in this sector.</p>
                                                <p className="text-xs text-tertiary mt-1">Upload your first dataset to initiate neural mapping.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <FileTable
                                            files={groupedFiles['ungrouped']}
                                            groups={groups}
                                            selectedFiles={selectedFiles}
                                            onToggleSelection={toggleSelection}
                                            onToggleAll={() => toggleAll(groupedFiles['ungrouped'])}
                                            onFileSelect={onFileSelect}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteFile={onDeleteFile}
                                            onUpdateFileGroup={onUpdateFileGroup}
                                            onViewMeta={setViewingMeta}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-card)]/30 p-4 rounded-2xl border border-[var(--border-subtle)]">
                                    <FileGrid
                                        files={groupedFiles['ungrouped']}
                                        selectedFiles={selectedFiles}
                                        onToggleSelection={toggleSelection}
                                        onFileSelect={onFileSelect}
                                        onDeleteFile={onDeleteFile}
                                        onToggleFavorite={onToggleFavorite}
                                        onViewMeta={setViewingMeta}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.section>

            {/* --- INTELLIGENCE FEED --- */}
            <div className="command-center-grid">
                <IntelligenceTimeline files={safeFiles} />
            </div>

            {/* Intelligence Grid Removed */}

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
                        <h3 className="text-h3 mb-4">Create Dataset Group</h3>
                        <input className="input w-full mb-4" placeholder="Group Name" autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost" onClick={() => setShowCreateGroup(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateGroup}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Telemetry Modal */}
            {createPortal(
                <AnimatePresence>
                    {showTelemetry && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-max flex items-center justify-center p-4 backdrop-blur-xl bg-black/80"
                            onClick={() => setShowTelemetry(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: '260px',
                                    backgroundColor: 'var(--bg-card, #ffffff)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                                    borderRadius: '20px',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.02)',
                                    position: 'relative',
                                    zIndex: 1000,
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Modal Header - Ultra Compact */}
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Activity size={14} style={{ color: 'var(--primary, #3b82f6)' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-primary, #000)', textTransform: 'uppercase', letterSpacing: '0.15em', fontStyle: 'italic' }}>Neural Telemetry</span>
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button onClick={() => setShowTelemetry(false)} style={{ background: 'none', border: 'none', p: 0, cursor: 'pointer', color: 'var(--text-secondary, rgba(0,0,0,0.3))' }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Metrics Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            { label: 'Latency', value: `${telemetryData.latency}ms`, color: '#10b981' },
                                            { label: 'Ops/s', value: telemetryData.throughput, color: '#3b82f6' },
                                            { label: 'Memory', value: `${telemetryData.memory.toFixed(1)}G`, color: '#8b5cf6' },
                                            { label: 'Load', value: `${telemetryData.cpu}%`, color: '#f59e0b' }
                                        ].map(m => (
                                            <div key={m.label} style={{ background: 'var(--bg-main, rgba(0,0,0,0.02))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))', borderRadius: '12px', padding: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary, rgba(0,0,0,0.3))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{m.label}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary, #000)', fontStyle: 'italic' }}>{m.value}</span>
                                                <div style={{ height: '1.5px', width: '100%', background: 'rgba(0,0,0,0.05)', marginTop: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} style={{ height: '100%', background: m.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* System Log */}
                                    <div style={{ background: 'var(--bg-main, rgba(0,0,0,0.05))', border: '1px solid var(--border-subtle, rgba(0,0,0,0.03))', borderRadius: '10px', padding: '10px', height: '100px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9px', lineHeight: '1.5' }}>
                                        <div style={{ color: '#10b981', opacity: 0.8 }}>[SYS] Pulse synced</div>
                                        <div style={{ color: 'var(--text-secondary, rgba(0,0,0,0.4))' }}>[INF] Cluster active</div>
                                        <div style={{ color: '#10b981', opacity: 0.8 }}>[NEU] Sector-8 ready</div>
                                        <div style={{ color: 'var(--text-secondary, rgba(0,0,0,0.2))' }}>[SYS] Node-01 heartbeat...</div>
                                    </div>
                                </div>

                                <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.03))', display: 'flex', justifyContent: 'space-between', fontSize: '7px', fontWeight: 900, color: 'var(--text-secondary, rgba(0,0,0,0.2))', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                    <span>PRIMARY-NODE</span>
                                    <span>SSL: ACTIVE</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Metadata Modal — Cinematic Redesign */}
            {createPortal(
                <AnimatePresence>
                    {viewingMeta && (() => {
                        const fileExt = (viewingMeta.originalName || viewingMeta.filename || '').split('.').pop()?.toLowerCase() || 'dat';
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
                                    border: '1px solid rgba(255,255,255,0.06)',
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
                                        style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', zIndex: 10, transition: 'color 0.2s' }}
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
                                                        {fileExt.toUpperCase()} Dataset
                                                    </span>
                                                    {viewingMeta.isProcessed && (
                                                        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#10b981', padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <ShieldCheck size={10} /> Analyzed
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, letterSpacing: '-0.02em' }} title={displayName}>
                                                    {displayName}
                                                </h3>
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                                                    Ingested {fileAge === 0 ? 'today' : fileAge === 1 ? 'yesterday' : `${fileAge} days ago`} · ID: {viewingMeta.id?.slice(0, 8)}…
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs — Pill Style */}
                                <div style={{ padding: '0 32px', display: 'flex', gap: 4, background: 'rgba(255,255,255,0.015)' }}>
                                    {(['properties', 'preview'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                padding: '12px 20px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                                                background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                                                border: 'none', borderBottom: activeTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
                                                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.35)',
                                                cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8,
                                                borderRadius: '8px 8px 0 0'
                                            }}
                                        >
                                            {tab === 'preview' && <Eye size={12} />}
                                            {tab === 'properties' ? 'Properties' : 'Data Preview'}
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
                                                    { label: 'Volume', value: sizeKB, unit: 'KB', sub: `${sizeMB} MB`, color: '#10b981', icon: <Database size={16} /> },
                                                    { label: 'Format', value: fileExt.toUpperCase(), unit: '', sub: 'Structured', color: '#6366f1', icon: <Layers size={16} /> },
                                                    { label: 'Status', value: viewingMeta.isProcessed ? 'Ready' : 'Pending', unit: '', sub: viewingMeta.isProcessed ? 'Analysis cached' : 'Awaiting process', color: viewingMeta.isProcessed ? '#10b981' : '#f59e0b', icon: viewingMeta.isProcessed ? <ShieldCheck size={16} /> : <Activity size={16} /> },
                                                    { label: 'Age', value: fileAge === 0 ? '<1' : String(fileAge), unit: fileAge <= 1 ? 'day' : 'days', sub: new Date(viewingMeta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#c084fc', icon: <Clock size={16} /> },
                                                ].map((stat, si) => (
                                                    <motion.div
                                                        key={stat.label}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 + si * 0.06 }}
                                                        style={{
                                                            padding: 20, borderRadius: 16,
                                                            background: 'rgba(255,255,255,0.02)',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            position: 'relative', overflow: 'hidden',
                                                            transition: 'all 0.3s',
                                                            cursor: 'default'
                                                        }}
                                                        className="hover:!border-[rgba(255,255,255,0.12)]"
                                                    >
                                                        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${stat.color}06`, pointerEvents: 'none' }} />
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                                            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)' }}>{stat.label}</span>
                                                            <div style={{ color: stat.color, opacity: 0.6 }}>{stat.icon}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                                            <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</span>
                                                            {stat.unit && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{stat.unit}</span>}
                                                        </div>
                                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginTop: 6, display: 'block' }}>{stat.sub}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Metadata Rows */}
                                            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', background: 'rgba(255,255,255,0.015)' }}>
                                                {[
                                                    { label: 'Group', value: getGroupName(viewingMeta.groupId), icon: <Folder size={14} /> },
                                                    { label: 'Created', value: new Date(viewingMeta.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), icon: <Clock size={14} /> },
                                                    { label: 'Time', value: new Date(viewingMeta.createdAt).toLocaleTimeString(), icon: <Activity size={14} /> },
                                                    { label: 'Node ID', value: viewingMeta.id || '—', icon: <Target size={14} /> },
                                                ].map((row, ri) => (
                                                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap: 14 }}>
                                                        <div style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{row.icon}</div>
                                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', minWidth: 80 }}>{row.label}</span>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: row.label === 'Node ID' ? 'var(--font-mono, monospace)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
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
                                                        <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: accentColor }} className="animate-pulse block mb-1">Analyzing Schema</span>
                                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Inference engine: ACTIVE</span>
                                                    </div>
                                                </div>
                                            ) : (previewData && previewData.rows && previewData.rows.length > 0) ? (
                                                <div className="flex-1 flex flex-col gap-4 min-h-0">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                                                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981' }}>{previewData.metadata.rowCount} Rows</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1' }}>{previewData.columns.length} Fields</span>
                                                        </div>
                                                        <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>{previewData.metadata.format}</div>
                                                    </div>
                                                    <div style={{ flex: 1, overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                                            <table className="w-full text-left border-collapse min-w-max">
                                                                <thead className="sticky top-0 z-20">
                                                                    <tr style={{ background: 'rgba(15,15,25,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                                        <th style={{ padding: 14, width: 48, fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)', position: 'sticky', left: 0, zIndex: 30, background: 'rgba(15,15,25,0.95)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>#</th>
                                                                        {previewData.columns.map((col: any) => (
                                                                            <th key={col.name} style={{ padding: 14, borderRight: '1px solid rgba(255,255,255,0.03)', minWidth: 120 }}>
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>{col.name}</span>
                                                                                    <span style={{
                                                                                        fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                                                                                        padding: '2px 8px', borderRadius: 5, width: 'fit-content',
                                                                                        background: col.type.toLowerCase() === 'numeric' ? 'rgba(16,185,129,0.08)' : col.type.toLowerCase() === 'date' ? 'rgba(192,132,252,0.08)' : 'rgba(255,255,255,0.03)',
                                                                                        color: col.type.toLowerCase() === 'numeric' ? '#10b981' : col.type.toLowerCase() === 'date' ? '#c084fc' : 'rgba(255,255,255,0.3)',
                                                                                        border: `1px solid ${col.type.toLowerCase() === 'numeric' ? 'rgba(16,185,129,0.15)' : col.type.toLowerCase() === 'date' ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.05)'}`
                                                                                    }}>{col.type}</span>
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {previewData.rows.map((row: any, i: number) => (
                                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'background 0.15s' }} className="hover:!bg-[rgba(255,255,255,0.02)]">
                                                                            <td style={{ padding: '12px 14px', width: 48, fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255,255,255,0.15)', position: 'sticky', left: 0, zIndex: 10, background: 'rgba(10,10,20,0.8)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>{i + 1}</td>
                                                                            {previewData.columns.map((col: any) => {
                                                                                const val = row[col.name];
                                                                                const isNull = val === null || val === undefined || val === '';
                                                                                return (
                                                                                    <td key={col.name} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 500, borderRight: '1px solid rgba(255,255,255,0.02)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                        {isNull ? (
                                                                                            <span style={{ color: 'rgba(255,255,255,0.1)', fontStyle: 'italic', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em' }}>NULL</span>
                                                                                        ) : (
                                                                                            <span style={{ color: col.type.toLowerCase() === 'numeric' ? '#10b981' : 'rgba(255,255,255,0.7)', fontFamily: col.type.toLowerCase() === 'numeric' ? 'var(--font-mono, monospace)' : 'inherit', fontSize: col.type.toLowerCase() === 'numeric' ? 12 : 11 }}>{String(val)}</span>
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
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 0', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                                                    <Table size={32} style={{ opacity: 0.12, color: '#fff' }} />
                                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>No readable sectors found</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer — Cinematic Launch Button */}
                                <div style={{ padding: '20px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
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
                                            {viewingMeta.isProcessed ? 'Open Analysis' : 'Launch Neural Analysis'}
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

const FileGrid = ({ files, selectedFiles, onToggleSelection, onFileSelect, onDeleteFile, onToggleFavorite, onViewMeta }: any) => {
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
                                    color: f.isFavorite ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Star size={15} fill={f.isFavorite ? 'currentColor' : 'none'} />
                            </motion.button>
                        </div>

                        {/* Title + Status */}
                        <div style={{ padding: '14px 18px 0', flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, letterSpacing: '-0.01em' }} title={displayName}>{displayName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                                    padding: '3px 8px', borderRadius: 6,
                                    background: f.isProcessed ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    color: f.isProcessed ? '#10b981' : '#f59e0b',
                                    border: `1px solid ${f.isProcessed ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
                                }}>
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: f.isProcessed ? '0 0 6px rgba(16,185,129,0.5)' : '0 0 6px rgba(245,158,11,0.5)' }} />
                                    {f.isProcessed ? 'Processed' : 'Pending'}
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
                                    color: '#fff', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                                    boxShadow: f.isProcessed
                                        ? '0 4px 15px -5px rgba(16,185,129,0.4)'
                                        : `0 4px 15px -5px ${accentGlow}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', transform: 'skewX(-20deg) translateX(-100%)', animation: 'sweepShine 4s ease-in-out infinite' }} />
                                <BrainCircuit size={13} />
                                <span style={{ position: 'relative', zIndex: 1 }}>{f.isProcessed ? 'Open' : 'Process'}</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={(e) => { e.stopPropagation(); onViewMeta(f); }}
                                style={{
                                    width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
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

const FileTable = ({ files, groups, selectedFiles, onToggleSelection, onToggleAll, onFileSelect, onToggleFavorite, onDeleteFile, onUpdateFileGroup, onViewMeta }: any) => {
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
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>Dataset Node</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>Format</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>Volume</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>Timestamp</th>
                        <th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>Topology Group</th>
                        <th style={{ padding: '0 24px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)', textAlign: 'right' }}>Directives</th>
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
                                                    {f.isProcessed ? 'Processed' : 'Awaiting Processing'}
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
                                                {(f.size / 1024).toFixed(1)} KB
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {(f.size / 1024 / 1024).toFixed(2)} MB
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
                                                <option value="">Ungrouped</option>
                                                {groups.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }}>
                                                <ArrowDownRight size={14} />
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', transition: 'all 0.2s' }} className={`group-hover:opacity-100 group-hover:pointer-events-auto ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
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
                                                <Eye size={14} style={{ color: 'var(--primary)' }} /> Inspect
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
                                                    color: '#fff',
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
                                                <BrainCircuit size={14} /> {f.isProcessed ? 'Open' : 'Process'}
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
