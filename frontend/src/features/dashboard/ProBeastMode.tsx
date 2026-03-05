import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, Zap, Shield, BrainCircuit, Gauge, Rocket, Flame,
    Database, Layers, Activity, TrendingUp, Globe, Cpu, Signal,
    Sparkles, Lock, Unlock, ArrowUpRight, Eye, Target, Radio
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   PRO POWER BANNER — Replaces QuotaGuard for Pro users
   A cinematic, animated "Beast Mode Activated" strip
   ══════════════════════════════════════════════════════════ */

export const ProPowerBanner = ({ fileCount, storageUsed, maxStorage }: {
    fileCount: number; storageUsed: number; maxStorage: number;
}) => {
    const storagePercent = Math.min(100, Math.round((storageUsed / maxStorage) * 100));
    const [glowPulse, setGlowPulse] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setGlowPulse(p => (p + 1) % 360), 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="pro-power-banner"
        >
            {/* Animated border glow */}
            <div className="ppb-border-glow" style={{
                background: `conic-gradient(from ${glowPulse}deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #3b82f6, #06b6d4, #10b981, #f59e0b)`
            }} />
            <div className="ppb-inner">
                {/* Animated ambient particles */}
                <div className="ppb-particles">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="ppb-particle"
                            animate={{
                                x: [0, Math.random() * 60 - 30, 0],
                                y: [0, Math.random() * 40 - 20, 0],
                                opacity: [0.2, 0.6, 0.2],
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                            style={{
                                left: `${15 + i * 14}%`,
                                top: `${20 + (i % 3) * 25}%`,
                                background: ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899'][i],
                            }}
                        />
                    ))}
                </div>

                <div className="ppb-content">
                    {/* Left: Badge + Title */}
                    <div className="ppb-left">
                        <div className="ppb-crown-wrap">
                            <motion.div
                                animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="ppb-crown"
                            >
                                <Crown size={28} />
                            </motion.div>
                            <div className="ppb-crown-glow" />
                        </div>
                        <div className="ppb-titles">
                            <div className="ppb-badge">
                                <Flame size={10} />
                                <span>BEAST MODE</span>
                                <div className="ppb-badge-dot" />
                            </div>
                            <h2 className="ppb-heading">Neural Pro <span className="ppb-activated">Activated</span></h2>
                            <p className="ppb-sub">Unlimited datasets • 10GB storage • Full intelligence suite</p>
                        </div>
                    </div>

                    {/* Center: Power Rings */}
                    <div className="ppb-rings">
                        <PowerRing
                            value={fileCount}
                            max={999}
                            label="DATASETS"
                            color="#8b5cf6"
                            icon={<Database size={14} />}
                            suffix=""
                            unlimited
                        />
                        <PowerRing
                            value={storagePercent}
                            max={100}
                            label="STORAGE"
                            color="#3b82f6"
                            icon={<Layers size={14} />}
                            suffix="%"
                        />
                        <PowerRing
                            value={98}
                            max={100}
                            label="UPTIME"
                            color="#10b981"
                            icon={<Signal size={14} />}
                            suffix="%"
                        />
                    </div>

                    {/* Right: Power Stats */}
                    <div className="ppb-stats">
                        <div className="ppb-stat">
                            <Unlock size={12} />
                            <span className="ppb-stat-label">File Limit</span>
                            <span className="ppb-stat-value gold">∞</span>
                        </div>
                        <div className="ppb-stat">
                            <Shield size={12} />
                            <span className="ppb-stat-label">Encryption</span>
                            <span className="ppb-stat-value green">AES-256</span>
                        </div>
                        <div className="ppb-stat">
                            <Rocket size={12} />
                            <span className="ppb-stat-label">Priority</span>
                            <span className="ppb-stat-value purple">MAX</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ── Power Ring mini component ── */
const PowerRing = ({ value, max, label, color, icon, suffix, unlimited }: {
    value: number; max: number; label: string; color: string; icon: React.ReactNode; suffix: string; unlimited?: boolean;
}) => {
    const radius = 30;
    const stroke = 4;
    const circumference = 2 * Math.PI * radius;
    const progress = unlimited ? circumference * 0.85 : ((value / max) * circumference);

    return (
        <div className="power-ring-wrap">
            <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
                <motion.circle
                    cx="38" cy="38" r={radius}
                    fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${color}80)` }}
                />
            </svg>
            <div className="power-ring-content">
                <div className="power-ring-icon" style={{ color }}>{icon}</div>
                <span className="power-ring-value" style={{ color }}>
                    {unlimited ? '∞' : value}{!unlimited && suffix}
                </span>
                <span className="power-ring-label">{label}</span>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   PRO HERO ENHANCEMENT — Overlays for hero in pro mode
   ══════════════════════════════════════════════════════════ */

export const ProHeroBadge = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        className="pro-hero-badge"
    >
        <Crown size={12} />
        <span>PRO</span>
        <div className="pro-hero-badge-shine" />
    </motion.div>
);

/* ══════════════════════════════════════════════════════════
   SYSTEM THROUGHPUT GRID — Pro-exclusive telemetry
   ══════════════════════════════════════════════════════════ */

export const SystemThroughputGrid = ({ metrics }: { metrics: any }) => {
    const [throughputData, setThroughputData] = useState<number[]>([]);

    useEffect(() => {
        // Simulate throughput data
        const interval = setInterval(() => {
            setThroughputData(prev => {
                const newVal = Math.random() * 40 + 60;
                const data = [...prev, newVal];
                return data.slice(-30);
            });
        }, 1000);
        // Initialize with data
        setThroughputData(Array.from({ length: 30 }, () => Math.random() * 40 + 60));
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="throughput-grid"
        >
            <div className="throughput-header">
                <div className="throughput-title-group">
                    <div className="throughput-icon-wrap">
                        <Gauge size={16} />
                    </div>
                    <div>
                        <h3>System Throughput</h3>
                        <span className="throughput-sub">Real-time processing pipeline</span>
                    </div>
                </div>
                <div className="throughput-live">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="throughput-live-dot"
                    />
                    STREAMING
                </div>
            </div>
            <div className="throughput-chart">
                <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="throughput-svg">
                    <defs>
                        <linearGradient id="throughput-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {throughputData.length > 1 && (
                        <>
                            <path
                                d={`M0,${60 - (throughputData[0] / 100) * 58} ${throughputData.map((v, i) =>
                                    `L${(i / (throughputData.length - 1)) * 300},${60 - (v / 100) * 58}`
                                ).join(' ')} L300,60 L0,60 Z`}
                                fill="url(#throughput-grad)"
                            />
                            <path
                                d={`M0,${60 - (throughputData[0] / 100) * 58} ${throughputData.map((v, i) =>
                                    `L${(i / (throughputData.length - 1)) * 300},${60 - (v / 100) * 58}`
                                ).join(' ')}`}
                                fill="none" stroke="#8b5cf6" strokeWidth="2"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))' }}
                            />
                            {/* Current value dot */}
                            <circle
                                cx="300"
                                cy={60 - (throughputData[throughputData.length - 1] / 100) * 58}
                                r="3" fill="#8b5cf6"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.8))' }}
                            />
                        </>
                    )}
                </svg>
            </div>
            <div className="throughput-stats">
                <div className="throughput-stat">
                    <span className="ts-label">Avg Latency</span>
                    <span className="ts-value">12ms</span>
                </div>
                <div className="throughput-stat">
                    <span className="ts-label">Throughput</span>
                    <span className="ts-value">{throughputData.length > 0 ? throughputData[throughputData.length - 1].toFixed(0) : '—'}%</span>
                </div>
                <div className="throughput-stat">
                    <span className="ts-label">Pipeline</span>
                    <span className="ts-value green">Optimal</span>
                </div>
                <div className="throughput-stat">
                    <span className="ts-label">Capacity</span>
                    <span className="ts-value purple">Unlimited</span>
                </div>
            </div>
        </motion.div>
    );
};
