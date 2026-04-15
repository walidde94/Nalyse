import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
    ArrowRight, LayoutDashboard, Sparkles, Link2, GitCompareArrows,
    ShieldAlert, Landmark, TrendingUp, Map, BrainCircuit, Code2,
    Webhook, Boxes, FlaskConical, Layers, BarChart3, Briefcase,
    Activity, MessageSquare, Database, ArrowRightLeft, Building2,
    Zap, ChevronDown
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

/* ═══════════════════════════════════════════════════════════════
   SCROLL-DRIVEN LANDING PAGE — Apple Keynote Style
   Each section uses framer-motion useScroll + useTransform
   for GPU-accelerated, scroll-linked animations.
   ═══════════════════════════════════════════════════════════════ */

// ── Feature Data (all real Nalyse features) ──────────────────
const ANALYTICS_FEATURES = [
    { icon: LayoutDashboard, title: 'Workspace Dashboard', desc: 'Neural command center with real-time data health, ingestion telemetry, and workspace intelligence at a glance.', color: '#8b5cf6' },
    { icon: Sparkles, title: 'Smart Lens', desc: 'AI-powered visual analysis engine that surfaces hidden patterns and generates intelligent recommendations automatically.', color: '#a78bfa' },
    { icon: Link2, title: 'Korrelation', desc: 'Discover hidden statistical relationships across any combination of dataset columns with interactive heatmaps.', color: '#6366f1' },
    { icon: GitCompareArrows, title: 'Version Diff', desc: 'Track structural and value-level changes across dataset versions with precision delta analysis.', color: '#818cf8' },
    { icon: ShieldAlert, title: 'Anomaly Detection', desc: 'Statistical outlier identification and data drift monitoring powered by Z-score and IQR algorithms.', color: '#f43f5e' },
    { icon: Landmark, title: 'Financial Risk', desc: 'Risk exposure modeling, VaR calculations, and scenario-based financial stress testing.', color: '#f59e0b' },
];

const PREDICTIVE_FEATURES = [
    { icon: TrendingUp, title: 'Forecasting Engine', desc: 'Time-series prediction with machine learning models for demand planning and trend analysis.', color: '#06b6d4' },
    { icon: Map, title: 'Geospatial Intelligence', desc: 'Location-based data visualization on interactive world maps with regional drill-down.', color: '#10b981' },
    { icon: BrainCircuit, title: 'AutoML Intelligence', desc: 'Automated model selection, hyperparameter tuning, and explainability for every prediction.', color: '#8b5cf6' },
    { icon: Code2, title: 'Developer API', desc: 'RESTful API with full CRUD operations, token authentication, and rate-limited programmatic access.', color: '#64748b' },
    { icon: Webhook, title: 'Webhooks & Events', desc: 'Event-driven integrations and real-time data pipelines triggered by analysis completion.', color: '#f472b6' },
    { icon: Boxes, title: 'Embed SDK', desc: 'White-label analytics components embeddable into any external application via iframe or React SDK.', color: '#fbbf24' },
];

const BI_FEATURES = [
    { icon: Layers, title: 'Dashboard Canvas', desc: 'Drag-and-drop dashboard builder with Architect Mode for spatial arrangement of any analytics widget.', color: '#f59e0b' },
    { icon: BarChart3, title: 'BI Visual Architect', desc: 'Executive dashboards for sales, marketing, supply chain, retention, product adoption, and C-suite reporting.', color: '#3b82f6' },
    { icon: Briefcase, title: 'Strategic Board', desc: 'Pin AI-generated insights, deploy strategic actions, and track priority matrices across your organization.', color: '#eab308' },
];

const SELFSERVICE_FEATURES = [
    { icon: Sparkles, title: 'Self-Service Studio', desc: 'Non-technical users explore, filter, and visualize data independently — no SQL or coding required.', color: '#8b5cf6' },
    { icon: Activity, title: 'Automated Reports', desc: 'Schedule recurring analyses and distribute insights to stakeholders automatically on any cadence.', color: '#10b981' },
    { icon: MessageSquare, title: 'Collaboration', desc: 'Share analyses, annotate findings, and discuss insights in real-time with your team.', color: '#3b82f6' },
];

const INFRA_FEATURES = [
    { icon: Database, title: 'Data Connectors', desc: 'Connect CSV, Excel, JSON, and enterprise data sources with automatic schema inference.' },
    { icon: ArrowRightLeft, title: 'Data Migration', desc: 'Seamless data migration pipelines with validation, rollback, and audit trails.' },
    { icon: Building2, title: 'Organization & RBAC', desc: 'Role-based access control, team management, and enterprise-grade security policies.' },
];

// ── Smooth spring config ─────────────────────────────────────
const SPRING = { stiffness: 100, damping: 30, restDelta: 0.001 };

// ── Reusable scroll-animated wrapper ─────────────────────────
const ScrollReveal = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.3'] });
    const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), SPRING);
    const y = useSpring(useTransform(scrollYProgress, [0, 1], [60, 0]), SPRING);
    return (
        <motion.div ref={ref} style={{ opacity, y, willChange: 'transform, opacity', ...style }} className={className}>
            {children}
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const LandingView = ({ onGetStarted }: { onGetStarted: () => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Hero scroll values
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroOpacity = useSpring(useTransform(heroProgress, [0, 0.6], [1, 0]), SPRING);
    const heroScale = useSpring(useTransform(heroProgress, [0, 0.6], [1, 0.92]), SPRING);
    const heroY = useSpring(useTransform(heroProgress, [0, 0.6], [0, -80]), SPRING);

    // Horizontal scroll for Predictive section
    const predictiveRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: predictiveProgress } = useScroll({ target: predictiveRef, offset: ['start start', 'end end'] });
    const predictiveX = useSpring(useTransform(predictiveProgress, [0, 1], ['0%', '-65%']), SPRING);

    // Decision Engine cinematic scale
    const decisionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: decisionProgress } = useScroll({ target: decisionRef, offset: ['start end', 'center center'] });
    const decisionScale = useSpring(useTransform(decisionProgress, [0, 1], [0.75, 1]), SPRING);
    const decisionOpacity = useSpring(useTransform(decisionProgress, [0, 0.5], [0, 1]), SPRING);

    return (
        <div ref={containerRef} className="lp-root">

            {/* ═══ AMBIENT BACKGROUND ═══ */}
            <div className="lp-ambient">
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />
                <div className="lp-orb lp-orb-3" />
                <div className="lp-grain" />
            </div>

            {/* ═══ SECTION 1: HERO ═══ */}
            <motion.section
                ref={heroRef}
                className="lp-hero"
                style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            >
                <nav className="lp-nav">
                    <Logo />
                    <button className="lp-nav-cta" onClick={onGetStarted}>
                        Get Started
                    </button>
                </nav>

                <div className="lp-hero-content">
                    <motion.div
                        className="lp-chip"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <Zap size={14} />
                        <span>INTELLIGENT DATA ANALYTICS PLATFORM</span>
                    </motion.div>

                    <motion.h1
                        className="lp-hero-title"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Turn raw data into<br />
                        <span className="lp-gradient-text">strategic intelligence.</span>
                    </motion.h1>

                    <motion.p
                        className="lp-hero-sub"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        From exploratory analysis to predictive forecasting — Nalyse gives your team
                        the tools to understand, predict, and act on data with confidence.
                    </motion.p>

                    <motion.div
                        className="lp-hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <button className="lp-btn-primary" onClick={onGetStarted}>
                            Start Analyzing <ArrowRight size={20} />
                        </button>
                        <button className="lp-btn-ghost" onClick={() => {
                            document.querySelector('.lp-analytics')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            Explore Features
                        </button>
                    </motion.div>

                    <motion.div
                        className="lp-scroll-hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 1.5, duration: 1 }}
                    >
                        <ChevronDown size={20} />
                    </motion.div>
                </div>
            </motion.section>

            {/* ═══ SECTION 2: ANALYTICS STUDIO (Sticky + Scrolling Cards) ═══ */}
            <section className="lp-analytics">
                <div className="lp-sticky-section">
                    <div className="lp-sticky-left">
                        <div className="lp-section-tag" style={{ color: '#8b5cf6' }}>ANALYTICS STUDIO</div>
                        <h2 className="lp-section-title">
                            Understand your data<br />at every level.
                        </h2>
                        <p className="lp-section-desc">
                            Six specialized tools for exploratory analysis, pattern recognition,
                            statistical correlation, and risk assessment — all operating on your
                            live datasets in real time.
                        </p>
                        <div className="lp-section-count">
                            <span className="lp-count-num">6</span>
                            <span className="lp-count-label">Analysis Engines</span>
                        </div>
                    </div>
                    <div className="lp-sticky-right">
                        {ANALYTICS_FEATURES.map((f, i) => (
                            <ScrollReveal key={f.title} style={{ transitionDelay: `${i * 0.05}s` }}>
                                <div className="lp-feature-card">
                                    <div className="lp-feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                                        <f.icon size={22} />
                                    </div>
                                    <div className="lp-feature-body">
                                        <h3 className="lp-feature-title">{f.title}</h3>
                                        <p className="lp-feature-desc">{f.desc}</p>
                                    </div>
                                    <div className="lp-feature-glow" style={{ background: f.color }} />
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 3: PREDICTIVE MODELS (Horizontal Scroll) ═══ */}
            <section ref={predictiveRef} className="lp-predictive">
                <div className="lp-hz-sticky">
                    <div className="lp-hz-header">
                        <ScrollReveal>
                            <div className="lp-section-tag" style={{ color: '#06b6d4' }}>PREDICTIVE MODELS</div>
                            <h2 className="lp-section-title">See what's coming next.</h2>
                            <p className="lp-section-desc" style={{ maxWidth: 500 }}>
                                Machine learning forecasting, geospatial mapping, and automated model
                                optimization — purpose-built for forward-looking teams.
                            </p>
                        </ScrollReveal>
                    </div>
                    <motion.div className="lp-hz-track" style={{ x: predictiveX }}>
                        {PREDICTIVE_FEATURES.map((f) => (
                            <div key={f.title} className="lp-hz-card">
                                <div className="lp-hz-card-icon" style={{ background: `${f.color}18`, color: f.color }}>
                                    <f.icon size={28} />
                                </div>
                                <h3 className="lp-hz-card-title">{f.title}</h3>
                                <p className="lp-hz-card-desc">{f.desc}</p>
                                <div className="lp-hz-card-glow" style={{ background: f.color }} />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══ SECTION 4: DECISION ENGINE (Cinematic Scale) ═══ */}
            <section className="lp-decision">
                <motion.div
                    ref={decisionRef}
                    className="lp-decision-card"
                    style={{ scale: decisionScale, opacity: decisionOpacity }}
                >
                    <div className="lp-decision-rings">
                        <div className="lp-ring lp-ring-1" />
                        <div className="lp-ring lp-ring-2" />
                        <div className="lp-ring lp-ring-3" />
                    </div>
                    <div className="lp-decision-content">
                        <div className="lp-section-tag" style={{ color: '#6366f1' }}>DECISION ENGINE</div>
                        <h2 className="lp-decision-title">Simulate before<br />you commit.</h2>
                        <p className="lp-decision-desc">
                            Run what-if simulations against your enterprise data. Model outcomes,
                            stress-test assumptions, and validate strategies before deploying them
                            to the real world.
                        </p>
                        <div className="lp-decision-icon">
                            <FlaskConical size={40} />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══ SECTION 5: BUSINESS INTELLIGENCE (Blur-Resolve Grid) ═══ */}
            <section className="lp-bi">
                <ScrollReveal>
                    <div className="lp-section-tag" style={{ color: '#f59e0b', textAlign: 'center' }}>BUSINESS INTELLIGENCE</div>
                    <h2 className="lp-section-title" style={{ textAlign: 'center' }}>
                        From data to boardroom.
                    </h2>
                    <p className="lp-section-desc" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 60px' }}>
                        Professional executive dashboards, strategic boards, and visual builders
                        that align your entire org around a single source of truth.
                    </p>
                </ScrollReveal>
                <div className="lp-bi-grid">
                    {BI_FEATURES.map((f, i) => (
                        <ScrollReveal key={f.title} style={{ transitionDelay: `${i * 0.1}s` }}>
                            <div className="lp-bi-card">
                                <div className="lp-bi-card-icon" style={{ background: `${f.color}15`, color: f.color }}>
                                    <f.icon size={28} />
                                </div>
                                <h3 className="lp-bi-card-title">{f.title}</h3>
                                <p className="lp-bi-card-desc">{f.desc}</p>
                                <div className="lp-bi-card-accent" style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* ═══ SECTION 6: SELF-SERVICE (Timeline) ═══ */}
            <section className="lp-selfservice">
                <ScrollReveal>
                    <div className="lp-section-tag" style={{ color: '#10b981', textAlign: 'center' }}>SELF-SERVICE & COLLABORATION</div>
                    <h2 className="lp-section-title" style={{ textAlign: 'center' }}>
                        Analytics for everyone.
                    </h2>
                    <p className="lp-section-desc" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 80px' }}>
                        Empower non-technical team members to explore data independently,
                        schedule reports, and collaborate on findings — no engineering support required.
                    </p>
                </ScrollReveal>
                <div className="lp-timeline">
                    {SELFSERVICE_FEATURES.map((f, i) => (
                        <ScrollReveal key={f.title}>
                            <div className="lp-timeline-item">
                                <div className="lp-timeline-line">
                                    <div className="lp-timeline-dot" style={{ background: f.color, boxShadow: `0 0 20px ${f.color}60` }} />
                                    {i < SELFSERVICE_FEATURES.length - 1 && <div className="lp-timeline-connector" />}
                                </div>
                                <div className="lp-timeline-content">
                                    <div className="lp-timeline-icon" style={{ background: `${f.color}12`, color: f.color }}>
                                        <f.icon size={20} />
                                    </div>
                                    <h3 className="lp-timeline-title">{f.title}</h3>
                                    <p className="lp-timeline-desc">{f.desc}</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* ═══ SECTION 7: INFRASTRUCTURE & CTA ═══ */}
            <section className="lp-infra">
                <ScrollReveal>
                    <div className="lp-infra-strip">
                        {INFRA_FEATURES.map((f) => (
                            <div key={f.title} className="lp-infra-item">
                                <f.icon size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                <div>
                                    <h4 className="lp-infra-title">{f.title}</h4>
                                    <p className="lp-infra-desc">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            {/* ═══ FOOTER CTA ═══ */}
            <footer className="lp-footer">
                <ScrollReveal>
                    <div className="lp-footer-cta">
                        <h2 className="lp-footer-title">
                            Ready to turn data into<br />
                            <span className="lp-gradient-text">your competitive advantage?</span>
                        </h2>
                        <button className="lp-btn-primary lp-btn-lg" onClick={onGetStarted}>
                            Start Analyzing — Free <ArrowRight size={22} />
                        </button>
                        <p className="lp-footer-note">No credit card required. Start in seconds.</p>
                    </div>
                </ScrollReveal>
                <div className="lp-footer-bottom">
                    <div className="lp-footer-brand">
                        <Logo />
                    </div>
                    <span className="lp-footer-copy">© 2026 Nalyse. All rights reserved.</span>
                    <div className="lp-footer-links">
                        <span>Privacy</span>
                        <span>Security</span>
                        <span>Contact</span>
                    </div>
                </div>
            </footer>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STYLES                                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                .lp-root {
                    background: var(--bg-main);
                    color: var(--text-primary);
                    font-family: 'Inter', -apple-system, sans-serif;
                    overflow-x: hidden;
                    position: relative;
                }

                /* ── Ambient Background ── */
                .lp-ambient {
                    position: fixed; inset: 0; z-index: 0; pointer-events: none;
                }
                .lp-orb {
                    position: absolute; border-radius: 50%;
                    filter: blur(120px); opacity: 0.08;
                    animation: lp-float 30s infinite ease-in-out;
                }
                .lp-orb-1 { width: 800px; height: 800px; top: -200px; right: -200px; background: #6366f1; }
                .lp-orb-2 { width: 600px; height: 600px; bottom: 20%; left: -150px; background: #8b5cf6; animation-delay: -10s; }
                .lp-orb-3 { width: 500px; height: 500px; top: 60%; right: 10%; background: #06b6d4; animation-delay: -20s; }
                .lp-grain {
                    position: absolute; inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    opacity: 0.025;
                }
                @keyframes lp-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -30px) scale(1.03); }
                    66% { transform: translate(-20px, 40px) scale(0.97); }
                }

                /* ── Hero ── */
                .lp-hero {
                    position: relative; z-index: 10;
                    min-height: 100vh;
                    display: flex; flex-direction: column;
                    max-width: 1200px; margin: 0 auto;
                    padding: 0 40px;
                    will-change: transform, opacity;
                }
                .lp-nav {
                    display: flex; align-items: center; justify-content: space-between;
                    height: 80px; flex-shrink: 0;
                }
                .lp-nav-cta {
                    padding: 10px 28px; border-radius: 10px;
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    color: var(--text-primary); font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: all 0.25s;
                    backdrop-filter: var(--bento-blur);
                }
                .lp-nav-cta:hover { background: var(--bento-glass-hover); border-color: var(--bento-border-hover); }

                .lp-hero-content {
                    flex: 1; display: flex; flex-direction: column;
                    justify-content: center; align-items: center;
                    text-align: center; padding-bottom: 80px;
                }
                .lp-chip {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 6px 18px; border-radius: 100px;
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    font-size: 11px; font-weight: 800; letter-spacing: 0.15em;
                    color: var(--primary); margin-bottom: 40px;
                }
                .lp-hero-title {
                    font-size: clamp(48px, 8vw, 88px); font-weight: 900;
                    line-height: 1.0; letter-spacing: -0.04em;
                    margin: 0 0 32px; color: var(--text-primary);
                }
                .lp-gradient-text {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #06b6d4);
                    background-size: 200% 200%;
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: lp-shimmer 6s ease infinite;
                }
                @keyframes lp-shimmer {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .lp-hero-sub {
                    font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary);
                    max-width: 640px; line-height: 1.6; font-weight: 400;
                    margin: 0 0 48px;
                }
                .lp-hero-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }

                .lp-btn-primary {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 18px 40px; border-radius: 14px; border: none;
                    background: var(--text-primary); color: var(--bg-main);
                    font-size: 16px; font-weight: 800; cursor: pointer;
                    transition: all 0.3s ease;
                }
                .lp-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 40px -8px rgba(0,0,0,0.4); }
                .lp-btn-lg { padding: 22px 52px; font-size: 18px; }
                .lp-btn-ghost {
                    padding: 18px 40px; border-radius: 14px;
                    background: transparent; border: 1px solid var(--bento-border);
                    color: var(--text-primary); font-size: 16px; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                }
                .lp-btn-ghost:hover { background: var(--bento-glass); border-color: var(--bento-border-hover); transform: translateY(-2px); }

                .lp-scroll-hint {
                    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
                    animation: lp-bounce 2.5s infinite ease-in-out;
                    color: var(--text-secondary);
                }
                @keyframes lp-bounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(10px); }
                }

                /* ── Section Common ── */
                .lp-section-tag {
                    font-size: 12px; font-weight: 900; letter-spacing: 0.25em;
                    text-transform: uppercase; margin-bottom: 16px;
                }
                .lp-section-title {
                    font-size: clamp(36px, 5vw, 56px); font-weight: 900;
                    letter-spacing: -0.03em; line-height: 1.05;
                    color: var(--text-primary); margin: 0 0 20px;
                }
                .lp-section-desc {
                    font-size: 17px; color: var(--text-secondary);
                    line-height: 1.7; font-weight: 400; margin: 0;
                }

                /* ── Analytics Studio (Sticky Left + Scrolling Right) ── */
                .lp-analytics {
                    position: relative; z-index: 10;
                    padding: 0 40px;
                    max-width: 1300px; margin: 0 auto;
                }
                .lp-sticky-section {
                    display: flex; gap: 60px;
                    min-height: 250vh;
                }
                .lp-sticky-left {
                    position: sticky; top: 0; height: 100vh;
                    width: 40%; display: flex; flex-direction: column;
                    justify-content: center; flex-shrink: 0;
                }
                .lp-section-count {
                    display: flex; align-items: baseline; gap: 12px; margin-top: 32px;
                }
                .lp-count-num {
                    font-size: 48px; font-weight: 900; color: var(--primary);
                    font-variant-numeric: tabular-nums;
                }
                .lp-count-label {
                    font-size: 14px; font-weight: 700; color: var(--text-secondary);
                    text-transform: uppercase; letter-spacing: 0.1em;
                }
                .lp-sticky-right {
                    width: 60%;
                    padding: 50vh 0 30vh;
                    display: flex; flex-direction: column; gap: 24px;
                }

                /* Feature Cards */
                .lp-feature-card {
                    display: flex; align-items: flex-start; gap: 20px;
                    padding: 28px; border-radius: var(--bento-radius);
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    backdrop-filter: var(--bento-blur);
                    transition: border-color 0.3s, transform 0.3s;
                    position: relative; overflow: hidden;
                }
                .lp-feature-card:hover {
                    border-color: var(--bento-border-hover);
                    transform: translateX(8px);
                }
                .lp-feature-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .lp-feature-body { flex: 1; }
                .lp-feature-title {
                    font-size: 16px; font-weight: 800; margin: 0 0 6px;
                    color: var(--text-primary);
                }
                .lp-feature-desc {
                    font-size: 14px; color: var(--text-secondary);
                    line-height: 1.6; margin: 0; font-weight: 400;
                }
                .lp-feature-glow {
                    position: absolute; top: -50%; right: -30%;
                    width: 200px; height: 200px; border-radius: 50%;
                    filter: blur(80px); opacity: 0.04; pointer-events: none;
                }

                /* ── Predictive Models (Horizontal Scroll) ── */
                .lp-predictive {
                    position: relative; z-index: 10;
                    height: 350vh;
                }
                .lp-hz-sticky {
                    position: sticky; top: 0; height: 100vh;
                    overflow: hidden;
                    display: flex; flex-direction: column;
                    justify-content: center;
                    padding: 0 40px;
                }
                .lp-hz-header {
                    max-width: 1200px; margin: 0 auto 48px;
                    width: 100%;
                }
                .lp-hz-track {
                    display: flex; gap: 24px;
                    padding: 0 calc(50vw - 600px);
                    will-change: transform;
                }
                .lp-hz-card {
                    flex-shrink: 0; width: 340px;
                    padding: 36px; border-radius: var(--bento-radius);
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    backdrop-filter: var(--bento-blur);
                    position: relative; overflow: hidden;
                    transition: border-color 0.3s, transform 0.3s;
                }
                .lp-hz-card:hover {
                    border-color: var(--bento-border-hover);
                    transform: translateY(-4px);
                }
                .lp-hz-card-icon {
                    width: 56px; height: 56px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 24px;
                }
                .lp-hz-card-title {
                    font-size: 20px; font-weight: 800; margin: 0 0 10px;
                    color: var(--text-primary);
                }
                .lp-hz-card-desc {
                    font-size: 14px; color: var(--text-secondary);
                    line-height: 1.6; margin: 0;
                }
                .lp-hz-card-glow {
                    position: absolute; bottom: -40%; right: -20%;
                    width: 180px; height: 180px; border-radius: 50%;
                    filter: blur(70px); opacity: 0.06; pointer-events: none;
                }

                /* ── Decision Engine (Cinematic) ── */
                .lp-decision {
                    position: relative; z-index: 10;
                    padding: 200px 40px;
                    display: flex; justify-content: center;
                }
                .lp-decision-card {
                    max-width: 900px; width: 100%;
                    padding: 80px 60px; border-radius: 32px;
                    background: var(--bento-glass);
                    border: 1px solid var(--bento-border);
                    backdrop-filter: blur(20px);
                    position: relative; overflow: hidden;
                    text-align: center;
                    will-change: transform, opacity;
                }
                .lp-decision-rings {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    pointer-events: none;
                }
                .lp-ring {
                    position: absolute; border: 1px solid var(--primary);
                    border-radius: 50%; opacity: 0;
                    animation: lp-ring-pulse 5s infinite linear;
                }
                .lp-ring-1 { width: 200px; height: 200px; }
                .lp-ring-2 { width: 350px; height: 350px; animation-delay: 1.6s; }
                .lp-ring-3 { width: 500px; height: 500px; animation-delay: 3.3s; }
                @keyframes lp-ring-pulse {
                    0% { transform: scale(0.3); opacity: 0.3; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .lp-decision-content { position: relative; z-index: 2; }
                .lp-decision-title {
                    font-size: clamp(36px, 5vw, 52px); font-weight: 900;
                    letter-spacing: -0.03em; line-height: 1.05;
                    color: var(--text-primary); margin: 0 0 24px;
                }
                .lp-decision-desc {
                    font-size: 17px; color: var(--text-secondary);
                    line-height: 1.7; max-width: 520px; margin: 0 auto 40px;
                }
                .lp-decision-icon {
                    width: 80px; height: 80px; border-radius: 24px;
                    background: var(--primary-subtle); color: var(--primary);
                    display: inline-flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 40px var(--primary-glow);
                }

                /* ── Business Intelligence (Grid) ── */
                .lp-bi {
                    position: relative; z-index: 10;
                    padding: 160px 40px;
                    max-width: 1200px; margin: 0 auto;
                }
                .lp-bi-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                }
                .lp-bi-card {
                    padding: 36px; border-radius: var(--bento-radius);
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    backdrop-filter: var(--bento-blur);
                    position: relative; overflow: hidden;
                    transition: border-color 0.3s, transform 0.3s;
                }
                .lp-bi-card:hover { border-color: var(--bento-border-hover); transform: translateY(-4px); }
                .lp-bi-card-icon {
                    width: 56px; height: 56px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 24px;
                }
                .lp-bi-card-title {
                    font-size: 20px; font-weight: 800; margin: 0 0 10px;
                    color: var(--text-primary);
                }
                .lp-bi-card-desc {
                    font-size: 14px; color: var(--text-secondary);
                    line-height: 1.6; margin: 0;
                }
                .lp-bi-card-accent {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    height: 3px; opacity: 0.6;
                }

                /* ── Self-Service Timeline ── */
                .lp-selfservice {
                    position: relative; z-index: 10;
                    padding: 120px 40px 160px;
                    max-width: 800px; margin: 0 auto;
                }
                .lp-timeline { display: flex; flex-direction: column; gap: 0; }
                .lp-timeline-item {
                    display: flex; gap: 32px;
                    padding-bottom: 48px;
                }
                .lp-timeline-line {
                    display: flex; flex-direction: column; align-items: center;
                    flex-shrink: 0; width: 20px;
                }
                .lp-timeline-dot {
                    width: 14px; height: 14px; border-radius: 50%;
                    flex-shrink: 0;
                }
                .lp-timeline-connector {
                    width: 2px; flex: 1; min-height: 60px;
                    background: linear-gradient(to bottom, var(--bento-border-hover), transparent);
                    margin-top: 8px;
                }
                .lp-timeline-content { flex: 1; padding-top: -2px; }
                .lp-timeline-icon {
                    width: 40px; height: 40px; border-radius: 12px;
                    display: inline-flex; align-items: center; justify-content: center;
                    margin-bottom: 12px;
                }
                .lp-timeline-title {
                    font-size: 18px; font-weight: 800; margin: 0 0 8px;
                    color: var(--text-primary);
                }
                .lp-timeline-desc {
                    font-size: 14px; color: var(--text-secondary);
                    line-height: 1.6; margin: 0;
                }

                /* ── Infrastructure Strip ── */
                .lp-infra {
                    position: relative; z-index: 10;
                    padding: 0 40px 120px;
                    max-width: 1200px; margin: 0 auto;
                }
                .lp-infra-strip {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    gap: 24px; padding: 40px; border-radius: var(--bento-radius);
                    background: var(--bento-glass); border: 1px solid var(--bento-border);
                    backdrop-filter: var(--bento-blur);
                }
                .lp-infra-item {
                    display: flex; gap: 16px; align-items: flex-start;
                }
                .lp-infra-title {
                    font-size: 14px; font-weight: 800; margin: 0 0 4px;
                    color: var(--text-primary);
                }
                .lp-infra-desc {
                    font-size: 13px; color: var(--text-secondary);
                    line-height: 1.5; margin: 0;
                }

                /* ── Footer ── */
                .lp-footer {
                    position: relative; z-index: 10;
                    padding: 120px 40px 60px;
                    max-width: 1200px; margin: 0 auto;
                }
                .lp-footer-cta {
                    text-align: center; margin-bottom: 120px;
                }
                .lp-footer-title {
                    font-size: clamp(36px, 5vw, 56px); font-weight: 900;
                    letter-spacing: -0.03em; line-height: 1.1;
                    color: var(--text-primary); margin: 0 0 40px;
                }
                .lp-footer-note {
                    margin-top: 20px; font-size: 14px; color: var(--text-secondary);
                    font-weight: 500;
                }
                .lp-footer-bottom {
                    display: flex; align-items: center; justify-content: space-between;
                    padding-top: 40px; border-top: 1px solid var(--bento-border);
                }
                .lp-footer-brand { display: flex; align-items: center; }
                .lp-footer-copy {
                    font-size: 12px; font-weight: 600; color: var(--text-secondary);
                }
                .lp-footer-links {
                    display: flex; gap: 32px;
                    font-size: 12px; font-weight: 600; color: var(--text-secondary);
                }
                .lp-footer-links span { cursor: pointer; transition: color 0.2s; }
                .lp-footer-links span:hover { color: var(--text-primary); }

                /* ── Responsive ── */
                @media (max-width: 1024px) {
                    .lp-sticky-section { flex-direction: column; min-height: auto; }
                    .lp-sticky-left {
                        position: relative; width: 100%; height: auto;
                        padding: 80px 0 40px;
                    }
                    .lp-sticky-right { width: 100%; padding: 0 0 80px; }
                    .lp-bi-grid { grid-template-columns: 1fr; }
                    .lp-infra-strip { grid-template-columns: 1fr; }
                    .lp-predictive { height: auto; }
                    .lp-hz-sticky { position: relative; height: auto; overflow-x: auto; padding: 80px 40px; }
                    .lp-hz-track { transform: none !important; padding: 0; }
                    .lp-hz-card { min-width: 300px; }
                }
                @media (max-width: 768px) {
                    .lp-hero { padding: 0 20px; }
                    .lp-analytics, .lp-bi, .lp-selfservice, .lp-infra, .lp-footer { padding-left: 20px; padding-right: 20px; }
                    .lp-hero-actions { flex-direction: column; align-items: stretch; }
                    .lp-btn-primary, .lp-btn-ghost { justify-content: center; }
                    .lp-decision { padding: 100px 20px; }
                    .lp-decision-card { padding: 48px 28px; }
                    .lp-footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
                }
            `}</style>
        </div>
    );
};

export default LandingView;
