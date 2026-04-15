import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Database,
    Zap,
    BarChart3,
    Clock,
    ArrowUpRight,
    Sparkles,
    Layers,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   AMBIENT STATUS STRIP — Top of dashboard
   A cinematic live-status bar showing system vitals
   ────────────────────────────────────────────────────────── */

export const AmbientStatusStrip = ({ fileCount, storageUsed }: { fileCount: number; storageUsed: string }) => {
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setUptime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="ambient-status-strip"
        >
            <div className="strip-inner">
                <div className="strip-item">
                    <Database size={11} />
                    <span className="strip-label">DATASETS</span>
                    <span className="strip-value">{fileCount}</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-item">
                    <Layers size={11} />
                    <span className="strip-label">STORAGE</span>
                    <span className="strip-value">{storageUsed} MB</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-item">
                    <Clock size={11} />
                    <span className="strip-label">SESSION</span>
                    <span className="strip-value mono">{formatUptime(uptime)}</span>
                </div>
            </div>
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────────
   RADIAL PERFORMANCE GAUGE — Animated SVG ring gauge
   ────────────────────────────────────────────────────────── */

export const PerformanceGauge = ({ value = 94, label = 'System Health', onClick }: { value?: number; label?: string; onClick?: () => void }) => {
    const radius = 58;
    const stroke = 6;
    const circumference = 2 * Math.PI * radius;
    const progress = ((100 - value) / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
            className={`performance-gauge ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
            onClick={onClick}
        >
            <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Background track */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={stroke}
                />
                {/* Animated progress */}
                <motion.circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progress }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        transformOrigin: 'center',
                        transform: 'rotate(-90deg)',
                        filter: `drop-shadow(0 0 8px ${color}60)`
                    }}
                />
                {/* Glow overlay */}
                <motion.circle
                    cx="70" cy="70" r={radius - 12}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.15}
                    strokeDasharray="4 8"
                    style={{ transformOrigin: 'center' }}
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 70 70"
                        to="360 70 70"
                        dur="20s"
                        repeatCount="indefinite"
                    />
                </motion.circle>
            </svg>
            <div className="gauge-content">
                <motion.span
                    className="gauge-value"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{ color }}
                >
                    {value}
                </motion.span>
                <span className="gauge-unit">%</span>
                <span className="gauge-label">{label}</span>
            </div>
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────────
   ORBITAL METRIC ORB — A 3D-inspired circular metric
   ────────────────────────────────────────────────────────── */

interface OrbProps {
    label: string;
    value: string;
    subValue?: string;
    color: string;
    icon: React.ReactNode;
    trend?: string;
    index: number;
    sparkData?: number[];
}

export const OrbitalMetric = ({ label, value, subValue, color, icon, trend, index, sparkData }: OrbProps) => {
    const orbRef = useRef<HTMLDivElement>(null);
    return (
        <motion.div
            ref={orbRef}
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="orbital-metric"
            style={{ '--orb-color': color } as React.CSSProperties}
        >
            {/* Holographic border sweep */}
            <div className="orb-border-sweep" />

            {/* Orbital rings */}
            <div className="orb-ring orb-ring-1" />
            <div className="orb-ring orb-ring-2" />
            <div className="orb-ring orb-ring-3" />

            {/* Glow background */}
            <div className="orb-glow" />

            {/* Content */}
            <div className="orb-content">
                <div className="orb-icon">{icon}</div>
                <div className="orb-label">{label}</div>
                <div className="orb-value">{value}</div>
                {subValue && <div className="orb-sub">{subValue}</div>}

                {trend && (
                    <div className={`orb-trend ${trend.includes('-') ? 'negative' : 'positive'}`}>
                        <ArrowUpRight size={10} />
                        <span>{trend}</span>
                    </div>
                )}
            </div>

            {/* Corner accents */}
            <div className="orb-accent top-left" />
            <div className="orb-accent top-right" />
            <div className="orb-accent bottom-left" />
            <div className="orb-accent bottom-right" />
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────────
   QUICK ACTIONS BAR — Glassmorphic command palette
   ────────────────────────────────────────────────────────── */

export const QuickActionsBar = ({ onUpload, onViewReport, onUpgrade, fileCount }: {
    onUpload: () => void;
    onViewReport: () => void;
    onUpgrade: () => void;
    fileCount: number;
}) => {
    const actions = [
        { label: 'Upload Dataset', icon: Database, color: 'var(--primary)', action: onUpload, shortcut: '⌘U' },
        { label: 'View Report', icon: BarChart3, color: 'var(--accent)', action: onViewReport, shortcut: '⌘R' },
        { label: 'Upgrade Plan', icon: Sparkles, color: 'var(--warning)', action: onUpgrade, shortcut: '⌘P' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="quick-actions-bar"
        >
            {actions.map((act, i) => (
                <motion.button
                    key={act.label}
                    onClick={act.action}
                    className="quick-action-item"
                    style={{ '--qa-color': act.color } as React.CSSProperties}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.08, duration: 0.4 }}
                >
                    <div className="qa-icon-wrap" style={{ color: act.color }}>
                        <act.icon size={18} />
                    </div>
                    <span className="qa-label">{act.label}</span>
                    <span className="qa-shortcut">{act.shortcut}</span>
                </motion.button>
            ))}
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────────
   INTELLIGENCE TIMELINE — Scrolling activity feed (Bento Edition)
   ────────────────────────────────────────────────────────── */

const BENTO = {
    radius: '20px',
    glass: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.12)',
    shadow: '0 8px 32px -8px rgba(0,0,0,0.3)',
    blur: 'blur(12px)',
};

interface TimelineEvent {
    id: string;
    type: 'upload' | 'analysis' | 'anomaly' | 'insight' | 'system';
    title: string;
    description: string;
    time: string;
    status?: string;
}

const getEventIcon = (type: string) => {
    switch (type) {
        case 'upload': return <Database size={14} />;
        case 'analysis': return <BarChart3 size={14} />;
        case 'anomaly': return <Activity size={14} />;
        case 'insight': return <Sparkles size={14} />;
        case 'system': return <Zap size={14} />;
        default: return <Zap size={14} />;
    }
};

const getEventTokens = (type: string) => {
    switch (type) {
        case 'upload': return { base: 'var(--primary)', glow: 'var(--primary-glow)', subtle: 'var(--primary-subtle)' };
        case 'analysis': return { base: 'var(--accent)', glow: 'var(--accent-glow, rgba(139, 92, 246, 0.35))', subtle: 'rgba(139, 92, 246, 0.1)' };
        case 'anomaly': return { base: 'var(--danger)', glow: 'var(--danger-glow)', subtle: 'rgba(239, 68, 68, 0.1)' };
        case 'insight': return { base: 'var(--success)', glow: 'var(--success-glow)', subtle: 'rgba(16, 185, 129, 0.1)' };
        case 'system': return { base: 'var(--secondary-accent)', glow: 'var(--secondary-glow)', subtle: 'rgba(6, 182, 212, 0.1)' };
        default: return { base: 'var(--text-muted)', glow: 'rgba(100, 116, 139, 0.3)', subtle: 'rgba(100, 116, 139, 0.1)' };
    }
};

export const IntelligenceTimeline = ({ files }: { files: any[] }) => {
    const events: TimelineEvent[] = useMemo(() => {
        const evts: TimelineEvent[] = [];

        files.slice(0, 6).forEach((f: any, i: number) => {
            evts.push({
                id: `upload-${f.id}`,
                type: 'upload',
                title: `Dataset Ingested`,
                description: f.originalName || f.filename,
                time: new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                status: 'Indexed'
            });
            if (i < 3) {
                evts.push({
                    id: `analysis-${f.id}`,
                    type: 'analysis',
                    title: 'Neural Mapping Complete',
                    description: `Schema inference for ${(f.originalName || f.filename).split('.')[0]}`,
                    time: new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    status: 'Complete'
                });
            }
        });

        return evts.slice(0, 8);
    }, [files]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ borderColor: BENTO.borderHover }}
            transition={{ delay: 1.2, duration: 0.35 }}
            style={{
                padding: '24px', borderRadius: BENTO.radius,
                background: BENTO.glass, border: `1px solid ${BENTO.border}`,
                backdropFilter: BENTO.blur,
                boxShadow: BENTO.shadow,
                display: 'flex', flexDirection: 'column', gap: '20px',
                transition: 'border-color 0.25s',
                width: '100%', height: '100%',
                position: 'relative', overflow: 'hidden'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={15} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Intelligence Feed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger-glow)' }} />
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.05em' }}>LIVE</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {/* Visual track line */}
                <div style={{ position: 'absolute', left: 15, top: 20, bottom: 20, width: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }} />

                {events.map((event, i) => {
                    const tokens = getEventTokens(event.type);
                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.4 + i * 0.08 }}
                            style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}
                        >
                            <div style={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                                <div style={{ 
                                    width: 12, height: 12, borderRadius: '50%', 
                                    background: tokens.base, boxShadow: `0 0 12px ${tokens.glow}`,
                                    border: `2px solid var(--bg-card)`
                                }} />
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.015)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }}
                                 onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                 onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '6px', background: tokens.subtle, color: tokens.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getEventIcon(event.type)}
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{event.time}</span>
                                    </div>
                                    {event.status && (
                                        <span style={{ fontSize: '9px', fontWeight: 800, color: tokens.base, background: tokens.subtle, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {event.status}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{event.title}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>{event.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};



/* ──────────────────────────────────────────────────────────
   LIVE CLOCK — animated time display
   ────────────────────────────────────────────────────────── */

export const LiveClock = () => {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const tick = () => setTime(new Date());
        tick();
        const interval = window.setInterval(tick, 1000);
        return () => window.clearInterval(interval);
    }, []);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

    return (
        <div className="live-clock">
            <div className="clock-time">
                {timeStr}
            </div>
            <div className="clock-date">
                {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </div>
        </div>
    );
};
