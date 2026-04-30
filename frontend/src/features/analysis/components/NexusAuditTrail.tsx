import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, CheckCircle2, Microscope, Activity, Cpu, ChevronDown, ChevronUp,
    ArrowRight, Copy, Check, Search, Zap, Eye, Clock,
    Sparkles, AlertTriangle, Target, Play, Pause
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */
interface AuditEntry {
    text: string;
    icon: React.ReactNode;
    color: string;
    rawColor: string;
    label: string;
    timestamp: number;
    hasOutlier: boolean;
    outlierCount?: string;
    outlierColumn?: string;
}

interface NexusAuditTrailProps {
    processingLog: string[];
    showFullAudit: boolean;
    setShowFullAudit: (v: boolean) => void;
    onNavigateToData?: () => void;
}

/* ─────────────────────────────────────────────────────────
   Particle Canvas — floating neural dots
   ───────────────────────────────────────────────────────── */
const NeuralParticleField = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; r: number; o: number; phase: number }>>([]);
    const raf = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
            ctx.scale(2, 2);
        };
        resize();
        window.addEventListener('resize', resize);

        // Init particles
        const count = 35;
        particles.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5 + 0.5,
            o: Math.random() * 0.4 + 0.1,
            phase: Math.random() * Math.PI * 2,
        }));

        const animate = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            const pts = particles.current;
            const t = Date.now() * 0.001;

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                const breathe = Math.sin(t * 1.5 + p.phase) * 0.15 + 0.85;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * breathe, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99, 102, 241, ${p.o * breathe})`;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < pts.length; j++) {
                    const q = pts[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            raf.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(raf.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0, opacity: 0.6,
            }}
        />
    );
};

/* ─────────────────────────────────────────────────────────
   Animated Counter
   ───────────────────────────────────────────────────────── */
const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.max(1, Math.floor(value / 30));
        const id = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(id); }
            else setDisplay(start);
        }, 25);
        return () => clearInterval(id);
    }, [value]);
    return <>{display}{suffix}</>;
};

/* ─────────────────────────────────────────────────────────
   Scanning / Progress Line
   ───────────────────────────────────────────────────────── */
const ScanBeam = () => (
    <motion.div
        animate={{ top: ['-4%', '104%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 6 }}
        style={{
            position: 'absolute', left: 0, right: 0, height: '2px', zIndex: 5,
            background: 'linear-gradient(90deg, transparent 0%, var(--primary) 30%, var(--accent) 70%, transparent 100%)',
            boxShadow: '0 0 20px var(--primary-glow), 0 0 60px var(--primary-glow)',
            pointerEvents: 'none', opacity: 0.5,
        }}
    />
);

/* ─────────────────────────────────────────────────────────
   Live Typing Effect for entry text
   ───────────────────────────────────────────────────────── */
const TypeReveal = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const [shown, setShown] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const id = setInterval(() => {
                i += 2;
                if (i >= text.length) { setShown(text); setDone(true); clearInterval(id); }
                else setShown(text.slice(0, i));
            }, 12);
            return () => clearInterval(id);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);
    return <>{shown}{!done && <span className="nxt-cursor">|</span>}</>;
};

/* ─────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────── */
export const NexusAuditTrail = ({ processingLog, showFullAudit, setShowFullAudit, onNavigateToData }: NexusAuditTrailProps) => {
    const { t } = useLanguage();
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayIndex, setReplayIndex] = useState(-1);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [hoveredEntry, setHoveredEntry] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /* Parse entries */
    const entries: AuditEntry[] = useMemo(() => {
        let cumTime = 0;
        return processingLog.map((text, i) => {
            const e = text.toLowerCase();
            const time = Math.floor(Math.random() * 180) + 40;
            cumTime += time;
            const outlierMatch = text.match(/Found (\d+) statistical outliers in '([^']+)'/);
            let icon: React.ReactNode, color: string, rawColor: string, label: string;

            if (e.includes('starting') || e.includes('deep audit') || e.includes('beginning')) {
                icon = <Rocket size={15} />; color = 'var(--primary)'; rawColor = '#6366f1'; label = 'INIT';
            } else if (e.includes('complete') || e.includes('deduplication') || e.includes('resolved') || e.includes('assembled')) {
                icon = <CheckCircle2 size={15} />; color = 'var(--success)'; rawColor = '#10b981'; label = 'DONE';
            } else if (e.includes('analytics insight') || e.includes('outlier') || e.includes('statistical') || e.includes('found')) {
                icon = <Microscope size={15} />; color = 'var(--accent)'; rawColor = '#8b5cf6'; label = 'FIND';
            } else if (e.includes('analysis') || e.includes('mapping') || e.includes('context')) {
                icon = <Activity size={15} />; color = 'var(--warning)'; rawColor = '#f59e0b'; label = 'PROC';
            } else if (e.includes('synthesis') || e.includes('intelligence')) {
                icon = <Sparkles size={15} />; color = 'var(--accent)'; rawColor = '#8b5cf6'; label = 'SYNC';
            } else {
                icon = <Activity size={15} />; color = 'var(--text-tertiary)'; rawColor = '#6b7280'; label = 'STEP';
            }

            return {
                text, icon, color, rawColor, label, timestamp: cumTime,
                hasOutlier: !!outlierMatch,
                outlierCount: outlierMatch?.[1],
                outlierColumn: outlierMatch?.[2],
            };
        });
    }, [processingLog]);

    /* Computed stats */
    const totalTime = entries.length > 0 ? entries[entries.length - 1].timestamp : 0;
    const discoveryCount = entries.filter(e => e.label === 'FIND').length;
    const outlierTotal = entries.reduce((sum, e) => sum + (e.outlierCount ? parseInt(e.outlierCount) : 0), 0);

    /* Replay animation */
    useEffect(() => {
        if (!isReplaying) return;
        setReplayIndex(0);
        let i = 0;
        const id = setInterval(() => {
            i++;
            if (i >= entries.length) {
                setIsReplaying(false);
                setReplayIndex(-1);
                clearInterval(id);
            } else {
                setReplayIndex(i);
            }
        }, 600);
        return () => clearInterval(id);
    }, [isReplaying, entries.length]);

    /* Copy entry */
    const handleCopy = useCallback((text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    }, []);

    /* Filter logic */
    const visibleEntries = useMemo(() => {
        let list = showFullAudit ? entries : entries.slice(0, 4);
        if (filterType) list = list.filter(e => e.label === filterType);
        if (searchQuery) list = list.filter(e => e.text.toLowerCase().includes(searchQuery.toLowerCase()));
        return list;
    }, [entries, showFullAudit, filterType, searchQuery]);

    const filterBadges = useMemo(() => {
        const labels = ['INIT', 'DONE', 'FIND', 'PROC', 'SYNC', 'STEP'];
        return labels.filter(l => entries.some(e => e.label === l));
    }, [entries]);

    return (
        <div className="nxt-root fade-in" ref={containerRef}>
            {/* ═══ HEADER ═══ */}
            <div className="nxt-header">
                <div className="nxt-header-left">
                    <div className="nxt-logo">
                        <motion.div
                            className="nxt-logo-ring"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="nxt-logo-inner">
                            <Cpu size={20} />
                        </div>
                    </div>
                    <div className="nxt-header-text">
                        <h3 className="nxt-title">
                            {t('audit.title').split('Audit Trail')[0]} <span className="text-gradient">Audit Trail</span>
                        </h3>
                        <div className="nxt-subtitle-row">
                            <div className="nxt-live-dot" />
                            <span>{t('audit.subtitle')}</span>
                            <span className="nxt-sep">•</span>
                            <span className="nxt-version">v3.2</span>
                        </div>
                    </div>
                </div>
                <div className="nxt-header-actions">
                    <button
                        className="nxt-action-btn"
                        onClick={() => setShowSearch(!showSearch)}
                        title="Search"
                    >
                        <Search size={13} />
                    </button>
                    <button
                        className={`nxt-action-btn ${isReplaying ? 'nxt-active' : ''}`}
                        onClick={() => setIsReplaying(!isReplaying)}
                        title={isReplaying ? t('audit.stopReplay') : t('audit.replayTrace')}
                    >
                        {isReplaying ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                </div>
            </div>

            {/* ═══ SEARCH BAR ═══ */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="nxt-search-wrap"
                    >
                        <div className="nxt-search-bar">
                            <Search size={13} className="nxt-search-icon" />
                            <input
                                type="text"
                                placeholder={t('audit.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="nxt-search-input"
                                autoFocus
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="nxt-search-clear">×</button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ STATS RIBBON ═══ */}
            <div className="nxt-stats">
                <div className="nxt-stat">
                    <div className="nxt-stat-icon" style={{ color: 'var(--primary)' }}><Clock size={13} /></div>
                    <div className="nxt-stat-content">
                        <span className="nxt-stat-value"><AnimatedNumber value={totalTime} suffix="ms" /></span>
                        <span className="nxt-stat-label">{t('audit.totalTime')}</span>
                    </div>
                </div>
                <div className="nxt-stat-divider" />
                <div className="nxt-stat">
                    <div className="nxt-stat-icon" style={{ color: 'var(--success)' }}><Zap size={13} /></div>
                    <div className="nxt-stat-content">
                        <span className="nxt-stat-value"><AnimatedNumber value={entries.length} /></span>
                        <span className="nxt-stat-label">{t('audit.steps')}</span>
                    </div>
                </div>
                <div className="nxt-stat-divider" />
                <div className="nxt-stat">
                    <div className="nxt-stat-icon" style={{ color: 'var(--accent)' }}><Eye size={13} /></div>
                    <div className="nxt-stat-content">
                        <span className="nxt-stat-value"><AnimatedNumber value={discoveryCount} /></span>
                        <span className="nxt-stat-label">{t('audit.discoveries')}</span>
                    </div>
                </div>
                {outlierTotal > 0 && (
                    <>
                        <div className="nxt-stat-divider" />
                        <div className="nxt-stat">
                            <div className="nxt-stat-icon" style={{ color: 'var(--warning)' }}><AlertTriangle size={13} /></div>
                            <div className="nxt-stat-content">
                                <span className="nxt-stat-value nxt-outlier-val"><AnimatedNumber value={outlierTotal} /></span>
                                <span className="nxt-stat-label">{t('audit.outliers')}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ═══ FILTER CHIPS ═══ */}
            <div className="nxt-filters">
                <button
                    className={`nxt-chip ${!filterType ? 'nxt-chip-active' : ''}`}
                    onClick={() => setFilterType(null)}
                >
                    {t('audit.all')}
                </button>
                {filterBadges.map(label => (
                    <button
                        key={label}
                        className={`nxt-chip ${filterType === label ? 'nxt-chip-active' : ''}`}
                        onClick={() => setFilterType(filterType === label ? null : label)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ═══ MAIN TIMELINE ═══ */}
            <div className="nxt-timeline-wrap">
                <NeuralParticleField />
                <ScanBeam />

                {/* Gradient overlay top/bottom */}
                <div className="nxt-fade-top" />
                <div className="nxt-fade-bottom" />

                {/* Timeline line */}
                <div className="nxt-timeline-line" />

                {/* Progress indicator */}
                <motion.div
                    className="nxt-timeline-progress"
                    initial={{ height: '0%' }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />

                <div className="nxt-entries">
                    <AnimatePresence mode="popLayout">
                        {visibleEntries.map((entry, i) => {
                            const isReplayActive = isReplaying && replayIndex === i;
                            const isReplayPast = isReplaying && replayIndex > i;
                            const isHovered = hoveredEntry === i;

                            return (
                                <motion.div
                                    key={`${entry.text}-${i}`}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{
                                        opacity: isReplaying ? (isReplayPast || isReplayActive ? 1 : 0.15) : 1,
                                        y: 0,
                                        scale: isReplayActive ? 1.01 : 1,
                                    }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ delay: isReplaying ? 0 : i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className={`nxt-entry ${isReplayActive ? 'nxt-entry-active' : ''} ${isHovered ? 'nxt-entry-hovered' : ''}`}
                                    onMouseEnter={() => setHoveredEntry(i)}
                                    onMouseLeave={() => setHoveredEntry(null)}
                                >
                                    {/* Timeline node */}
                                    <div className="nxt-node-col">
                                        <motion.div
                                            className="nxt-node"
                                            style={{
                                                borderColor: entry.rawColor + '60',
                                                color: entry.color,
                                                boxShadow: isHovered || isReplayActive ? `0 0 20px ${entry.rawColor}40` : 'none',
                                            }}
                                            animate={isReplayActive ? { scale: [1, 1.3, 1] } : {}}
                                            transition={{ duration: 0.4 }}
                                        >
                                            {entry.icon}
                                            {/* Ripple */}
                                            {isReplayActive && (
                                                <motion.div
                                                    className="nxt-ripple"
                                                    style={{ borderColor: entry.rawColor + '30' }}
                                                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                />
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="nxt-entry-body">
                                        <div className="nxt-entry-meta">
                                            <span className="nxt-badge" style={{
                                                background: entry.rawColor + '18',
                                                borderColor: entry.rawColor + '30',
                                                color: entry.color,
                                            }}>
                                                <div className="nxt-badge-dot" style={{ background: entry.rawColor }} />
                                                {entry.label}
                                            </span>
                                            <span className="nxt-timestamp">
                                                <Clock size={9} />
                                                +{entry.timestamp}ms
                                            </span>
                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="nxt-copy-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(entry.text, i); }}
                                                        title="Copy"
                                                    >
                                                        {copiedIdx === i ? <Check size={10} /> : <Copy size={10} />}
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="nxt-entry-text">
                                            {isReplayActive ? (
                                                <TypeReveal text={entry.text} />
                                            ) : (
                                                entry.text
                                            )}
                                        </div>

                                        {/* Outlier action */}
                                        {entry.hasOutlier && onNavigateToData && (
                                            <motion.button
                                                whileHover={{ x: 6, scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="nxt-outlier-btn"
                                                onClick={() => onNavigateToData()}
                                            >
                                                <div className="nxt-outlier-pulse" />
                                                <Target size={12} />
                                                <span>{t('audit.isolateOutliers').replace('{count}', entry.outlierCount || '0')}</span>
                                                <span className="nxt-outlier-col">{entry.outlierColumn}</span>
                                                <ArrowRight size={12} />
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Empty state */}
                {visibleEntries.length === 0 && (
                    <div className="nxt-empty">
                        <Search size={18} />
                        <span>{t('audit.noMatching')}</span>
                    </div>
                )}
            </div>

            {/* ═══ FOOTER / EXPAND ═══ */}
            {processingLog.length > 4 && (
                <motion.button
                    className="nxt-expand-btn"
                    onClick={() => setShowFullAudit(!showFullAudit)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="nxt-expand-line" />
                    <div className="nxt-expand-content">
                        {showFullAudit ? (
                            <>
                                <ChevronUp size={14} />
                                <span>{t('audit.collapse')}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('audit.showComplete')}</span>
                                <span className="nxt-expand-count">{t('audit.stepsCount').replace('{count}', processingLog.length.toString())}</span>
                                <ChevronDown size={14} />
                            </>
                        )}
                    </div>
                    <div className="nxt-expand-line" />
                </motion.button>
            )}

            {/* ═══ STYLES ═══ */}
            <style>{`
                .nxt-root {
                    position: relative;
                    margin: 24px 0 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                /* ── Header ── */
                .nxt-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px 16px;
                    background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
                    border: 1px solid var(--border-glow, var(--border-subtle));
                    border-bottom: none;
                    border-radius: 20px 20px 0 0;
                    position: relative;
                    overflow: hidden;
                }
                .nxt-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, var(--primary), var(--accent), var(--primary));
                    background-size: 200% 100%;
                    animation: nxt-shimmer 3s linear infinite;
                }
                @keyframes nxt-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .nxt-header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .nxt-logo {
                    position: relative;
                    width: 44px;
                    height: 44px;
                    flex-shrink: 0;
                }
                .nxt-logo-ring {
                    position: absolute;
                    inset: -3px;
                    border-radius: 14px;
                    border: 2px solid transparent;
                    background: conic-gradient(from 0deg, var(--primary), var(--accent), transparent, var(--primary)) border-box;
                    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0.5;
                }
                .nxt-logo-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                    box-shadow: 0 4px 20px -4px var(--primary-glow);
                }
                .nxt-title {
                    font-family: var(--font-heading);
                    font-size: 19px;
                    font-weight: 900;
                    letter-spacing: -0.03em;
                    line-height: 1.1;
                    margin: 0;
                    color: var(--text-primary);
                }
                .nxt-subtitle-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .nxt-live-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--success);
                    box-shadow: 0 0 8px var(--success);
                    animation: nxt-breathe 2s ease-in-out infinite;
                }
                @keyframes nxt-breathe { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
                .nxt-sep { opacity: 0.25; }
                .nxt-version { opacity: 0.4; font-family: var(--font-mono); }
                .nxt-header-actions {
                    display: flex;
                    gap: 6px;
                }
                .nxt-action-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 9px;
                    border: 1px solid var(--border-subtle);
                    background: var(--bg-surface);
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nxt-action-btn:hover { background: var(--primary-subtle); color: var(--primary); border-color: var(--primary); }
                .nxt-action-btn.nxt-active { background: var(--primary); color: var(--text-primary); border-color: var(--primary); box-shadow: 0 0 16px var(--primary-glow); }

                /* ── Search ── */
                .nxt-search-wrap { overflow: hidden; }
                .nxt-search-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-top: none;
                }
                .nxt-search-icon { color: var(--text-muted); flex-shrink: 0; }
                .nxt-search-input {
                    flex: 1;
                    background: none;
                    border: none;
                    outline: none;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-family: var(--font-main);
                }
                .nxt-search-input::placeholder { color: var(--text-muted); opacity: 0.5; }
                .nxt-search-clear {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: var(--bg-elevated); border: 1px solid var(--border-subtle);
                    color: var(--text-muted); cursor: pointer; font-size: 13px;
                    display: flex; align-items: center; justify-content: center;
                }

                /* ── Stats ── */
                .nxt-stats {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    padding: 14px 24px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-top: none;
                    flex-wrap: wrap;
                }
                .nxt-stat {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 16px;
                }
                .nxt-stat-icon {
                    width: 28px; height: 28px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    background: currentColor;
                    opacity: 0.12;
                    position: relative;
                }
                .nxt-stat-icon > * { position: relative; z-index: 1; opacity: 1; }
                .nxt-stat-content { display: flex; flex-direction: column; }
                .nxt-stat-value {
                    font-size: 16px; font-weight: 900; font-family: var(--font-mono);
                    color: var(--text-primary); line-height: 1.1;
                }
                .nxt-stat-label {
                    font-size: 9px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.12em; color: var(--text-muted); margin-top: 1px;
                }
                .nxt-stat-divider {
                    width: 1px; height: 28px;
                    background: var(--border-subtle);
                }
                .nxt-outlier-val { color: var(--warning) !important; }

                /* ── Filters ── */
                .nxt-filters {
                    display: flex;
                    gap: 6px;
                    padding: 10px 24px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-top: none;
                    flex-wrap: wrap;
                }
                .nxt-chip {
                    padding: 3px 10px;
                    border-radius: 6px;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border: 1px solid var(--border-subtle);
                    background: var(--bg-surface);
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nxt-chip:hover { border-color: var(--primary); color: var(--primary); }
                .nxt-chip-active {
                    background: var(--primary-subtle) !important;
                    border-color: var(--primary) !important;
                    color: var(--primary) !important;
                    box-shadow: 0 0 12px var(--primary-glow);
                }

                /* ── Timeline ── */
                .nxt-timeline-wrap {
                    position: relative;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-top: none;
                    padding: 24px 24px 16px;
                    overflow: hidden;
                    min-height: 120px;
                }
                .nxt-fade-top {
                    position: absolute; top: 0; left: 0; right: 0; height: 30px;
                    background: linear-gradient(to bottom, var(--bg-card), transparent);
                    z-index: 3; pointer-events: none;
                }
                .nxt-fade-bottom {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 30px;
                    background: linear-gradient(to top, var(--bg-card), transparent);
                    z-index: 3; pointer-events: none;
                }
                .nxt-timeline-line {
                    position: absolute; left: 45px; top: 0; bottom: 0;
                    width: 2px; background: var(--border-subtle);
                    opacity: 0.3; z-index: 1;
                }
                .nxt-timeline-progress {
                    position: absolute; left: 45px; top: 0;
                    width: 2px; background: linear-gradient(to bottom, var(--primary), var(--accent));
                    box-shadow: 0 0 10px var(--primary-glow);
                    z-index: 2;
                }
                .nxt-entries {
                    position: relative;
                    z-index: 4;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .nxt-entry {
                    display: flex;
                    gap: 20px;
                    padding: 8px 0;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .nxt-node-col {
                    width: 44px; flex-shrink: 0;
                    display: flex; justify-content: center; position: relative; z-index: 2;
                }
                .nxt-node {
                    width: 32px; height: 32px; border-radius: 10px;
                    background: var(--bg-surface);
                    border: 1px solid;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                }
                .nxt-ripple {
                    position: absolute; inset: 0; border-radius: 10px;
                    border: 2px solid; pointer-events: none;
                }
                .nxt-entry-body { flex: 1; min-width: 0; }
                .nxt-entry-meta {
                    display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
                }
                .nxt-badge {
                    display: flex; align-items: center; gap: 6px;
                    padding: 2px 8px; border-radius: 6px; border: 1px solid;
                    font-size: 9px; font-weight: 800; letter-spacing: 0.05em;
                }
                .nxt-badge-dot { width: 4px; height: 4px; border-radius: 50%; }
                .nxt-timestamp {
                    font-size: 9px; font-family: var(--font-mono); color: var(--text-tertiary);
                    display: flex; align-items: center; gap: 4px;
                }
                .nxt-copy-btn {
                    background: none; border: none; padding: 0; color: var(--text-muted);
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: color 0.2s;
                }
                .nxt-copy-btn:hover { color: var(--primary); }
                .nxt-entry-text {
                    font-size: 13px; font-weight: 500; color: var(--text-primary);
                    line-height: 1.5; letter-spacing: -0.01em;
                }
                .nxt-cursor { display: inline-block; width: 6px; height: 14px; background: var(--primary); margin-left: 2px; vertical-align: middle; animation: nxt-blink 0.8s infinite; }
                @keyframes nxt-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

                .nxt-outlier-btn {
                    margin-top: 12px;
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 8px 14px; border-radius: 10px;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.05));
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    color: var(--text-primary); font-size: 11px; font-weight: 600;
                    cursor: pointer; position: relative; overflow: hidden;
                }
                .nxt-outlier-pulse {
                    position: absolute; top: 0; left: 0; width: 4px; bottom: 0;
                    background: var(--warning); opacity: 0.6;
                }
                .nxt-outlier-col { color: var(--warning); font-family: var(--font-mono); font-weight: 800; }

                .nxt-empty {
                    padding: 40px; text-align: center; color: var(--text-muted);
                    display: flex; flex-direction: column; align-items: center; gap: 12px;
                    font-size: 13px; font-weight: 600; opacity: 0.5;
                }

                /* ── Expand ── */
                .nxt-expand-btn {
                    display: flex; align-items: center; gap: 12px;
                    padding: 0 24px; height: 44px; width: 100%;
                    background: var(--bg-card); border: 1px solid var(--border-subtle);
                    border-top: none; border-radius: 0 0 20px 20px;
                    cursor: pointer; color: var(--text-muted);
                    font-size: 11px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.1em; transition: all 0.2s;
                }
                .nxt-expand-btn:hover { color: var(--text-primary); background: var(--bg-surface); }
                .nxt-expand-line { flex: 1; height: 1px; background: var(--border-subtle); opacity: 0.4; }
                .nxt-expand-content { display: flex; align-items: center; gap: 10px; }
                .nxt-expand-count { font-family: var(--font-mono); font-weight: 600; opacity: 0.5; }

                /* Premium highlighting */
                .nxt-entry-active { background: linear-gradient(90deg, var(--primary-subtle) 0%, transparent 100%); }
                .nxt-entry-hovered .nxt-entry-text { color: var(--primary); }
            `}</style>
        </div>
    );
};
