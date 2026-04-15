import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, type MotionValue } from 'framer-motion';
import {
    ArrowRight, Database, ArrowRightLeft, Building2,
    Zap, ChevronDown, Upload, Cpu, BarChart3,
    Lightbulb, TrendingUp, LayoutDashboard, Search,
    Shield, BrainCircuit, Sparkles
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

/* ═══════════════════════════════════════════════════════════════
   NALYSE LANDING PAGE — Apple Keynote-Style
   
   Scroll-driven storytelling with sticky sections, parallax,
   and timeline-driven transitions. GPU-accelerated, 60fps.
   
   Structure:
   1. Hero          — Full viewport, fade/scale on scroll
   2. Chapter 1     — "Understand" — Analytics Studio
   3. Chapter 2     — "Predict"    — Forecasting & ML
   4. Chapter 3     — "Decide"     — BI & Strategic Board
   5. Process Flow  — Interactive pipeline visualization
   6. Trust Strip   — Capability metrics
   7. Deep Dive     — Smart Lens 3-step walkthrough
   8. Final CTA     — Strong close
   ═══════════════════════════════════════════════════════════════ */

const SPRING = { stiffness: 80, damping: 28, restDelta: 0.001 };
const FAST_SPRING = { stiffness: 120, damping: 30, restDelta: 0.001 };

// ─── VISUAL: Analytics Heat Grid ─────────────────────────────
const GRID_INTENSITIES = [
    0.2, 0.5, 0.9, 0.3, 0.7, 0.4, 0.8, 0.6,
    0.6, 0.3, 0.7, 0.9, 0.2, 0.8, 0.5, 0.3,
    0.4, 0.8, 0.2, 0.6, 0.9, 0.3, 0.7, 0.5,
    0.7, 0.4, 0.6, 0.3, 0.8, 0.9, 0.2, 0.6,
    0.3, 0.9, 0.5, 0.7, 0.4, 0.6, 0.8, 0.2,
];

const AnalyticsVisual = ({ progress }: { progress: MotionValue<number> }) => {
    const gridOp = useSpring(useTransform(progress, [0.08, 0.25], [0, 1]), SPRING);
    const gridScale = useSpring(useTransform(progress, [0.08, 0.3], [0.85, 1]), SPRING);
    const highlightOp = useSpring(useTransform(progress, [0.45, 0.65], [0, 1]), SPRING);
    const badgeOp = useSpring(useTransform(progress, [0.6, 0.75], [0, 1]), SPRING);
    const badgeY = useSpring(useTransform(progress, [0.6, 0.75], [20, 0]), SPRING);

    return (
        <motion.div className="lp-vis" style={{ opacity: gridOp, scale: gridScale }}>
            <div className="lp-heatgrid">
                {GRID_INTENSITIES.map((intensity, i) => (
                    <div
                        key={i}
                        className="lp-heatcell"
                        style={{ opacity: intensity, animationDelay: `${i * 40}ms` }}
                    />
                ))}
            </div>
            {/* Highlight overlay — 3 correlated cells glow */}
            <motion.div className="lp-grid-highlights" style={{ opacity: highlightOp }}>
                <div className="lp-highlight-dot" style={{ top: '12%', left: '30%' }} />
                <div className="lp-highlight-dot" style={{ top: '52%', left: '55%' }} />
                <div className="lp-highlight-dot" style={{ top: '32%', left: '80%' }} />
                <svg className="lp-highlight-lines" viewBox="0 0 300 200">
                    <line x1="90" y1="30" x2="165" y2="110" stroke="url(#hlGrad)" strokeWidth="1.5" />
                    <line x1="165" y1="110" x2="240" y2="70" stroke="url(#hlGrad)" strokeWidth="1.5" />
                    <defs>
                        <linearGradient id="hlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>
            <motion.div className="lp-vis-badge" style={{ opacity: badgeOp, y: badgeY }}>
                <Search size={14} /> Pattern Detected
            </motion.div>
        </motion.div>
    );
};

// ─── VISUAL: Forecast Trend Chart ────────────────────────────
const ForecastVisual = ({ progress }: { progress: MotionValue<number> }) => {
    const axisOp = useSpring(useTransform(progress, [0.05, 0.2], [0, 1]), SPRING);
    const trendLen = useSpring(useTransform(progress, [0.15, 0.5], [0, 1]), FAST_SPRING);
    const forecastOp = useSpring(useTransform(progress, [0.5, 0.7], [0, 1]), SPRING);
    const bandOp = useSpring(useTransform(progress, [0.55, 0.75], [0, 0.15]), SPRING);
    const dotScale = useSpring(useTransform(progress, [0.65, 0.8], [0, 1]), SPRING);

    return (
        <motion.div className="lp-vis">
            <svg viewBox="0 0 400 260" className="lp-chart-svg" fill="none">
                {/* Axes */}
                <motion.line x1="45" y1="15" x2="45" y2="235" stroke="var(--text-muted)" strokeWidth="1" style={{ opacity: axisOp }} />
                <motion.line x1="45" y1="235" x2="385" y2="235" stroke="var(--text-muted)" strokeWidth="1" style={{ opacity: axisOp }} />
                {/* Grid lines */}
                {[60, 110, 160, 210].map(y => (
                    <motion.line key={y} x1="45" y1={y} x2="385" y2={y} stroke="var(--text-muted)" strokeWidth="0.3" style={{ opacity: axisOp }} />
                ))}
                {/* Historical trend line */}
                <motion.path
                    d="M 55 200 C 85 190, 105 170, 130 175 S 170 140, 200 150 S 240 110, 270 100 S 310 85, 330 70"
                    stroke="url(#trendGrad)" strokeWidth="2.5" strokeLinecap="round"
                    style={{ pathLength: trendLen }}
                />
                {/* Forecast extension */}
                <motion.path
                    d="M 330 70 C 345 60, 360 52, 380 42"
                    stroke="#06b6d4" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round"
                    style={{ opacity: forecastOp }}
                />
                {/* Confidence band */}
                <motion.path
                    d="M 330 70 C 345 50, 360 38, 380 25 L 380 60 C 360 65, 345 72, 330 70 Z"
                    fill="#06b6d4" style={{ opacity: bandOp }}
                />
                {/* Forecast endpoint dot */}
                <motion.circle cx="380" cy="42" r="5" fill="#06b6d4" style={{ scale: dotScale, opacity: forecastOp }} />
                <motion.circle cx="380" cy="42" r="12" fill="none" stroke="#06b6d4" strokeWidth="1" style={{ scale: dotScale, opacity: forecastOp }} />
                <defs>
                    <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>
            <motion.div className="lp-vis-badge" style={{ opacity: forecastOp, y: useSpring(useTransform(progress, [0.5, 0.7], [16, 0]), SPRING) }}>
                <TrendingUp size={14} /> Forecast Active
            </motion.div>
        </motion.div>
    );
};

// ─── VISUAL: Dashboard Bento Preview ─────────────────────────
const DashboardVisual = ({ progress }: { progress: MotionValue<number> }) => {
    const card1Op = useSpring(useTransform(progress, [0.1, 0.25], [0, 1]), SPRING);
    const card1Y = useSpring(useTransform(progress, [0.1, 0.25], [30, 0]), SPRING);
    const card2Op = useSpring(useTransform(progress, [0.2, 0.35], [0, 1]), SPRING);
    const card2Y = useSpring(useTransform(progress, [0.2, 0.35], [30, 0]), SPRING);
    const card3Op = useSpring(useTransform(progress, [0.3, 0.45], [0, 1]), SPRING);
    const card3Y = useSpring(useTransform(progress, [0.3, 0.45], [30, 0]), SPRING);
    const card4Op = useSpring(useTransform(progress, [0.4, 0.55], [0, 1]), SPRING);
    const card4Y = useSpring(useTransform(progress, [0.4, 0.55], [30, 0]), SPRING);
    const glowOp = useSpring(useTransform(progress, [0.6, 0.8], [0, 1]), SPRING);

    return (
        <motion.div className="lp-vis lp-dash-vis">
            <div className="lp-dash-grid">
                <motion.div className="lp-dash-card lp-dash-wide" style={{ opacity: card1Op, y: card1Y }}>
                    <div className="lp-dash-label">Revenue Trend</div>
                    <div className="lp-dash-bars">
                        {[65, 45, 80, 55, 90, 70, 95].map((h, i) => (
                            <div key={i} className="lp-dash-bar" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </motion.div>
                <motion.div className="lp-dash-card" style={{ opacity: card2Op, y: card2Y }}>
                    <div className="lp-dash-label">Conversion</div>
                    <motion.div className="lp-dash-metric" style={{ opacity: glowOp }}>94.2<span>%</span></motion.div>
                </motion.div>
                <motion.div className="lp-dash-card" style={{ opacity: card3Op, y: card3Y }}>
                    <div className="lp-dash-label">Status</div>
                    <div className="lp-dash-status">
                        <div className="lp-dash-dot" /><span>All Systems Active</span>
                    </div>
                </motion.div>
                <motion.div className="lp-dash-card lp-dash-wide" style={{ opacity: card4Op, y: card4Y }}>
                    <div className="lp-dash-label">Forecast Accuracy</div>
                    <div className="lp-dash-sparkline">
                        <svg viewBox="0 0 200 50" fill="none">
                            <path d="M 0 40 C 30 35, 50 20, 80 25 S 120 10, 150 15 S 180 8, 200 5" stroke="#10b981" strokeWidth="2" />
                        </svg>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// ─── VISUAL: Process Pipeline ────────────────────────────────
const PIPELINE_STEPS = [
    { icon: Upload, label: 'Connect', color: '#6366f1' },
    { icon: Cpu, label: 'Process', color: '#8b5cf6' },
    { icon: Search, label: 'Analyze', color: '#a78bfa' },
    { icon: TrendingUp, label: 'Predict', color: '#06b6d4' },
    { icon: Zap, label: 'Execute', color: '#10b981' },
];

const ProcessVisual = ({ progress }: { progress: MotionValue<number> }) => {
    return (
        <div className="lp-pipeline">
            {PIPELINE_STEPS.map((step, i) => {
                const start = i * 0.15 + 0.1;
                const nodeOp = useSpring(useTransform(progress, [start, start + 0.12], [0.2, 1]), SPRING);
                const nodeScale = useSpring(useTransform(progress, [start, start + 0.12], [0.8, 1]), SPRING);
                const lineLen = useSpring(useTransform(progress, [start + 0.06, start + 0.18], [0, 1]), FAST_SPRING);
                const glowOp = useSpring(useTransform(progress, [start + 0.05, start + 0.15], [0, 0.5]), SPRING);
                const Icon = step.icon;
                return (
                    <div key={step.label} className="lp-pipe-step">
                        <motion.div
                            className="lp-pipe-node"
                            style={{ opacity: nodeOp, scale: nodeScale, boxShadow: useTransform(glowOp, v => `0 0 ${v * 40}px ${step.color}`) }}
                        >
                            <Icon size={22} style={{ color: step.color }} />
                        </motion.div>
                        <motion.span className="lp-pipe-label" style={{ opacity: nodeOp }}>{step.label}</motion.span>
                        {i < PIPELINE_STEPS.length - 1 && (
                            <motion.div className="lp-pipe-line" style={{ scaleX: lineLen, background: `linear-gradient(90deg, ${step.color}, ${PIPELINE_STEPS[i + 1].color})` }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── VISUAL: Deep Dive Steps ─────────────────────────────────
const DEEP_STEPS = [
    { num: '01', title: 'Upload your data', desc: 'Drag and drop CSV, Excel, or JSON files. Schema is auto-detected in milliseconds.', icon: Upload, color: '#6366f1' },
    { num: '02', title: 'AI finds patterns', desc: 'Smart Lens scans every column, detects anomalies, correlations, and statistical patterns automatically.', icon: BrainCircuit, color: '#8b5cf6' },
    { num: '03', title: 'Get actionable insights', desc: 'Receive clear, prioritized recommendations with confidence scores — ready for strategic decisions.', icon: Lightbulb, color: '#10b981' },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const LandingView = ({ onGetStarted }: { onGetStarted: () => void }) => {
    // ── Hero refs ──
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroOp = useSpring(useTransform(heroP, [0, 0.5], [1, 0]), SPRING);
    const heroScale = useSpring(useTransform(heroP, [0, 0.5], [1, 0.94]), SPRING);
    const heroY = useSpring(useTransform(heroP, [0, 0.5], [0, -60]), SPRING);

    // ── Chapter refs ──
    const ch1Ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress: ch1P } = useScroll({ target: ch1Ref, offset: ['start start', 'end end'] });

    const ch2Ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress: ch2P } = useScroll({ target: ch2Ref, offset: ['start start', 'end end'] });

    const ch3Ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress: ch3P } = useScroll({ target: ch3Ref, offset: ['start start', 'end end'] });

    // ── Process ref ──
    const processRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: processP } = useScroll({ target: processRef, offset: ['start start', 'end end'] });

    // ── Deep dive ref ──
    const deepRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: deepP } = useScroll({ target: deepRef, offset: ['start start', 'end end'] });

    // ── Chapter text animation factory ──
    const chapterText = (p: MotionValue<number>) => ({
        tagOp: useSpring(useTransform(p, [0.02, 0.12], [0, 1]), SPRING),
        titleOp: useSpring(useTransform(p, [0.05, 0.18], [0, 1]), SPRING),
        titleY: useSpring(useTransform(p, [0.05, 0.18], [50, 0]), SPRING),
        descOp: useSpring(useTransform(p, [0.1, 0.22], [0, 1]), SPRING),
        descY: useSpring(useTransform(p, [0.1, 0.22], [30, 0]), SPRING),
        fadeOut: useSpring(useTransform(p, [0.85, 1], [1, 0]), SPRING),
    });

    const t1 = chapterText(ch1P);
    const t2 = chapterText(ch2P);
    const t3 = chapterText(ch3P);

    // ── Deep dive step animations ──
    const deepSteps = DEEP_STEPS.map((_, i) => {
        const start = i * 0.28 + 0.05;
        return {
            op: useSpring(useTransform(deepP, [start, start + 0.12, start + 0.25, start + 0.3], [0, 1, 1, i < 2 ? 0 : 1]), SPRING),
            y: useSpring(useTransform(deepP, [start, start + 0.12], [40, 0]), SPRING),
            iconScale: useSpring(useTransform(deepP, [start + 0.05, start + 0.15], [0.6, 1]), FAST_SPRING),
        };
    });

    return (
        <div className="lp">
            {/* ═══ AMBIENT BACKGROUND ═══ */}
            <div className="lp-ambient">
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />
                <div className="lp-grain" />
            </div>

            {/* ═══════════════════════════════════════════════════════
                SECTION 1 — HERO
                Full viewport, fades and scales down on scroll
            ═══════════════════════════════════════════════════════ */}
            <motion.section ref={heroRef} className="lp-hero" style={{ opacity: heroOp, scale: heroScale, y: heroY }}>
                <div className="lp-hero-inner">
                    <motion.div
                        className="lp-hero-chip"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Sparkles size={13} /> Intelligent Data Analytics
                    </motion.div>

                    <motion.h1
                        className="lp-hero-h1"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Turn raw data into
                        <br />
                        <span className="lp-glow-text">strategic intelligence.</span>
                    </motion.h1>

                    <motion.p
                        className="lp-hero-p"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                    >
                        From exploratory analysis to predictive forecasting — one platform
                        for your entire data lifecycle.
                    </motion.p>

                    <motion.div
                        className="lp-hero-cta"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                    >
                        <button className="lp-btn" onClick={onGetStarted}>
                            Start Analyzing <ArrowRight size={18} />
                        </button>
                    </motion.div>

                    <motion.div
                        className="lp-scroll-cue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.35 }}
                        transition={{ delay: 2, duration: 1.5 }}
                    >
                        <ChevronDown size={18} />
                    </motion.div>
                </div>
            </motion.section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 2 — CHAPTER: UNDERSTAND
                Sticky left text + Analytics heat grid visual
            ═══════════════════════════════════════════════════════ */}
            <section ref={ch1Ref} className="lp-chapter">
                <div className="lp-chapter-sticky">
                    <motion.div className="lp-ch-text" style={{ opacity: t1.fadeOut }}>
                        <motion.span className="lp-tag" style={{ opacity: t1.tagOp, color: '#8b5cf6' }}>ANALYTICS STUDIO</motion.span>
                        <motion.h2 className="lp-ch-title" style={{ opacity: t1.titleOp, y: t1.titleY }}>
                            See what others miss.
                        </motion.h2>
                        <motion.p className="lp-ch-desc" style={{ opacity: t1.descOp, y: t1.descY }}>
                            Six analysis engines work together — real-time SQL,
                            interactive visualizations, statistical correlation, anomaly
                            detection, and financial risk modeling — all on your live data.
                        </motion.p>
                    </motion.div>
                    <div className="lp-ch-visual">
                        <AnalyticsVisual progress={ch1P} />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 3 — CHAPTER: PREDICT
                Sticky left text + Forecast trend chart
            ═══════════════════════════════════════════════════════ */}
            <section ref={ch2Ref} className="lp-chapter">
                <div className="lp-chapter-sticky">
                    <motion.div className="lp-ch-text" style={{ opacity: t2.fadeOut }}>
                        <motion.span className="lp-tag" style={{ opacity: t2.tagOp, color: '#06b6d4' }}>PREDICTIVE INTELLIGENCE</motion.span>
                        <motion.h2 className="lp-ch-title" style={{ opacity: t2.titleOp, y: t2.titleY }}>
                            Know what happens next.
                        </motion.h2>
                        <motion.p className="lp-ch-desc" style={{ opacity: t2.descOp, y: t2.descY }}>
                            Machine learning forecasting, geospatial mapping,
                            and AutoML optimization — purpose-built for
                            teams who need to see around corners.
                        </motion.p>
                    </motion.div>
                    <div className="lp-ch-visual">
                        <ForecastVisual progress={ch2P} />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 4 — CHAPTER: DECIDE
                Sticky left text + Dashboard bento preview
            ═══════════════════════════════════════════════════════ */}
            <section ref={ch3Ref} className="lp-chapter">
                <div className="lp-chapter-sticky">
                    <motion.div className="lp-ch-text" style={{ opacity: t3.fadeOut }}>
                        <motion.span className="lp-tag" style={{ opacity: t3.tagOp, color: '#f59e0b' }}>BUSINESS INTELLIGENCE</motion.span>
                        <motion.h2 className="lp-ch-title" style={{ opacity: t3.titleOp, y: t3.titleY }}>
                            From data to<br />boardroom.
                        </motion.h2>
                        <motion.p className="lp-ch-desc" style={{ opacity: t3.descOp, y: t3.descY }}>
                            Executive dashboards, strategic boards, and a visual
                            architect that aligns your entire organization around
                            a single source of truth.
                        </motion.p>
                    </motion.div>
                    <div className="lp-ch-visual">
                        <DashboardVisual progress={ch3P} />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 5 — INTERACTIVE PROCESS VISUALIZATION
                Pipeline flow that illuminates step-by-step on scroll
            ═══════════════════════════════════════════════════════ */}
            <section ref={processRef} className="lp-process">
                <div className="lp-process-sticky">
                    <motion.div
                        className="lp-process-header"
                        style={{
                            opacity: useSpring(useTransform(processP, [0, 0.12], [0, 1]), SPRING),
                            y: useSpring(useTransform(processP, [0, 0.12], [40, 0]), SPRING),
                        }}
                    >
                        <span className="lp-tag" style={{ color: '#a78bfa' }}>HOW IT WORKS</span>
                        <h2 className="lp-ch-title" style={{ textAlign: 'center' }}>Five steps. Zero friction.</h2>
                        <p className="lp-ch-desc" style={{ textAlign: 'center', maxWidth: 520 }}>
                            From raw file to strategic insight — every step is
                            automated, auditable, and fast.
                        </p>
                    </motion.div>
                    <ProcessVisual progress={processP} />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 6 — TRUST & CAPABILITIES
                Clean metrics strip with fade-in
            ═══════════════════════════════════════════════════════ */}
            <section className="lp-trust">
                <TrustItem icon={<LayoutDashboard size={22} />} value="25+" label="Analysis Tools" idx={0} />
                <TrustItem icon={<Cpu size={22} />} value="Real-Time" label="Data Processing" idx={1} />
                <TrustItem icon={<Shield size={22} />} value="Enterprise" label="RBAC & Encryption" idx={2} />
                <TrustItem icon={<BrainCircuit size={22} />} value="ML-Powered" label="Forecasting & AutoML" idx={3} />
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 7 — DEEP DIVE: SMART LENS
                3-step walkthrough with scroll-driven step transitions
            ═══════════════════════════════════════════════════════ */}
            <section ref={deepRef} className="lp-deep">
                <div className="lp-deep-sticky">
                    <motion.div
                        className="lp-deep-header"
                        style={{
                            opacity: useSpring(useTransform(deepP, [0, 0.08], [0, 1]), SPRING),
                            y: useSpring(useTransform(deepP, [0, 0.08], [30, 0]), SPRING),
                        }}
                    >
                        <span className="lp-tag" style={{ color: '#8b5cf6' }}>DEEP DIVE</span>
                        <h2 className="lp-ch-title" style={{ textAlign: 'center' }}>
                            Smart Lens in action.
                        </h2>
                    </motion.div>
                    <div className="lp-deep-steps">
                        {DEEP_STEPS.map((step, i) => {
                            const s = deepSteps[i];
                            const Icon = step.icon;
                            return (
                                <motion.div key={step.num} className="lp-deep-step" style={{ opacity: s.op, y: s.y }}>
                                    <motion.div className="lp-deep-icon" style={{ scale: s.iconScale, background: `${step.color}12`, color: step.color }}>
                                        <Icon size={28} />
                                    </motion.div>
                                    <span className="lp-deep-num" style={{ color: step.color }}>{step.num}</span>
                                    <h3 className="lp-deep-title">{step.title}</h3>
                                    <p className="lp-deep-desc">{step.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 8 — FINAL CTA
            ═══════════════════════════════════════════════════════ */}
            <section className="lp-final">
                <FinalCTA onGetStarted={onGetStarted} />
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="lp-foot">
                <div className="lp-foot-inner">
                    <Logo />
                    <span className="lp-foot-copy">© 2026 Nalyse. All rights reserved.</span>
                    <div className="lp-foot-links">
                        <span>Privacy</span><span>Security</span><span>Contact</span>
                    </div>
                </div>
            </footer>

            {/* ═══════════════════════════════════════════════════════
                STYLES
            ═══════════════════════════════════════════════════════ */}
            <style>{STYLES}</style>
        </div>
    );
};

// ─── Trust Item (scroll-reveal) ──────────────────────────────
const TrustItem = ({ icon, value, label, idx }: { icon: React.ReactNode; value: string; label: string; idx: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'start 0.6'] });
    const op = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), SPRING);
    const y = useSpring(useTransform(scrollYProgress, [0, 1], [40, 0]), SPRING);
    return (
        <motion.div ref={ref} className="lp-trust-item" style={{ opacity: op, y, transitionDelay: `${idx * 80}ms` }}>
            <div className="lp-trust-icon">{icon}</div>
            <div className="lp-trust-val">{value}</div>
            <div className="lp-trust-label">{label}</div>
        </motion.div>
    );
};

// ─── Final CTA (scroll-reveal + glow) ────────────────────────
const FinalCTA = ({ onGetStarted }: { onGetStarted: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.4'] });
    const op = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), SPRING);
    const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.92, 1]), SPRING);
    return (
        <motion.div ref={ref} className="lp-final-inner" style={{ opacity: op, scale }}>
            <h2 className="lp-final-h2">
                Ready to see the
                <br />
                <span className="lp-glow-text">difference?</span>
            </h2>
            <button className="lp-btn lp-btn-final" onClick={onGetStarted}>
                Start Analyzing — Free <ArrowRight size={20} />
            </button>
            <p className="lp-final-note">No credit card required.</p>
        </motion.div>
    );
};

export default LandingView;

// ═══════════════════════════════════════════════════════════════
// STYLESHEET
// ═══════════════════════════════════════════════════════════════
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* ── Root ── */
.lp {
    background: var(--bg-main);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, sans-serif;
    overflow-x: hidden;
    position: relative;
    -webkit-font-smoothing: antialiased;
}

/* ── Ambient ── */
.lp-ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.lp-orb {
    position: absolute; border-radius: 50%;
    filter: blur(140px); opacity: 0.06;
    animation: lp-drift 35s infinite ease-in-out;
}
.lp-orb-1 { width: 700px; height: 700px; top: -150px; right: -150px; background: #6366f1; }
.lp-orb-2 { width: 500px; height: 500px; bottom: 30%; left: -120px; background: #8b5cf6; animation-delay: -12s; }
.lp-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.02;
}
@keyframes lp-drift {
    0%, 100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(30px, -20px) scale(1.04); }
}

/* ── Hero ── */
.lp-hero {
    position: relative; z-index: 10;
    min-height: 100vh;
    will-change: transform, opacity;
}
.lp-hero-inner {
    min-height: 100vh;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
    padding: 40px;
    max-width: 960px; margin: 0 auto;
}
.lp-hero-chip {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 18px; border-radius: 100px;
    background: var(--bento-glass);
    border: 1px solid var(--bento-border);
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.18em; color: var(--primary);
    margin-bottom: 36px;
}
.lp-hero-h1 {
    font-size: clamp(48px, 9vw, 88px);
    font-weight: 800; line-height: 1.02;
    letter-spacing: -0.045em;
    margin: 0 0 28px;
}
.lp-glow-text {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #a78bfa 60%, #06b6d4 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-shimmer 8s ease infinite;
}
@keyframes lp-shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
.lp-hero-p {
    font-size: clamp(16px, 2vw, 20px);
    color: var(--text-secondary); line-height: 1.65;
    max-width: 560px; margin: 0 0 44px;
    font-weight: 400;
}
.lp-hero-cta { margin-bottom: 0; }
.lp-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 17px 40px; border-radius: 14px;
    background: var(--text-primary); color: var(--bg-main);
    font-size: 15px; font-weight: 800; border: none;
    cursor: pointer; transition: all 0.3s ease;
    letter-spacing: -0.01em;
}
.lp-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 48px -12px rgba(99, 102, 241, 0.35); }
.lp-btn-final { padding: 20px 52px; font-size: 17px; }
.lp-scroll-cue {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    color: var(--text-secondary);
    animation: lp-bob 2.5s infinite ease-in-out;
}
@keyframes lp-bob {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(8px); }
}

/* ── Shared Section ── */
.lp-tag {
    font-size: 11px; font-weight: 900;
    letter-spacing: 0.22em; text-transform: uppercase;
    display: block; margin-bottom: 14px;
}
.lp-ch-title {
    font-size: clamp(36px, 5.5vw, 60px);
    font-weight: 800; letter-spacing: -0.035em;
    line-height: 1.06; margin: 0 0 20px;
    color: var(--text-primary);
}
.lp-ch-desc {
    font-size: 17px; color: var(--text-secondary);
    line-height: 1.7; font-weight: 400; margin: 0;
    max-width: 440px;
}

/* ── Chapters (Sticky Scroll) ── */
.lp-chapter {
    position: relative; z-index: 10;
    height: 280vh;
}
.lp-chapter-sticky {
    position: sticky; top: 0;
    height: 100vh;
    display: flex; align-items: center; gap: 60px;
    max-width: 1200px; margin: 0 auto;
    padding: 0 48px;
}
.lp-ch-text {
    flex: 0 0 42%; will-change: transform, opacity;
}
.lp-ch-visual {
    flex: 1; display: flex;
    align-items: center; justify-content: center;
}

/* ── Analytics Visual ── */
.lp-vis {
    position: relative; width: 100%;
    max-width: 400px; will-change: transform, opacity;
}
.lp-heatgrid {
    display: grid; grid-template-columns: repeat(8, 1fr);
    gap: 6px;
}
.lp-heatcell {
    aspect-ratio: 1; border-radius: 6px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    animation: lp-cell-in 0.6s ease both;
}
@keyframes lp-cell-in {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); }
}
.lp-grid-highlights {
    position: absolute; inset: 0; pointer-events: none;
}
.lp-highlight-dot {
    position: absolute; width: 12px; height: 12px;
    border-radius: 50%; background: #06b6d4;
    box-shadow: 0 0 16px #06b6d4, 0 0 30px rgba(6, 182, 212, 0.3);
    transform: translate(-50%, -50%);
}
.lp-highlight-lines {
    position: absolute; inset: 0; width: 100%; height: 100%;
}
.lp-vis-badge {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 16px; padding: 8px 16px;
    background: var(--bento-glass); border: 1px solid var(--bento-border);
    border-radius: 10px; font-size: 12px; font-weight: 700;
    color: var(--text-primary); backdrop-filter: var(--bento-blur);
}

/* ── Forecast Visual ── */
.lp-chart-svg {
    width: 100%; max-width: 420px;
}
.lp-chart-svg path, .lp-chart-svg line { vector-effect: non-scaling-stroke; }

/* ── Dashboard Visual ── */
.lp-dash-vis { max-width: 440px; }
.lp-dash-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.lp-dash-card {
    padding: 20px; border-radius: 16px;
    background: var(--bento-glass); border: 1px solid var(--bento-border);
    backdrop-filter: var(--bento-blur);
    will-change: transform, opacity;
}
.lp-dash-wide { grid-column: span 2; }
.lp-dash-label {
    font-size: 11px; font-weight: 700;
    color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 12px;
}
.lp-dash-bars {
    display: flex; gap: 6px; align-items: flex-end; height: 60px;
}
.lp-dash-bar {
    flex: 1; border-radius: 4px;
    background: linear-gradient(to top, #6366f1, #8b5cf6);
    opacity: 0.7;
}
.lp-dash-metric {
    font-size: 36px; font-weight: 900;
    color: var(--text-primary); letter-spacing: -0.03em;
}
.lp-dash-metric span { font-size: 20px; color: var(--text-secondary); }
.lp-dash-status {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; color: var(--text-secondary);
}
.lp-dash-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #10b981; box-shadow: 0 0 8px #10b981;
}
.lp-dash-sparkline { height: 40px; }
.lp-dash-sparkline svg { width: 100%; height: 100%; }

/* ── Process Pipeline ── */
.lp-process {
    position: relative; z-index: 10; height: 250vh;
}
.lp-process-sticky {
    position: sticky; top: 0; height: 100vh;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 0 40px;
}
.lp-process-header {
    text-align: center; margin-bottom: 64px;
    will-change: transform, opacity;
}
.lp-pipeline {
    display: flex; align-items: flex-start; gap: 0;
    position: relative; max-width: 900px; width: 100%;
    justify-content: center;
}
.lp-pipe-step {
    display: flex; flex-direction: column;
    align-items: center; gap: 14px;
    position: relative; flex: 1;
}
.lp-pipe-node {
    width: 64px; height: 64px; border-radius: 20px;
    background: var(--bento-glass); border: 1px solid var(--bento-border);
    backdrop-filter: var(--bento-blur);
    display: flex; align-items: center; justify-content: center;
    will-change: transform, opacity, box-shadow;
    position: relative; z-index: 2;
}
.lp-pipe-label {
    font-size: 12px; font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
}
.lp-pipe-line {
    position: absolute; top: 32px;
    left: calc(50% + 36px); right: calc(-50% + 36px);
    height: 2px; transform-origin: left;
    will-change: transform; z-index: 1;
    border-radius: 1px;
}

/* ── Trust Strip ── */
.lp-trust {
    position: relative; z-index: 10;
    display: flex; justify-content: center;
    gap: 48px; padding: 120px 40px;
    max-width: 1100px; margin: 0 auto;
    flex-wrap: wrap;
}
.lp-trust-item {
    text-align: center; will-change: transform, opacity;
    min-width: 160px;
}
.lp-trust-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--bento-glass); border: 1px solid var(--bento-border);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; color: var(--text-secondary);
}
.lp-trust-val {
    font-size: 28px; font-weight: 900;
    letter-spacing: -0.02em; color: var(--text-primary);
    margin-bottom: 4px;
}
.lp-trust-label {
    font-size: 13px; font-weight: 600;
    color: var(--text-secondary);
}

/* ── Deep Dive ── */
.lp-deep {
    position: relative; z-index: 10; height: 320vh;
}
.lp-deep-sticky {
    position: sticky; top: 0; height: 100vh;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 0 40px;
}
.lp-deep-header {
    text-align: center; margin-bottom: 56px;
    will-change: transform, opacity;
}
.lp-deep-steps {
    display: flex; gap: 32px;
    max-width: 960px; width: 100%;
}
.lp-deep-step {
    flex: 1; text-align: center;
    will-change: transform, opacity;
}
.lp-deep-icon {
    width: 64px; height: 64px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    will-change: transform;
}
.lp-deep-num {
    font-size: 13px; font-weight: 900;
    letter-spacing: 0.1em; display: block;
    margin-bottom: 8px;
}
.lp-deep-title {
    font-size: 18px; font-weight: 800;
    margin: 0 0 8px; color: var(--text-primary);
}
.lp-deep-desc {
    font-size: 14px; color: var(--text-secondary);
    line-height: 1.65; margin: 0;
}

/* ── Final CTA ── */
.lp-final {
    position: relative; z-index: 10;
    padding: 120px 40px 160px;
}
.lp-final-inner {
    text-align: center;
    max-width: 700px; margin: 0 auto;
    will-change: transform, opacity;
}
.lp-final-h2 {
    font-size: clamp(40px, 6vw, 64px);
    font-weight: 800; letter-spacing: -0.035em;
    line-height: 1.06; margin: 0 0 40px;
    color: var(--text-primary);
}
.lp-final-note {
    margin-top: 18px; font-size: 14px;
    color: var(--text-secondary); font-weight: 500;
}

/* ── Footer ── */
.lp-foot {
    position: relative; z-index: 10;
    padding: 0 40px 48px;
    max-width: 1200px; margin: 0 auto;
}
.lp-foot-inner {
    display: flex; align-items: center;
    justify-content: space-between;
    padding-top: 32px;
    border-top: 1px solid var(--bento-border);
}
.lp-foot-copy {
    font-size: 12px; font-weight: 600;
    color: var(--text-secondary);
}
.lp-foot-links {
    display: flex; gap: 28px;
    font-size: 12px; font-weight: 600;
    color: var(--text-secondary);
}
.lp-foot-links span { cursor: pointer; transition: color 0.2s; }
.lp-foot-links span:hover { color: var(--text-primary); }

/* ── Responsive ── */
@media (max-width: 1024px) {
    .lp-chapter-sticky {
        flex-direction: column; gap: 40px;
        padding: 60px 32px; justify-content: center;
    }
    .lp-ch-text { flex: none; text-align: center; }
    .lp-ch-desc { max-width: 100%; margin: 0 auto; }
    .lp-chapter { height: 220vh; }
    .lp-deep-steps { flex-direction: column; align-items: center; gap: 40px; }
    .lp-deep-step { max-width: 400px; }
    .lp-deep { height: 400vh; }
    .lp-pipeline { flex-wrap: wrap; gap: 24px; }
    .lp-pipe-line { display: none; }
}
@media (max-width: 768px) {
    .lp-hero-inner { padding: 24px; }
    .lp-chapter-sticky { padding: 40px 20px; }
    .lp-process-sticky { padding: 40px 20px; }
    .lp-trust { gap: 32px; padding: 80px 20px; }
    .lp-final { padding: 80px 20px 100px; }
    .lp-foot { padding: 0 20px 32px; }
    .lp-foot-inner { flex-direction: column; gap: 16px; text-align: center; }
    .lp-btn { width: 100%; justify-content: center; }
}
`;
