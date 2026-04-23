import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CloudUpload,
    ShieldCheck,
    BrainCircuit,
    Zap,
    BarChart3,
    CheckCircle2,
    Loader2,
    Activity,
    Lock,
    XCircle,
    ArrowRight,
    RefreshCw,
    X,
    Sparkles
} from 'lucide-react';

interface ProcessingOverlayProps {
    isVisible: boolean;
    stage: number; // 0 to 4 (analysis) or 0 to 2 (upload)
    status?: 'processing' | 'completed' | 'error';
    mode?: 'analysis' | 'upload';
    errorDetails?: string;
    onViewResults?: () => void;
    onRetry?: () => void;
    onClose?: () => void;
}

const ANALYSIS_STAGES = [
    {
        id: 0,
        label: "Uploading Assets",
        desc: "Transmitting encrypted knowledge vectors to the secure elastic vault.",
        icon: CloudUpload,
        color: "#3b82f6",
        audit: "AES-256 Protocol // Active"
    },
    {
        id: 1,
        label: "Validating Schema",
        desc: "Normalizing dimensions and purifying dataset entities for analysis.",
        icon: ShieldCheck,
        color: "#10b981",
        audit: "Dimensional Integrity // Verified"
    },
    {
        id: 2,
        label: "Neural Processing",
        desc: "Synthesizing causality patterns and identifying institutional trends.",
        icon: BrainCircuit,
        color: "#8b5cf6",
        audit: "Cognitive Engine // Processing"
    },
    {
        id: 3,
        label: "Strategy Generation",
        desc: "Manifesting executive findings and strategic ROI frameworks.",
        icon: Zap,
        color: "#f59e0b",
        audit: "Reasoning Phase // 88% Complete"
    },
    {
        id: 4,
        label: "Knowledge Manifest",
        desc: "Neural synthesis complete. The strategic surface is now available.",
        icon: BarChart3,
        color: "#ec4899",
        audit: "Surface Ready // Manifested"
    }
];

const UPLOAD_STAGES = [
    {
        id: 0,
        label: "Transmitting Data",
        desc: "Encrypting and transmitting dataset to the secure elastic vault.",
        icon: CloudUpload,
        color: "#3b82f6",
        audit: "AES-256 Transfer // Active"
    },
    {
        id: 1,
        label: "Indexing Dataset",
        desc: "Registering data topology and building structural metadata.",
        icon: ShieldCheck,
        color: "#10b981",
        audit: "Schema Indexed // Verified"
    },
    {
        id: 2,
        label: "Dataset Secured",
        desc: "Your dataset is now available in the workspace. Click Process to analyze.",
        icon: CheckCircle2,
        color: "#10b981",
        audit: "Vault Sealed // Ready"
    }
];

/* ---------- Floating Particles ---------- */
const Particles = React.memo(({ count = 40, color = '#3b82f6' }: { count?: number; color?: string }) => {
    const particles = React.useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            dur: Math.random() * 20 + 15,
            delay: Math.random() * -20,
            opacity: Math.random() * 0.4 + 0.1,
        })),
        [count]
    );

    return (
        <div className="po-particles">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="po-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        background: color,
                        opacity: p.opacity,
                        animationDuration: `${p.dur}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
});

/* ---------- Animated Rings ---------- */
const OrbitalRings = ({ status }: { status: string }) => {
    const ringColor = status === 'error' ? 'rgba(239,68,68,0.15)' : status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.12)';
    const dotColor = status === 'error' ? '#ef4444' : status === 'completed' ? '#10b981' : '#3b82f6';

    return (
        <div className="po-orbital-container">
            {/* Ring 1 */}
            <motion.div
                className="po-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ width: '100%', height: '100%', borderColor: ringColor }}
            >
                <div className="po-ring-dot" style={{ background: dotColor, boxShadow: `0 0 12px ${dotColor}` }} />
            </motion.div>
            {/* Ring 2 */}
            <motion.div
                className="po-ring"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ width: '80%', height: '80%', borderColor: ringColor, borderStyle: 'dashed' }}
            >
                <div className="po-ring-dot po-ring-dot-sm" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}`, opacity: 0.6 }} />
            </motion.div>
            {/* Ring 3 — subtle */}
            <motion.div
                className="po-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                style={{ width: '60%', height: '60%', borderColor: ringColor, opacity: 0.4 }}
            />
        </div>
    );
};

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
    isVisible,
    stage,
    status = 'processing',
    mode = 'analysis',
    errorDetails,
    onViewResults,
    onRetry,
    onClose
}) => {
    const STAGES = mode === 'upload' ? UPLOAD_STAGES : ANALYSIS_STAGES;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => { setMounted(false); };
    }, []);

    const formatErrorMessage = useCallback((err?: string) => {
        if (!err) return 'A structural anomaly was detected in the data stream.';
        try {
            const parsed = typeof err === 'string' && err.includes('{"error":')
                ? JSON.parse(err.substring(err.indexOf('{')))
                : { error: err };
            let message = parsed.message || parsed.error || err;
            if (message.startsWith('Upload failed for')) {
                message = message.split(':').slice(1).join(':').trim();
            }
            return message;
        } catch (e) {
            return err.replace(/["{}]/g, '').replace('error:', '').trim();
        }
    }, []);

    const currentStage = STAGES[Math.min(stage, STAGES.length - 1)];
    const progressPct = Math.round((stage + 1) / STAGES.length * 100);
    const accentColor = status === 'error' ? '#ef4444' : status === 'completed' ? '#10b981' : currentStage.color;

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2147483647,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* ─── Background ─── */}
                    <div className="po-backdrop" />
                    <Particles count={50} color={accentColor} />

                    {/* ─── Ambient glow blobs ─── */}
                    <div className="po-ambient">
                        <motion.div
                            className="po-glow po-glow-1"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ background: accentColor }}
                        />
                        <motion.div
                            className="po-glow po-glow-2"
                            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.04, 0.09, 0.04] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ background: '#8b5cf6' }}
                        />
                    </div>

                    {/* ─── Card ─── */}
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="po-card"
                    >
                        {/* ── Header Bar ── */}
                        <div className="po-header">
                            <div className="po-header-left">
                                <motion.div
                                    className="po-status-dot"
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ background: accentColor, boxShadow: `0 0 12px ${accentColor}` }}
                                />
                                <span className="po-header-label">
                                    {status === 'error' ? 'CORE ERROR DETECTED' : status === 'completed' ? (mode === 'upload' ? 'UPLOAD COMPLETE' : 'PROCESSING FINALIZED') : (mode === 'upload' ? 'SECURE UPLOAD ACTIVE' : 'NEURAL CORE ACTIVE')}
                                </span>
                            </div>
                            <div className="po-header-right">
                                {status === 'processing' && (
                                    <span className="po-pct-badge">{progressPct}%</span>
                                )}
                                <Activity size={13} style={{ opacity: 0.25 }} />
                                <Lock size={13} style={{ opacity: 0.25 }} />
                                <button onClick={onClose} className="po-close-btn" title="Close">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* ── Progress Bar (thin, top) ── */}
                        {status === 'processing' && (
                            <div className="po-progress-track">
                                <motion.div
                                    className="po-progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 120 }}
                                    style={{ background: `linear-gradient(90deg, ${accentColor}, #8b5cf6)` }}
                                />
                            </div>
                        )}

                        {/* ── Central Visual ── */}
                        <div className="po-body">
                            <div className="po-orb-zone">
                                <OrbitalRings status={status} />

                                {/* Pulsing halo */}
                                <motion.div
                                    className="po-halo"
                                    animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.15, 0.35, 0.15] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
                                />

                                {/* Icon sphere */}
                                <motion.div
                                    className="po-icon-sphere"
                                    animate={status === 'completed' ? { scale: [0.95, 1.05, 1], rotate: [0, 5, 0] } : {}}
                                    transition={{ duration: 0.6 }}
                                    style={{
                                        background: status === 'error'
                                            ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                                            : status === 'completed'
                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                : `linear-gradient(135deg, ${currentStage.color}, #8b5cf6)`,
                                        boxShadow: `0 8px 40px -8px ${accentColor}60`,
                                    }}
                                >
                                    {status === 'error'
                                        ? <XCircle size={36} strokeWidth={1.5} />
                                        : status === 'completed'
                                            ? <CheckCircle2 size={36} strokeWidth={1.5} />
                                            : <currentStage.icon size={36} strokeWidth={1.5} />
                                    }
                                </motion.div>
                            </div>

                            {/* ── Text ── */}
                            <div className="po-text-block">
                                <motion.h2
                                    key={status + stage}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.4 }}
                                    className="po-title"
                                >
                                    {status === 'error' ? 'Request Blocked' : status === 'completed' ? (mode === 'upload' ? 'Upload Complete' : 'Neural Link Ready') : currentStage.label}
                                </motion.h2>
                                <motion.p
                                    key={`desc-${status}-${stage}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={`po-desc ${status === 'error' ? 'po-desc-error' : ''}`}
                                >
                                    {status === 'error'
                                        ? formatErrorMessage(errorDetails)
                                        : status === 'completed'
                                            ? (mode === 'upload'
                                                ? 'Your dataset has been securely ingested. Click "Process" from the dashboard to begin analysis.'
                                                : 'Dataset synthesis complete. Strategic intelligence has been manifested in your workspace.')
                                            : currentStage.desc
                                    }
                                </motion.p>
                            </div>

                            {/* ── Stage Steps (processing / error) ── */}
                            {status !== 'completed' && (
                                <div className="po-stages">
                                    {STAGES.map((s, idx) => {
                                        const isCurrent = idx === stage && status === 'processing';
                                        const isFinished = idx < stage;
                                        const isErrorLine = idx === stage && status === 'error';
                                        const inactive = idx > stage;

                                        return (
                                            <motion.div
                                                key={s.id}
                                                initial={false}
                                                animate={{
                                                    opacity: inactive ? 0.2 : 1,
                                                    y: inactive ? 4 : 0,
                                                }}
                                                className={`po-stage-row ${isCurrent ? 'po-stage-active' : ''} ${isErrorLine ? 'po-stage-error' : ''} ${isFinished ? 'po-stage-done' : ''}`}
                                            >
                                                <div className={`po-stage-icon ${isFinished ? 'po-stage-icon-done' : ''} ${isCurrent ? 'po-stage-icon-active' : ''} ${isErrorLine ? 'po-stage-icon-error' : ''}`}>
                                                    {isFinished
                                                        ? <CheckCircle2 size={14} strokeWidth={3} />
                                                        : isCurrent
                                                            ? <Loader2 size={14} className="po-spin" />
                                                            : isErrorLine
                                                                ? <XCircle size={14} />
                                                                : <div className="po-stage-num">{idx + 1}</div>
                                                    }
                                                </div>
                                                <div className="po-stage-text">
                                                    <span className="po-stage-label">{s.label}</span>
                                                    {(isCurrent || isErrorLine) && (
                                                        <span className={`po-stage-audit ${isErrorLine ? 'po-audit-error' : ''}`}>
                                                            {isErrorLine ? 'HALTED // FAULT_DETECTED' : s.audit}
                                                        </span>
                                                    )}
                                                </div>
                                                {isFinished && (
                                                    <span className="po-stage-check-label">Done</span>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Completion Stats (completed) ── */}
                            {status === 'completed' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="po-completed-stats"
                                >
                                    {(mode === 'upload'
                                        ? [
                                            { label: 'Status', value: 'Indexed', color: '#10b981' },
                                            { label: 'Integrity', value: '100%', color: '#3b82f6' },
                                            { label: 'Vault', value: 'Secure', color: '#8b5cf6' },
                                        ]
                                        : [
                                            { label: 'Stages', value: '5/5', color: '#10b981' },
                                            { label: 'Integrity', value: '100%', color: '#3b82f6' },
                                            { label: 'Link', value: 'Secure', color: '#8b5cf6' },
                                        ]
                                    ).map((stat) => (
                                        <div key={stat.label} className="po-stat-chip">
                                            <span className="po-stat-value" style={{ color: stat.color }}>{stat.value}</span>
                                            <span className="po-stat-label">{stat.label}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* ── Bottom Progress (processing) ── */}
                            {status === 'processing' && (
                                <div className="po-bottom-progress">
                                    <div className="po-bp-meta">
                                        <span className="po-bp-label">{mode === 'upload' ? 'Upload Progress' : 'Cognitive Completion'}</span>
                                        <span className="po-bp-pct" style={{ color: accentColor }}>{progressPct}%</span>
                                    </div>
                                    <div className="po-bp-track">
                                        <motion.div
                                            className="po-bp-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPct}%` }}
                                            style={{
                                                background: `linear-gradient(90deg, ${accentColor}, #8b5cf6)`,
                                                boxShadow: `0 0 18px ${accentColor}50`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Actions ── */}
                            <div className="po-actions">
                                {status === 'completed' ? (
                                    <>
                                        <motion.button
                                            onClick={onViewResults}
                                            className="po-btn po-btn-primary"
                                            whileHover={{ scale: 1.015, boxShadow: `0 8px 30px -6px ${accentColor}80` }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Sparkles size={18} />
                                            <span>{mode === 'upload' ? 'Return to Dashboard' : 'Manifest Analysis'}</span>
                                            <ArrowRight size={18} />
                                        </motion.button>
                                        <button onClick={onClose} className="po-btn po-btn-ghost">
                                            Dismiss Dashboard
                                        </button>
                                    </>
                                ) : status === 'error' ? (
                                    <>
                                        <motion.button
                                            onClick={onRetry}
                                            className="po-btn po-btn-danger"
                                            whileHover={{ scale: 1.015 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <RefreshCw size={18} />
                                            <span>Retry Transfer</span>
                                        </motion.button>
                                        <button onClick={onClose} className="po-btn po-btn-ghost">
                                            Abort Operation
                                        </button>
                                    </>
                                ) : (
                                    <p className="po-hint">{mode === 'upload' ? 'Transmitting data securely — please wait' : 'Do not close this panel during neural synthesis'}</p>
                                )}
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="po-footer">
                            <div className="po-footer-meta">
                                <div className="po-footer-item">
                                    <span className="po-footer-key">Instance</span>
                                    <span className="po-footer-val">nalyse_0.1.0_x</span>
                                </div>
                                <div className="po-footer-divider" />
                                <div className="po-footer-item po-footer-hide-mobile">
                                    <span className="po-footer-key">Neural Link</span>
                                    <span className="po-footer-val po-footer-val-green">ENCRYPTED</span>
                                </div>
                            </div>
                            <div className="po-footer-badge">
                                <ShieldCheck size={12} />
                                <span>Vault Secure</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scoped styles */}
                    <style>{`
                        /* ────── BACKDROP ────── */
                        .po-backdrop {
                            position: absolute; inset: 0;
                            background: var(--bg-app);
                            opacity: 0.92;
                            backdrop-filter: blur(40px) saturate(120%);
                            -webkit-backdrop-filter: blur(40px) saturate(120%);
                        }

                        /* ────── PARTICLES ────── */
                        .po-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
                        .po-particle {
                            position: absolute; border-radius: 50%;
                            animation: po-float linear infinite;
                        }
                        @keyframes po-float {
                            0% { transform: translateY(0) translateX(0); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { transform: translateY(-120vh) translateX(40px); opacity: 0; }
                        }

                        /* ────── AMBIENT GLOWS ────── */
                        .po-ambient { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
                        .po-glow { position: absolute; border-radius: 50%; filter: blur(120px); }
                        .po-glow-1 { width: 600px; height: 600px; top: -10%; right: -10%; }
                        .po-glow-2 { width: 500px; height: 500px; bottom: -15%; left: -8%; }

                        /* ────── CARD ────── */
                        .po-card {
                            position: relative; z-index: 10;
                            width: 100%; max-width: 560px;
                            background: var(--bg-card);
                            border: 1px solid var(--border-default);
                            border-radius: 28px;
                            box-shadow: 0 20px 60px -10px rgba(0,0,0,0.3);
                            overflow: hidden;
                            display: flex; flex-direction: column;
                        }

                        /* ────── HEADER ────── */
                        .po-header {
                            display: flex; align-items: center; justify-content: space-between;
                            padding: 16px 24px;
                            border-bottom: 1px solid var(--border-subtle);
                            background: var(--bg-surface);
                            border-radius: 28px 28px 0 0;
                        }
                        .po-header-left { display: flex; align-items: center; gap: 10px; }
                        .po-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
                        .po-header-label {
                            font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
                            text-transform: uppercase; color: var(--text-secondary);
                            font-family: var(--font-mono, 'JetBrains Mono', monospace);
                        }
                        .po-header-right { display: flex; align-items: center; gap: 12px; color: var(--text-muted); }
                        .po-pct-badge {
                            font-size: 10px; font-weight: 900; font-family: var(--font-mono, monospace);
                            color: var(--primary); background: rgba(59,130,246,0.08);
                            padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.15);
                        }
                        .po-close-btn {
                            padding: 6px; border-radius: 8px; border: none; background: transparent;
                            color: var(--text-muted); cursor: pointer; display: flex;
                            transition: all 0.2s;
                        }
                        .po-close-btn:hover { background: var(--bg-surface-hover); color: var(--text-primary); }

                        /* ────── PROGRESS TRACK (thin top bar) ────── */
                        .po-progress-track {
                            height: 2px; width: 100%; background: var(--bg-surface-hover);
                        }
                        .po-progress-fill { height: 100%; border-radius: 0 2px 2px 0; }

                        /* ────── BODY ────── */
                        .po-body {
                            padding: 40px 32px 28px;
                            display: flex; flex-direction: column; align-items: center;
                            text-align: center; gap: 24px;
                            overflow-y: auto; max-height: 80vh;
                        }

                        /* ────── ORB ZONE ────── */
                        .po-orb-zone {
                            position: relative; width: 160px; height: 160px;
                            display: flex; align-items: center; justify-content: center;
                            flex-shrink: 0;
                        }
                        .po-orbital-container {
                            position: absolute; inset: 0;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .po-ring {
                            position: absolute; border-radius: 50%;
                            border-width: 1px; border-style: solid;
                        }
                        .po-ring-dot {
                            position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
                            width: 8px; height: 8px; border-radius: 50%;
                        }
                        .po-ring-dot-sm { width: 5px; height: 5px; top: -3px; }
                        .po-halo {
                            position: absolute; width: 120%; height: 120%;
                            border-radius: 50%; pointer-events: none;
                        }
                        .po-icon-sphere {
                            position: relative; z-index: 5;
                            width: 80px; height: 80px; border-radius: 24px;
                            display: flex; align-items: center; justify-content: center;
                            color: white;
                            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                        }

                        /* ────── TEXT ────── */
                        .po-text-block { max-width: 380px; }
                        .po-title {
                            font-size: 28px; font-weight: 800; letter-spacing: -0.03em;
                            color: var(--text-primary); margin: 0 0 10px 0;
                            font-family: var(--font-heading, 'Outfit', sans-serif);
                        }
                        .po-desc {
                            font-size: 14px; line-height: 1.65; color: var(--text-secondary);
                            margin: 0;
                        }
                        .po-desc-error { color: #f87171; font-weight: 500; }

                        /* ────── COMPLETED STATS ────── */
                        .po-completed-stats {
                            display: flex; gap: 16px; justify-content: center;
                            padding: 16px 0 4px;
                        }
                        .po-stat-chip {
                            display: flex; flex-direction: column; align-items: center; gap: 4px;
                            padding: 12px 20px; border-radius: 14px;
                            background: var(--bg-surface-hover); border: 1px solid var(--border-default);
                            min-width: 80px;
                        }
                        .po-stat-value {
                            font-size: 18px; font-weight: 900;
                            font-family: var(--font-mono, monospace);
                        }
                        .po-stat-label {
                            font-size: 10px; font-weight: 700; text-transform: uppercase;
                            letter-spacing: 0.1em; color: var(--text-muted);
                        }

                        /* ────── STAGES ────── */
                        .po-stages {
                            width: 100%; display: flex; flex-direction: column; gap: 6px;
                        }
                        .po-stage-row {
                            display: flex; align-items: center; gap: 12px;
                            padding: 12px 16px; border-radius: 14px;
                            border: 1px solid var(--border-default);
                            background: var(--bg-surface);
                            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                        .po-stage-active {
                            background: rgba(59,130,246,0.06) !important;
                            border-color: rgba(59,130,246,0.18) !important;
                            box-shadow: 0 0 20px -8px rgba(59,130,246,0.15);
                        }
                        .po-stage-error {
                            background: rgba(239,68,68,0.04) !important;
                            border-color: rgba(239,68,68,0.15) !important;
                        }
                        .po-stage-done { opacity: 0.7; }

                        .po-stage-icon {
                            width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
                            display: flex; align-items: center; justify-content: center;
                            border: 1px solid var(--border-default);
                            color: var(--text-muted); font-size: 11px; font-weight: 800;
                            transition: all 0.3s;
                        }
                        .po-stage-icon-done {
                            background: #10b981; border-color: #10b981; color: white;
                        }
                        .po-stage-icon-active {
                            background: var(--primary, #3b82f6); border-color: var(--primary, #3b82f6);
                            color: white; box-shadow: 0 4px 16px -4px rgba(59,130,246,0.4);
                        }
                        .po-stage-icon-error {
                            background: #ef4444; border-color: #ef4444; color: white;
                        }
                        .po-stage-num { font-family: var(--font-mono, monospace); }
                        .po-stage-text {
                            flex: 1; text-align: left; display: flex; flex-direction: column; gap: 2px;
                        }
                        .po-stage-label {
                            font-size: 12px; font-weight: 700; text-transform: uppercase;
                            letter-spacing: 0.08em; color: var(--text-secondary);
                        }
                        .po-stage-active .po-stage-label { color: var(--text-primary); }
                        .po-stage-error .po-stage-label { color: #f87171; }
                        .po-stage-audit {
                            font-size: 10px; font-family: var(--font-mono, monospace);
                            color: var(--primary, #3b82f6); letter-spacing: 0.02em;
                        }
                        .po-audit-error { color: #ef4444; }
                        .po-stage-check-label {
                            font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase;
                            letter-spacing: 0.08em;
                        }

                        /* ────── BOTTOM PROGRESS ────── */
                        .po-bottom-progress { width: 100%; padding-top: 8px; }
                        .po-bp-meta {
                            display: flex; justify-content: space-between; align-items: baseline;
                            margin-bottom: 8px;
                        }
                        .po-bp-label {
                            font-size: 10px; font-weight: 800; text-transform: uppercase;
                            letter-spacing: 0.15em; color: var(--text-muted);
                            font-family: var(--font-mono, monospace);
                        }
                        .po-bp-pct {
                            font-size: 20px; font-weight: 900;
                            font-family: var(--font-mono, monospace);
                        }
                        .po-bp-track {
                            height: 5px; width: 100%; background: var(--bg-surface-hover);
                            border-radius: 99px; overflow: hidden;
                        }
                        .po-bp-fill { height: 100%; border-radius: 99px; transition: width 0.6s; }

                        /* ────── ACTIONS ────── */
                        .po-actions { width: 100%; display: flex; flex-direction: column; gap: 6px; padding-top: 8px; }
                        .po-btn {
                            width: 100%; display: flex; align-items: center; justify-content: center;
                            gap: 10px; border: none; cursor: pointer;
                            font-family: var(--font-main, 'Inter', sans-serif);
                            font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
                            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                        .po-btn-primary {
                            padding: 18px 24px; border-radius: 16px; font-size: 14px;
                            background: linear-gradient(135deg, #3b82f6, #6366f1);
                            color: white;
                            box-shadow: 0 6px 24px -4px rgba(59,130,246,0.4);
                        }
                        .po-btn-primary:hover { box-shadow: 0 10px 36px -6px rgba(59,130,246,0.5); }
                        .po-btn-danger {
                            padding: 18px 24px; border-radius: 16px; font-size: 14px;
                            background: linear-gradient(135deg, #dc2626, #b91c1c);
                            color: white;
                            box-shadow: 0 6px 24px -4px rgba(239,68,68,0.3);
                        }
                        .po-btn-ghost {
                            padding: 12px; border-radius: 10px; font-size: 10px;
                            background: transparent; color: var(--text-muted);
                            letter-spacing: 0.25em;
                        }
                        .po-btn-ghost:hover { color: var(--text-primary); background: var(--bg-surface-hover); }
                        .po-hint {
                            font-size: 10px; font-family: var(--font-mono, monospace);
                            color: var(--text-muted); text-transform: uppercase;
                            letter-spacing: 0.15em; padding-top: 8px; margin: 0;
                        }

                        /* ────── FOOTER ────── */
                        .po-footer {
                            display: flex; align-items: center; justify-content: space-between;
                            padding: 14px 24px;
                            border-top: 1px solid var(--border-default);
                            background: var(--bg-surface);
                            border-radius: 0 0 28px 28px;
                        }
                        .po-footer-meta { display: flex; align-items: center; gap: 16px; }
                        .po-footer-item { display: flex; flex-direction: column; gap: 2px; }
                        .po-footer-key {
                            font-size: 8px; font-weight: 900; text-transform: uppercase;
                            letter-spacing: 0.2em; color: var(--text-muted);
                        }
                        .po-footer-val {
                            font-size: 10px; font-family: var(--font-mono, monospace);
                            color: var(--text-secondary); text-transform: lowercase;
                        }
                        .po-footer-val-green { color: rgba(16,185,129,0.6); }
                        .po-footer-divider {
                            width: 1px; height: 24px; background: var(--bg-elevated);
                        }
                        .po-footer-badge {
                            display: flex; align-items: center; gap: 6px;
                            padding: 5px 12px; border-radius: 8px;
                            background: var(--bg-surface-hover); border: 1px solid var(--border-default);
                            font-size: 9px; font-weight: 800; text-transform: uppercase;
                            letter-spacing: 0.12em; color: rgba(255,255,255,0.3);
                        }

                        .po-spin { animation: po-spin-kf 1s linear infinite; }
                        @keyframes po-spin-kf { to { transform: rotate(360deg); } }

                        @media (max-width: 640px) {
                            .po-body { padding: 28px 20px 20px; gap: 20px; }
                            .po-orb-zone { width: 120px; height: 120px; }
                            .po-icon-sphere { width: 60px; height: 60px; border-radius: 18px; }
                            .po-icon-sphere svg { width: 28px; height: 28px; }
                            .po-title { font-size: 22px; }
                            .po-desc { font-size: 13px; }
                            .po-footer-hide-mobile { display: none; }
                            .po-stat-chip { padding: 8px 14px; min-width: 64px; }
                            .po-stat-value { font-size: 15px; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
