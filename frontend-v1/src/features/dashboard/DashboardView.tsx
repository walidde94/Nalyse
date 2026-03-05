import { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { calculatePulse } from './pulseEngine';
import { useAuth } from '../../contexts/AuthContext';
import { NeuralCanvas } from './NeuralCanvas';
import { AmbientStatusStrip, OrbitalMetric, IntelligenceTimeline, DataHealthMatrix } from './CommandHUD';
import { MagneticTilt } from '../../components/ui/MagneticTilt';

// --- SUB-COMPONENTS for Dashboard ---

const MetricCard = ({ label, value, trend, trendLabel, color, icon: Icon }: any) => {
    const isPositive = trend?.includes('+') || trend?.includes('Up') || (!trend?.includes('-') && !trend?.includes('Down'));
    const colorVar = color === 'success' ? '#10b981' : color === 'danger' ? '#ef4444' : color === 'warning' ? '#f59e0b' : '#3b82f6';

    return (
        <MagneticTilt className="h-full w-full" maxTilt={8} scale={1.03}>
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
        </MagneticTilt>
    );
};

const ExecutiveSummary = ({ metrics, fileCount, anomalyCount, onViewReport, userPlan, onUpgrade }: any) => {
    const isFree = userPlan === 'free' || !userPlan;

    return (
        <MagneticTilt className="w-full mb-8 z-10" maxTilt={3} scale={1.01}>
            <div className={`card relative overflow-hidden p-6 border border-[var(--primary)]/30 ${!isFree ? 'pro-executive-summary' : ''}`} style={{ background: isFree ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' : undefined }}>
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
                        <div className="lg:border-l lg:border-white/10 lg:pl-8 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Unlock Advanced Causality</span>
                            </div>
                            <p className="text-[11px] text-white/60 max-w-[200px] leading-tight font-medium">
                                Manifest Neural Pro for detailed cross-departmental reasoning and unlimited datasets.
                            </p>
                            <button
                                onClick={onUpgrade}
                                className="text-xs font-black uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2 group"
                            >
                                <span className="shimmer-text">Get Pro Access</span> <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-[var(--primary)]" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MagneticTilt>
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
                <h4 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{file.filename}</h4>
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
                                {isFileLimitReached || isStorageLimitReached ? 'SYSTEM QUOTA EXHAUSTED' : 'NEURAL CAPACITY PROTOCOL'}
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
                                ? 'Intelligence Expansion Required'
                                : 'Manifest Greater Intelligence'}
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
                                ? 'System resources have hit their hard limits. Upgrade to Nexus Tier for unlimited throughput and cross-dimensional data mapping.'
                                : 'Break the boundaries of standard processing. Manifest Neural Pro to unlock unlimited data pipelines and real-time structural reasoning.'}
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
                            Manifest Neural Pro
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

    const { user, refreshProfile, syncSubscription } = useAuth();

    // Extracted from auth instead of props
    const userEmail = user?.email || '';
    const firstName = user?.firstName || '';
    const userPlan = (user as any)?.organization?.plan || 'free';

    const maxStorageMB = userPlan === 'pro' ? 10240 : userPlan === 'enterprise' ? 1000000 : 100;
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [pinnedInsights, setPinnedInsights] = useState<any[]>([]);

    // Metadata & Preview State
    const [viewingMeta, setViewingMeta] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [activeTab, setActiveTab] = useState<'properties' | 'preview'>('properties');
    const { token } = useAuth();

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

    const safeFiles = Array.isArray(files) ? files : [];

    // Derived State
    const metrics = useMemo(() => calculatePulse(safeFiles), [safeFiles]);
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
        <div className="flex-col gap-6 fade-in main-content-mobile" style={{
            padding: 'clamp(16px, 5vw, 32px)',
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            fontFamily: 'Dubai, sans-serif',
            position: 'relative'
        }}>
            {/* Neural Network Canvas Background */}
            <NeuralCanvas intensity={0.8} />
            <div className="scanline-overlay" />

            {/* --- AMBIENT STATUS STRIP --- */}
            <AmbientStatusStrip fileCount={fileCount} storageUsed={totalStorage} />

            <QuotaGuard
                fileCount={fileCount}
                storageUsed={totalStorageNum}
                maxStorage={maxStorageMB}
                userPlan={userPlan}
                onUpgrade={onUpgrade}
            />

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

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="hero-greeting-sup"
                    >
                        <span className="sup-line" />
                        COMMAND CENTER
                        <span className="sup-line" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        className="hero-greeting"
                    >
                        Welcome back, <span className="name-highlight">{firstName || userEmail?.split('@')[0]}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="hero-subtitle"
                    >
                        {metrics.revenueGrowth === '—' || metrics.revenueGrowth === 'Waiting for Data' ? (
                            <>Your intelligence engine is actively <strong>mapping {fileCount} data topologies</strong>. All systems nominal.</>
                        ) : (
                            <>Across <strong>{fileCount} active datasets</strong>, intelligence indicates a <strong>{metrics.revenueGrowth} growth trajectory</strong>. {metrics.anomalies > 0 ? `${metrics.anomalies} anomalies require attention.` : 'Data stability is optimal.'}</>
                        )}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="hero-stats-row"
                    >
                        {(userPlan === 'pro' || userPlan === 'enterprise') ? (
                            <>
                                <div className="hero-stat">
                                    <span className="hero-stat-label">Datasets</span>
                                    <span className="hero-stat-value">{fileCount}</span>
                                </div>
                                <div className="hero-stat">
                                    <span className="hero-stat-label">Storage</span>
                                    <span className="hero-stat-value">{totalStorage}<span style={{ fontSize: 12, opacity: 0.5, marginLeft: 2 }}>MB</span></span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="hero-stat">
                                    <span className="hero-stat-label">Processing Load</span>
                                    <span className="hero-stat-value" style={{ fontSize: '16px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Optimal
                                    </span>
                                </div>
                                <div className="hero-stat">
                                    <span className="hero-stat-label">Engine Sync</span>
                                    <span className="hero-stat-value" style={{ fontSize: '16px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDuration: '1.5s' }} />
                                        Active
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="hero-stat">
                            <span className="hero-stat-label">Anomalies</span>
                            <span className="hero-stat-value" style={{ color: metrics.anomalies > 0 ? '#ef4444' : '#10b981' }}>{metrics.anomalies}</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-label">Model Health</span>
                            <span className="hero-stat-value" style={{ fontSize: 14 }}>{metrics.modelHealth}</span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="hero-stat"
                            style={{ cursor: 'pointer', borderColor: 'rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)' }}
                            onClick={onViewReport}
                        >
                            <span className="hero-stat-label" style={{ color: '#3b82f6' }}>Strategic Report</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: '#3b82f6' }}>
                                View <ArrowRight size={12} />
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* --- ORBITAL METRIC ORBS --- */}
            <div className="orb-grid">
                <OrbitalMetric
                    label="Strategic Revenue"
                    value={metrics.revenue}
                    subValue={metrics.revenueGrowth !== '—' ? metrics.revenueGrowth : undefined}
                    color="#10b981"
                    icon={<TrendingUp size={20} />}
                    trend={metrics.revenueGrowth !== '—' && metrics.revenueGrowth !== 'Waiting for Data' ? metrics.revenueGrowth : undefined}
                    index={0}
                />
                <OrbitalMetric
                    label="Neural Drift"
                    value={String(metrics.anomalies)}
                    subValue={metrics.anomalies > 0 ? 'Variance detected' : 'All systems clear'}
                    color={metrics.anomalies > 0 ? '#ef4444' : '#3b82f6'}
                    icon={<Activity size={20} />}
                    index={1}
                />
                <OrbitalMetric
                    label="Active Units"
                    value={String(metrics.projects)}
                    subValue="Strategy"
                    color="#8b5cf6"
                    icon={<BrainCircuit size={20} />}
                    index={2}
                />
                <OrbitalMetric
                    label="Efficiency"
                    value={metrics.efficiencyTrend}
                    subValue="Processing throughput"
                    color="#06b6d4"
                    icon={<Zap size={20} />}
                    trend={metrics.efficiencyTrend !== '—' ? metrics.efficiencyTrend : undefined}
                    index={3}
                />
            </div>

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

            {/* --- COMMAND CENTER INTELLIGENCE GRID --- */}
            <div className="command-center-grid">
                <IntelligenceTimeline files={safeFiles} />
                <DataHealthMatrix files={safeFiles} />
            </div>

            {/* --- COMMAND CENTER: WATCHLIST & INTELLIGENCE --- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >

                {/* LEFT COLUMN: STRATEGIC WATCHLIST (8 cols) */}
                <div className="lg:col-span-8">
                    <div className="hud-panel">
                        {/* Panel Header */}
                        <div className="hud-panel-header">
                            <div className="hud-panel-title-group">
                                <div className="hud-panel-icon" style={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                                    color: '#8b5cf6',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                }}>
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h3 className="hud-panel-title">Strategic Watchlist</h3>
                                    <span className="hud-panel-subtitle">Pinned intelligence from analysis</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="hud-badge" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                                    {pinnedInsights.length} Pinned
                                </span>
                                {pinnedInsights.length > 0 && (
                                    <button
                                        className="hud-action-btn"
                                        onClick={() => {
                                            if (confirm('Clear neural watchlist?')) {
                                                localStorage.setItem('strategic_watchlist', '[]');
                                                setPinnedInsights([]);
                                            }
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        Purge
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Panel Body */}
                        <div className="hud-panel-body">
                            {pinnedInsights.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pinnedInsights.map((insight) => (
                                        <WatchlistItem
                                            key={insight.id}
                                            insight={insight}
                                            onRemove={() => {
                                                const updated = pinnedInsights.filter(i => i.id !== insight.id);
                                                localStorage.setItem('strategic_watchlist', JSON.stringify(updated));
                                                setPinnedInsights(updated);
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="hud-empty-state">
                                    <div className="hud-empty-icon">
                                        <Sparkles size={28} />
                                    </div>
                                    <p className="hud-empty-title">Neural Watchlist Latent</p>
                                    <p className="hud-empty-desc">Pin critical insights from the Analysis Studio to monitor them here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: VAULTED ARTIFACTS & PULSE ACTIONS (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Vaulted Artifacts */}
                    <div className="hud-panel">
                        <div className="hud-panel-header">
                            <div className="hud-panel-title-group">
                                <div className="hud-panel-icon" style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(251, 191, 36, 0.2)'
                                }}>
                                    <Star size={16} />
                                </div>
                                <div>
                                    <h3 className="hud-panel-title">Vaulted Artifacts</h3>
                                    <span className="hud-panel-subtitle">Starred datasets</span>
                                </div>
                            </div>
                            <span className="hud-badge" style={{ background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.15)' }}>
                                {starredFiles.length}
                            </span>
                        </div>
                        <div className="hud-panel-body">
                            {starredFiles.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {starredFiles.map((f: any) => (
                                        <div
                                            key={f.id}
                                            className="hud-artifact-row"
                                            onClick={() => onFileSelect(f)}
                                        >
                                            <div className="hud-artifact-icon">
                                                <Star size={14} fill="currentColor" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="hud-artifact-name">{f.originalName || f.filename}</div>
                                                <div className="hud-artifact-status">Ready for Discovery</div>
                                            </div>
                                            <div className="hud-artifact-arrow">
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="hud-empty-state" style={{ minHeight: 100 }}>
                                    <div className="hud-empty-icon" style={{ width: 36, height: 36 }}>
                                        <Star size={18} />
                                    </div>
                                    <p className="hud-empty-title">No Vaulted Assets</p>
                                    <p className="hud-empty-desc">Star files to quick-access them here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pulse Actions */}
                    <div className="hud-panel">
                        <div className="hud-panel-header">
                            <div className="hud-panel-title-group">
                                <div className="hud-panel-icon" style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <h3 className="hud-panel-title">Pulse Actions</h3>
                                    <span className="hud-panel-subtitle">Quick operations</span>
                                </div>
                            </div>
                        </div>
                        <div className="hud-panel-body" style={{ padding: '12px 20px 20px' }}>
                            <div className="flex flex-col gap-3">
                                <div className="hud-action-card" style={{ '--action-color': '#3b82f6' } as React.CSSProperties}>
                                    <div className="hud-action-card-accent" />
                                    <div className="hud-action-card-icon">
                                        <BarChart3 size={16} />
                                    </div>
                                    <div>
                                        <h4 className="hud-action-card-title">Schedule Neural Report</h4>
                                        <p className="hud-action-card-desc">Automate cross-cluster intelligence distribution for active streams.</p>
                                    </div>
                                    <ArrowRight size={14} className="hud-action-card-arrow" />
                                </div>
                                <div className="hud-action-card" style={{ '--action-color': '#f59e0b' } as React.CSSProperties}>
                                    <div className="hud-action-card-accent" />
                                    <div className="hud-action-card-icon">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <h4 className="hud-action-card-title">Drift Audit Required</h4>
                                        <p className="hud-action-card-desc">{metrics.anomalies} anomalies detected in logistics variance. Structural review suggested.</p>
                                    </div>
                                    <ArrowRight size={14} className="hud-action-card-arrow" />
                                </div>
                                <div className="hud-action-card" style={{ '--action-color': '#10b981' } as React.CSSProperties}>
                                    <div className="hud-action-card-accent" />
                                    <div className="hud-action-card-icon">
                                        <Target size={16} />
                                    </div>
                                    <div>
                                        <h4 className="hud-action-card-title">Deploy Strategy</h4>
                                        <p className="hud-action-card-desc">Push insights to live systems and activate decision agents.</p>
                                    </div>
                                    <ArrowRight size={14} className="hud-action-card-arrow" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

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

            {/* Metadata Modal */}
            {createPortal(
                <AnimatePresence>
                    {viewingMeta && (
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-max flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
                            onClick={() => setViewingMeta(null)}
                        >
                            {/* Centered Modal Container */}
                            <motion.div
                                key="modal-content"
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                className="relative w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    maxHeight: '90vh',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-default)',
                                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.5)'
                                }}
                            >
                                {/* Header */}
                                <div className="px-6 py-5 border-b flex items-start gap-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                                    <div className={`p-3 rounded-xl ${viewingMeta.filename.endsWith('.csv') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                        {viewingMeta.filename.endsWith('.csv') ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-lg font-black text-[var(--text-primary)] truncate leading-tight" title={viewingMeta.filename}>{viewingMeta.filename}</h3>
                                        <span className="text-xs text-[var(--text-secondary)] font-medium opacity-70">Dataset Properties</span>
                                    </div>
                                    <button onClick={() => setViewingMeta(null)} className="btn btn-icon btn-ghost btn-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b px-6 gap-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                                    <button
                                        onClick={() => setActiveTab('properties')}
                                        className={`py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'properties' ? 'border-[var(--primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100'}`}
                                    >
                                        Properties
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className={`py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'border-[var(--primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100'}`}
                                    >
                                        <Eye size={14} /> Data Preview
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    {activeTab === 'properties' ? (
                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-5 rounded-xl bg-[var(--bg-card)]/30 border border-[var(--border-subtle)] hover:border-emerald-500/30 transition-colors group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors">File Size</span>
                                                        <Database size={14} className="text-[var(--text-tertiary)]" />
                                                    </div>
                                                    <div className="text-2xl font-black font-mono text-[var(--text-primary)]">{(viewingMeta.size / 1024).toFixed(1)} <span className="text-sm text-[var(--text-secondary)] font-sans font-medium">KB</span></div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 rounded-xl bg-[var(--bg-card)]/30 border border-[var(--border-subtle)] hover:border-primary/30 transition-colors group">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-[var(--text-secondary)] mb-2 block group-hover:text-primary transition-colors">Format</span>
                                                        <div className="text-lg font-bold uppercase text-[var(--text-primary)]">{viewingMeta.filename.split('.').pop()}</div>
                                                    </div>
                                                    <div className="p-5 rounded-xl bg-[var(--bg-card)]/30 border border-[var(--border-subtle)] hover:border-purple-500/30 transition-colors group">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-[var(--text-secondary)] mb-2 block group-hover:text-purple-500 transition-colors">Group</span>
                                                        <div className="text-sm font-bold truncate flex items-center gap-2 text-[var(--text-primary)]">
                                                            <Folder size={14} className="text-[var(--text-tertiary)]" />
                                                            {getGroupName(viewingMeta.groupId)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-xl bg-[var(--bg-card)]/30 border border-[var(--border-subtle)] hover:border-amber-500/30 transition-colors group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors">Created At</span>
                                                        <Clock size={14} className="text-[var(--text-tertiary)]" />
                                                    </div>
                                                    <div className="text-sm font-bold text-[var(--text-primary)]">{new Date(viewingMeta.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                    <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono opacity-60">{new Date(viewingMeta.createdAt).toLocaleTimeString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 p-6 flex flex-col min-h-0">
                                            {loadingPreview ? (
                                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
                                                    <div className="relative">
                                                        <Loader2 size={48} className="animate-spin text-primary opacity-20" />
                                                        <Loader2 size={48} className="animate-spin text-primary absolute top-0 left-0" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)] animate-pulse mb-1 block">Analyzing Schema</span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inference engine: ACTIVE</span>
                                                    </div>
                                                </div>
                                            ) : (previewData && previewData.rows && previewData.rows.length > 0) ? (
                                                <div className="flex-1 flex flex-col gap-5 min-h-0">
                                                    {/* Preview Metadata Bar - Premium Style */}
                                                    <div className="flex items-center gap-3 p-1.5 bg-[var(--bg-main)]/40 rounded-2xl border border-[var(--border-subtle)] backdrop-blur-sm">
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-sm">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-primary)]">{previewData.metadata.rowCount} Rows <span className="text-[var(--text-tertiary)] font-bold">Loaded</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-sm">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-primary)]">{previewData.columns.length} Fields <span className="text-[var(--text-tertiary)] font-bold">Inferred</span></span>
                                                        </div>
                                                        <div className="ml-auto pr-4 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] opacity-30"></div>
                                                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">{previewData.metadata.format}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-main)]/30 backdrop-blur-sm flex flex-col min-h-0">
                                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                                            <table className="w-full text-left border-collapse min-w-max">
                                                                <thead className="sticky top-0 z-20">
                                                                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] shadow-lg shadow-black/20">
                                                                        <th className="p-4 w-12 text-[9px] font-black text-[var(--text-tertiary)] bg-[var(--bg-secondary)] sticky left-0 z-30 border-r border-[var(--border-default)]">#</th>
                                                                        {previewData.columns.map((col: any) => (
                                                                            <th key={col.name} className="p-4 border-r border-[var(--border-default)]/50 last:border-0 group min-w-[120px]">
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <span className="text-[10px] font-black uppercase tracking-[0.05em] text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{col.name}</span>
                                                                                    <div className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md w-fit border ${col.type.toLowerCase() === 'numeric' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                                        col.type.toLowerCase() === 'date' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                                                            'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-default)]'
                                                                                        }`}>
                                                                                        {col.type}
                                                                                    </div>
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-[var(--border-subtle)]/30">
                                                                    {previewData.rows.map((row: any, i: number) => (
                                                                        <tr key={i} className="hover:bg-[var(--primary)]/[0.03] transition-colors group/row">
                                                                            <td className="p-4 w-12 text-[10px] font-black font-mono text-[var(--text-tertiary)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm sticky left-0 z-10 group-hover/row:text-[var(--primary)] transition-colors border-r border-[var(--border-default)]">{i + 1}</td>
                                                                            {previewData.columns.map((col: any) => {
                                                                                const val = row[col.name];
                                                                                const isNull = val === null || val === undefined || val === '';
                                                                                return (
                                                                                    <td key={col.name} className="p-4 text-[11px] font-medium border-r border-[var(--border-subtle)] last:border-0 truncate max-w-[220px]">
                                                                                        {isNull ? (
                                                                                            <span className="text-[var(--text-tertiary)] italic font-bold opacity-30 text-[9px] tracking-wider">NULL</span>
                                                                                        ) : (
                                                                                            <span className={`${col.type.toLowerCase() === 'numeric' ? 'text-emerald-500 font-mono text-xs' : 'text-[var(--text-primary)]'} opacity-90 group-hover/row:opacity-100 transition-opacity`}>
                                                                                                {String(val)}
                                                                                            </span>
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
                                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-[var(--text-secondary)] bg-[var(--bg-card)]/20 rounded-xl border border-dashed border-[var(--border-subtle)]">
                                                    <Table size={32} className="opacity-20" />
                                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">No readable sectors found</span>
                                                </div>
                                            )}
                                            <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Zap size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] text-emerald-500/70 font-medium tracking-tight">Enterprise Preview Engine: Displaying restricted bytecode sample.</span>
                                                </div>
                                                <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase">Ver 2.4.0-Stable</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                                    <button className="btn btn-primary w-full h-12 text-sm uppercase tracking-widest font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { onFileSelect(viewingMeta); setViewingMeta(null); }}>
                                        Launch Analysis
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// --- UTILITY COMPONENTS (Unchanged logic, updated styling) ---

const FileGrid = ({ files, selectedFiles, onToggleSelection, onFileSelect, onDeleteFile, onToggleFavorite, onViewMeta }: any) => {
    if (files.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {files.map((f: any) => {
                const isSelected = selectedFiles.has(f.id);
                return (
                    <div
                        key={f.id}
                        className={`card group transition-all relative ${isSelected ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)]/5' : 'hover:border-[var(--primary)]'}`}
                        style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <div className="absolute top-2 left-2 z-10" onClick={e => { e.stopPropagation(); onToggleSelection(f.id); }}>
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelection(f.id)}
                            />
                        </div>
                        <div className="flex justify-between items-start pl-6">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${(f.originalName || f.filename).endsWith('.csv') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {(f.originalName || f.filename).endsWith('.csv') ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                            </div>
                            <button
                                className="btn btn-icon btn-ghost btn-xs"
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(f); }}
                                style={{ color: f.isFavorite ? '#fbbf24' : 'var(--text-tertiary)' }}
                            >
                                <Star size={14} fill={f.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                        <div className="pl-6">
                            <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors" title={f.originalName || f.filename}>{f.originalName || f.filename}</h4>
                            <p className="text-xs text-secondary mt-1">{(f.size / 1024).toFixed(1)} KB • {new Date(f.createdAt).toLocaleDateString()}</p>
                            {f.size > 50 * 1024 * 1024 && (
                                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-wider backdrop-blur-md border border-purple-500/10">
                                    BIG DATA
                                </span>
                            )}
                        </div>

                        <div className="mt-2 border-t border-[var(--border-subtle)] pt-3 flex gap-2">
                            <button className="btn btn-xs btn-primary flex-1 py-2 font-bold uppercase tracking-wider text-[9px]" onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}>
                                Analyze
                            </button>
                            <button
                                className="btn btn-xs btn-secondary p-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-all"
                                onClick={(e) => { e.stopPropagation(); onViewMeta(f); }}
                                title="Quick Preview"
                            >
                                <Eye size={14} className="text-primary" />
                            </button>
                        </div>
                    </div>
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
                                                    background: 'linear-gradient(135deg, var(--primary) 0%, #c026d3 100%)',
                                                    border: 'none',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 800,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    boxShadow: '0 4px 15px -5px rgba(192, 38, 211, 0.5)',
                                                    cursor: 'pointer'
                                                }}
                                                title="Commence Neural Analysis"
                                            >
                                                <BrainCircuit size={14} /> Process
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
