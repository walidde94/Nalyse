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
                            <p className="ppb-sub">Advanced Analytics • {maxStorage / 1024}GB Storage • Full Intelligence Suite</p>
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


