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

export const PerformanceGauge = ({ value = 94, label = 'System Health' }: { value?: number; label?: string }) => {
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
            className="performance-gauge"
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
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
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
        { label: 'Upload Dataset', icon: Database, color: '#3b82f6', action: onUpload, shortcut: '⌘U' },
        { label: 'View Report', icon: BarChart3, color: '#8b5cf6', action: onViewReport, shortcut: '⌘R' },
        { label: 'Upgrade Plan', icon: Sparkles, color: '#f59e0b', action: onUpgrade, shortcut: '⌘P' },
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
                    <div className="qa-icon-wrap">
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
   INTELLIGENCE TIMELINE — Scrolling activity feed
   ────────────────────────────────────────────────────────── */

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

const getEventColor = (type: string) => {
    switch (type) {
        case 'upload': return '#3b82f6';
        case 'analysis': return '#8b5cf6';
        case 'anomaly': return '#ef4444';
        case 'insight': return '#10b981';
        case 'system': return '#06b6d4';
        default: return '#64748b';
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="intel-timeline"
        >
            <div className="timeline-header">
                <div className="timeline-title-group">
                    <div className="timeline-icon-wrap">
                        <Activity size={16} />
                    </div>
                    <h3>Intelligence Feed</h3>
                </div>
                <div className="timeline-live-badge">
                    <div className="live-dot" />
                    LIVE
                </div>
            </div>

            <div className="timeline-body">
                {events.map((event, i) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + i * 0.08 }}
                        className="timeline-event"
                    >
                        <div className="event-line">
                            <div className="event-dot" style={{ background: getEventColor(event.type), boxShadow: `0 0 12px ${getEventColor(event.type)}40` }} />
                            {i < events.length - 1 && <div className="event-connector" />}
                        </div>
                        <div className="event-content">
                            <div className="event-meta">
                                <div className="event-icon" style={{ color: getEventColor(event.type), background: `${getEventColor(event.type)}15` }}>
                                    {getEventIcon(event.type)}
                                </div>
                                <span className="event-time">{event.time}</span>
                                {event.status && (
                                    <span className="event-status" style={{ color: getEventColor(event.type), borderColor: `${getEventColor(event.type)}30` }}>
                                        {event.status}
                                    </span>
                                )}
                            </div>
                            <div className="event-title">{event.title}</div>
                            <div className="event-desc">{event.description}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};



/* ──────────────────────────────────────────────────────────
   LIVE CLOCK — animated time display
   ────────────────────────────────────────────────────────── */

export const LiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="live-clock">
            <div className="clock-time">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="clock-date">
                {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
        </div>
    );
};
