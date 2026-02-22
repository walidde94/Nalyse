import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Cpu,
    Wifi,
    Database,
    Shield,
    Zap,
    BarChart3,
    Globe,
    Clock,
    TrendingUp,
    ArrowUpRight,
    Sparkles,
    BrainCircuit,
    Eye,
    Layers,
    Radio,
    HeartPulse,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   AMBIENT STATUS STRIP — Top of dashboard
   A cinematic live-status bar showing system vitals
   ────────────────────────────────────────────────────────── */

export const AmbientStatusStrip = ({ fileCount, storageUsed }: { fileCount: number; storageUsed: string }) => {
    const [uptime, setUptime] = useState(0);
    const [cpuSim, setCpuSim] = useState(23);
    const [networkPulse, setNetworkPulse] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setUptime(prev => prev + 1);
            setCpuSim(prev => Math.max(12, Math.min(45, prev + (Math.random() - 0.5) * 6)));
            setNetworkPulse(prev => (prev + 1) % 100);
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
                {/* Live pulse dot */}
                <div className="strip-item">
                    <div className="pulse-dot" />
                    <span className="strip-label">NEXUS CORE</span>
                    <span className="strip-value accent">ONLINE</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-item">
                    <Cpu size={11} />
                    <span className="strip-label">ENGINE</span>
                    <span className="strip-value">{cpuSim.toFixed(1)}%</span>
                    <div className="micro-bar">
                        <div className="micro-bar-fill" style={{ width: `${cpuSim}%` }} />
                    </div>
                </div>

                <div className="strip-divider" />

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
                    <Shield size={11} />
                    <span className="strip-label">SHIELD</span>
                    <span className="strip-value success">ACTIVE</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-item">
                    <Clock size={11} />
                    <span className="strip-label">SESSION</span>
                    <span className="strip-value mono">{formatUptime(uptime)}</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-item">
                    <Radio size={11} />
                    <span className="strip-label">SYNC</span>
                    <div className="network-pulse">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="network-bar"
                                style={{
                                    height: `${Math.sin((networkPulse + i * 12) * 0.1) * 50 + 50}%`,
                                    opacity: 0.3 + Math.sin((networkPulse + i * 12) * 0.1) * 0.3,
                                }}
                            />
                        ))}
                    </div>
                </div>
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
}

export const OrbitalMetric = ({ label, value, subValue, color, icon, trend, index }: OrbProps) => {
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
        case 'system': return <Cpu size={14} />;
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

        evts.push({
            id: 'system-health',
            type: 'system',
            title: 'System Health Check',
            description: 'All intelligence services nominal',
            time: 'Now',
            status: 'OK'
        });

        evts.push({
            id: 'insight-gen',
            type: 'insight',
            title: 'Causality Engine Active',
            description: 'Cross-dataset pattern recognition running',
            time: 'Live',
            status: 'Active'
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
                        <HeartPulse size={16} />
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
   DATA HEALTH MATRIX — Visual health indicator grid
   ────────────────────────────────────────────────────────── */

export const DataHealthMatrix = ({ files }: { files: any[] }) => {
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);

    const cells = useMemo(() => {
        const totalCells = 64; // 8x8 grid
        return Array.from({ length: totalCells }, (_, i) => {
            const fileIndex = i % Math.max(files.length, 1);
            const file = files[fileIndex];
            const hasData = i < files.length * 8;
            const isAnomaly = file?.filename?.toLowerCase().includes('distress') || file?.filename?.toLowerCase().includes('corrupt');
            return {
                active: hasData,
                health: isAnomaly ? 'warning' : hasData ? 'healthy' : 'inactive',
                intensity: hasData ? 0.3 + Math.random() * 0.7 : 0.05,
            };
        });
    }, [files]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="health-matrix"
        >
            <div className="matrix-header">
                <div className="matrix-title-group">
                    <div className="matrix-icon-wrap">
                        <Eye size={16} />
                    </div>
                    <h3>Data Health Matrix</h3>
                </div>
                <div className="matrix-legend">
                    <span className="legend-item"><span className="legend-dot healthy" /> Optimal</span>
                    <span className="legend-item"><span className="legend-dot warning" /> Review</span>
                    <span className="legend-item"><span className="legend-dot inactive" /> Vacant</span>
                </div>
            </div>
            <div className="matrix-grid">
                {cells.map((cell, i) => (
                    <div
                        key={i}
                        className={`matrix-cell ${cell.health}`}
                        style={{
                            opacity: hoveredCell === i ? 1 : cell.intensity,
                            transform: hoveredCell === i ? 'scale(1.5)' : 'scale(1)',
                        }}
                        onMouseEnter={() => setHoveredCell(i)}
                        onMouseLeave={() => setHoveredCell(null)}
                    />
                ))}
            </div>
        </motion.div>
    );
};
