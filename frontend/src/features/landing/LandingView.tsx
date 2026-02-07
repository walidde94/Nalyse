import { ArrowRight, CloudUpload, BrainCircuit, LayoutGrid, Zap, Sparkles, BarChart3, Network, Bot } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const LandingView = ({ onGetStarted }: { onGetStarted: () => void }) => {
    return (
        <div className="landing-master">
            {/* --- IMMERSIVE BACKGROUND --- */}
            <div className="intel-field">
                <div className="ambient-orb orb-primary"></div>
                <div className="ambient-orb orb-secondary"></div>
                <div className="grain-texture"></div>
                <div className="digital-grid"></div>
            </div>

            <div className="landing-content">
                {/* --- NAVIGATION --- */}
                <nav className="glass-nav">
                    <div className="nav-brand">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Logo />
                        </div>
                    </div>
                    <div className="nav-links">
                        <button className="btn-nav-action" onClick={onGetStarted}>Get Started</button>
                    </div>
                </nav>

                {/* --- HERO SECTION --- */}
                <header className="apex-hero">
                    <div className="status-chip fade-in-up">
                        <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                        <span>INTELLIGENT DATA ANALYSIS FOR TEAMS</span>
                    </div>

                    <h1 className="apex-title fade-in-up">
                        Better decisions start<br />
                        <span className="intelligence-gradient">with better insights.</span>
                    </h1>

                    <p className="apex-subtitle fade-in-up">
                        Nalyse connects your spreadsheets and data sources to help you find hidden patterns,
                        predict trends, and grow your business with confidence.
                    </p>

                    <div className="hero-actions fade-in-up">
                        <button className="btn-apex-primary" onClick={onGetStarted}>
                            Get Started Now <ArrowRight size={20} />
                        </button>
                        <button className="btn-apex-secondary" onClick={() => window.open('/NALYSE_WORK_INSTRUCTIONS.html', '_blank')}>
                            See how it works
                        </button>
                    </div>

                    <div className="hero-trust-row fade-in-up">
                        <span>Trusted by business leaders worldwide</span>
                        <div className="trust-logos">
                            <span>TRANSIT</span>
                            <span>AETHER</span>
                            <span>CORE</span>
                            <span>VORTEX</span>
                        </div>
                    </div>
                </header>

                {/* --- THREE PILLARS SECTION --- */}
                <section className="bento-nexus">
                    <div className="section-header">
                        <span className="h-tag">ECOSYSTEM</span>
                        <h2 className="h-title">Three Pillars of Excellence</h2>
                    </div>

                    <div className="bento-container">
                        {/* Data Analysis Pillar */}
                        <div className="bento-tile tile-featured">
                            <div className="tile-content">
                                <div className="tile-icon-box"><LayoutGrid size={32} color="var(--primary)" /></div>
                                <h3 className="tile-title">Data Analysis</h3>
                                <p className="tile-desc">
                                    Exploratory data analysis simplified. Connect your sources, run real-time SQL queries,
                                    and build interactive visual builders. Understand your raw data with granular
                                    drill-downs and high-performance filtering.
                                </p>
                                <div className="tile-tags">
                                    <span>REAL-TIME</span>
                                    <span>SQL POWERED</span>
                                    <span>INTERACTIVE</span>
                                </div>
                            </div>
                            <div className="tile-visualization">
                                <SynthesisVisual />
                            </div>
                        </div>

                        {/* Data Science Pillar */}
                        <div className="bento-tile tile-medium">
                            <div className="tile-content">
                                <div className="tile-icon-box text-success-custom"><BrainCircuit size={24} /></div>
                                <h3 className="tile-title">Data Science</h3>
                                <p className="tile-desc">
                                    Move beyond descriptive metrics. Leverage advanced statistical models,
                                    forecasting algorithms, and AI insights to predict future outcomes
                                    and discover hidden correlations.
                                </p>
                                <div className="tile-tags">
                                    <span>PREDICTIVE</span>
                                    <span>STATS</span>
                                </div>
                            </div>
                        </div>

                        {/* Business Intelligence Pillar */}
                        <div className="bento-tile tile-medium">
                            <div className="tile-content">
                                <div className="tile-icon-box text-info-custom"><BarChart3 size={24} /></div>
                                <h3 className="tile-title">Business Intelligence</h3>
                                <p className="tile-desc">
                                    Transform data into strategy. Professional executive dashboards and
                                    presentation modes that align teams around a single source of truth
                                    for business growth.
                                </p>
                                <div className="tile-tags">
                                    <span>EXECUTIVE</span>
                                    <span>STRATEGIC</span>
                                </div>
                            </div>
                        </div>

                        {/* Agentic Systems Pillar - NEW SECTION */}
                        <div className="bento-tile tile-featured highlight-gold">
                            <div className="tile-content">
                                <div className="tile-icon-box text-warning-custom"><Bot size={32} /></div>
                                <h2 className="tile-title">AI-Driven Analytics & Agentic Systems</h2>
                                <p className="tile-desc">
                                    <b>Autonomous AI Agents:</b> Deploy agents that plan, execute, and validate
                                    complex analysis workflows with minimal guidance.
                                </p>
                                <p className="tile-desc mt-2">
                                    <b>Natural Language Interfaces:</b> Query your enterprise data using
                                    plain English. No SQL expertise required.
                                </p>
                                <p className="tile-desc mt-2">
                                    <b>Augmented Analytics:</b> Automated data preparation and insight
                                    explanation for every business user.
                                </p>
                                <div className="tile-tags">
                                    <span>AGENTIC AI</span>
                                    <span>NLP QUERYING</span>
                                    <span>AUGMENTED</span>
                                </div>
                            </div>
                            <div className="tile-visualization">
                                <AgenticVisual />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- HOW IT WORKS --- */}
                <section className="pulse-lifecycle">
                    <div className="lifecycle-wrapper">
                        <div className="l-side content-side">
                            <span className="h-tag">PROCESS</span>
                            <h2 className="pulse-h">See results in <br />three simple steps.</h2>
                            <p className="pulse-p">
                                We designed Nalyse to be powerful for experts, yet simple enough for everyone.
                                No coding or complex math required.
                            </p>

                            <div className="step-cards">
                                <div className="step-card-item">
                                    <div className="s-icon"><CloudUpload size={20} /></div>
                                    <div className="s-text">
                                        <h4>1. Upload Data</h4>
                                        <p>Drag and drop your files or connect your tools.</p>
                                    </div>
                                </div>
                                <div className="step-card-item">
                                    <div className="s-icon"><Zap size={20} /></div>
                                    <div className="s-text">
                                        <h4>2. Get Insights</h4>
                                        <p>Let our AI find the trends for you.</p>
                                    </div>
                                </div>
                                <div className="step-card-item active">
                                    <div className="s-icon"><LayoutGrid size={20} /></div>
                                    <div className="s-text">
                                        <h4>3. Take Action</h4>
                                        <p>Save your findings and share them with your team.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="l-side visual-side">
                            <div className="lifecycle-orb-visual">
                                <div className="pulse-ring ring-1"></div>
                                <div className="pulse-ring ring-2"></div>
                                <div className="pulse-center">
                                    <Network size={40} color="white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CLOSURE CTA --- */}
                <footer className="apex-footer">
                    <div className="footer-callout">
                        <h2>Ready to improve your business?</h2>
                        <button className="btn-apex-primary big shadow-lg" onClick={onGetStarted}>
                            Create Free Account <ArrowRight size={24} />
                        </button>
                        <p className="footer-small-text">Free to try. No hidden fees.</p>
                    </div>
                    <div className="footer-legal">
                        <div className="f-logo">
                            <Logo />
                        </div>
                        <div className="f-copyright">© 2026 NALYSE. ALL RIGHTS RESERVED.</div>
                        <div className="f-links">
                            <span>Privacy</span>
                            <span>Security</span>
                            <span>Contact</span>
                        </div>
                    </div>
                </footer>
            </div >

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');

                .landing-master {
                    background: var(--bg-main) !important;
                    color: var(--text-primary) !important;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    overflow-x: hidden;
                    transition: background 0.3s ease, color 0.3s ease;
                }

                .intel-field { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
                .ambient-orb { position: absolute; border-radius: 50%; filter: blur(160px); opacity: 0.12; animation: float 25s infinite ease-in-out; }
                [data-theme='light'] .ambient-orb { opacity: 0.08; }
                .orb-primary { width: 1000px; height: 1000px; top: -200px; right: -200px; background: var(--primary); }
                .orb-secondary { width: 800px; height: 800px; bottom: -100px; left: -100px; background: #8b5cf6; animation-delay: -7s; }
                .grain-texture { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); opacity: 0.03; pointer-events: none; }
                .digital-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(circle at center, black, transparent 80%); opacity: 0.2; }

                @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.05); } }

                .landing-content { position: relative; z-index: 10; max-width: 1400px; margin: 0 auto; padding: 0 40px; }
                .glass-nav { height: 100px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); margin-bottom: 60px; }
                .nav-brand { display: flex; align-items: center; gap: 10px; }
                .logo-icon { width: 32px; height: 32px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
                .logo-text { font-size: 20px; font-weight: 900; letter-spacing: -0.04em; color: var(--text-primary); }
                .nav-links { display: flex; align-items: center; gap: 40px; }
                .nav-link-item { font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: color 0.3s; }
                .nav-link-item:hover { color: var(--text-primary); }
                .btn-nav-action { padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .btn-nav-action:hover { opacity: 0.9; transform: translateY(-2px); }

                .apex-hero { text-align: center; padding: 80px 0 120px; }
                .status-chip { display: inline-flex; align-items: center; gap: 10px; padding: 6px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 100px; font-size: 11px; font-weight: 800; color: var(--text-primary); margin-bottom: 32px; box-shadow: var(--shadow-sm); }
                .apex-title { font-size: 84px; font-weight: 900; line-height: 1.0; letter-spacing: -0.05em; margin-bottom: 32px; color: var(--text-primary); }
                .intelligence-gradient { background: linear-gradient(to right, #3b82f6, #8b5cf6, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .apex-subtitle { font-size: 22px; color: var(--text-secondary); max-width: 700px; margin: 0 auto 56px; line-height: 1.5; font-weight: 400; }

                .hero-actions { display: flex; justify-content: center; gap: 20px; margin-bottom: 80px; }
                .btn-apex-primary { background: var(--text-primary); color: var(--bg-main) !important; padding: 20px 48px; font-size: 18px; font-weight: 800; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s; }
                .btn-apex-primary:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
                .btn-apex-primary.big { padding: 22px 60px; font-size: 20px; }
                .btn-apex-secondary { background: transparent; color: var(--text-primary); padding: 20px 48px; font-size: 18px; font-weight: 800; border-radius: 12px; border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.3s; }
                .btn-apex-secondary:hover { background: var(--bg-card); transform: translateY(-2px); }

                .hero-trust-row { display: flex; flex-direction: column; gap: 20px; align-items: center; opacity: 0.6; }
                .hero-trust-row span { font-size: 13px; font-weight: 600; letter-spacing: 0.05em; color: var(--text-secondary); }
                .trust-logos { display: flex; gap: 60px; font-weight: 900; font-size: 20px; letter-spacing: 0.2em; filter: grayscale(1); color: var(--text-primary); }

                .bento-nexus { margin-bottom: 200px; }
                .section-header { margin-bottom: 64px; }
                .h-tag { font-size: 13px; font-weight: 900; letter-spacing: 0.3em; color: var(--primary); display: block; margin-bottom: 12px; }
                .h-title { font-size: 52px; font-weight: 900; letter-spacing: -0.04em; color: var(--text-primary); }

                .bento-container { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 320px; gap: 24px; }
                .bento-tile { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 32px; padding: 40px; position: relative; overflow: hidden; transition: all 0.4s ease; box-shadow: var(--shadow-sm); }
                .bento-tile:hover { border-color: var(--primary); transform: translateY(-8px); box-shadow: var(--shadow-md); }
                .tile-featured { grid-column: span 8; }
                .tile-medium { grid-column: span 4; }
                .bento-tile:not(.tile-featured):not(.tile-medium) { grid-column: span 6; }

                .tile-icon-box { width: 56px; height: 56px; background: var(--bg-surface); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 32px; }
                .tile-title { font-size: 24px; font-weight: 800; margin-bottom: 16px; color: var(--text-primary); }
                .tile-desc { color: var(--text-secondary); line-height: 1.6; font-size: 16px; }
                .tile-tags { display: flex; gap: 12px; margin-top: 24px; }
                .tile-tags span { font-size: 11px; font-weight: 800; padding: 4px 12px; background: var(--primary-subtle, rgba(59, 130, 246, 0.1)); color: var(--primary); border-radius: 6px; }

                .pulse-lifecycle { padding: 120px 0; margin-bottom: 200px; }
                .lifecycle-wrapper { display: flex; align-items: center; gap: 80px; }
                .l-side { flex: 1; }
                .pulse-h { font-size: 56px; font-weight: 900; line-height: 1.0; margin-bottom: 24px; letter-spacing: -0.04em; color: var(--text-primary); }
                .pulse-p { font-size: 18px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 48px; }
                
                .step-cards { display: flex; flex-direction: column; gap: 16px; }
                .step-card-item { display: flex; align-items: center; gap: 20px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; transition: all 0.3s; }
                .step-card-item.active { border-color: var(--primary); background: var(--primary-subtle, rgba(59, 130, 246, 0.05)); }
                .s-icon { width: 44px; height: 44px; background: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .s-text h4 { font-size: 18px; font-weight: 800; margin-bottom: 4px; color: var(--text-primary); }
                .step-card-item.active .s-text h4 { color: var(--primary); }
                .s-text p { font-size: 14px; color: var(--text-secondary); }

                .lifecycle-orb-visual { position: relative; width: 400px; height: 400px; display: flex; align-items: center; justify-content: center; }
                .pulse-center { width: 100px; height: 100px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px var(--primary-glow); z-index: 2; }
                .pulse-ring { position: absolute; border: 2px solid var(--primary); border-radius: 50%; animation: ring-pulse 4s infinite linear; opacity: 0; }
                .ring-1 { width: 100%; height: 100%; animation-delay: 0s; }
                .ring-2 { width: 100%; height: 100%; animation-delay: 2s; }
                @keyframes ring-pulse { 0% { transform: scale(0.2); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }

                .apex-footer { text-align: center; padding-bottom: 80px; }
                .footer-callout { margin-bottom: 120px; }
                .footer-callout h2 { font-size: 56px; font-weight: 900; margin-bottom: 48px; letter-spacing: -0.04em; color: var(--text-primary); }
                .footer-small-text { margin-top: 24px; opacity: 0.6; font-size: 14px; color: var(--text-secondary); }
                .footer-legal { display: flex; justify-content: space-between; align-items: center; padding-top: 48px; border-top: 1px solid var(--border-subtle); font-size: 12px; font-weight: 600; color: var(--text-secondary); }
                .f-logo { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 900; }
                .f-links { display: flex; gap: 32px; }

                .text-success-custom { color: var(--success); }
                .text-danger-custom { color: var(--danger); }
                .text-warning-custom { color: var(--warning); }
                .text-info-custom { color: var(--primary); }

                .highlight-gold { border-color: #fbbf24 !important; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(251, 191, 36, 0.05) 100%) !important; }
                .highlight-gold:hover { border-color: #f59e0b !important; box-shadow: 0 0 30px -10px rgba(245, 158, 11, 0.3); }

                .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) both; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    );
};

const SynthesisVisual = () => (
    <div className="synthesis-visual">
        <div className="node n1"></div>
        <div className="node n2"></div>
        <div className="node n3"></div>
        <div className="conn c1"></div>
        <style>{`
            .synthesis-visual { position: absolute; right: 40px; top: 40px; width: 180px; height: 180px; background: var(--bg-surface); border-radius: 40px; border: 1px solid var(--border-subtle); overflow: hidden; }
            .node { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
            .n1 { top: 20%; left: 30%; animation: move1 4s infinite; }
            .n2 { bottom: 30%; right: 20%; background: #8b5cf6; animation: move2 5s infinite; }
            .n3 { top: 50%; right: 40%; background: #d946ef; animation: move3 6s infinite; }
            @keyframes move1 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(15px, 10px); } }
            @keyframes move2 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-20px, -15px); } }
            @keyframes move3 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(10px, -30px); } }
        `}</style>
    </div>
);

const AgenticVisual = () => (
    <div className="agentic-visual">
        <div className="agent-orb main"></div>
        <div className="agent-orb s1"></div>
        <div className="agent-orb s2"></div>
        <div className="agent-link l1"></div>
        <div className="agent-link l2"></div>
        <style>{`
            .agentic-visual { position: absolute; right: 40px; top: 40px; width: 180px; height: 180px; background: #000; border-radius: 40px; border: 1px solid #333; overflow: hidden; }
            .agent-orb { position: absolute; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 20px #fbbf24; }
            .agent-orb.main { width: 40px; height: 40px; left: 70px; top: 70px; animation: agent-breathe 2s infinite alternate; }
            .agent-orb.s1 { width: 15px; height: 15px; left: 30px; top: 30px; animation: agent-orbit 4s infinite linear; }
            .agent-orb.s2 { width: 15px; height: 15px; right: 30px; bottom: 30px; animation: agent-orbit 6s infinite linear reverse; }
            @keyframes agent-breathe { from { transform: scale(0.8); opacity: 0.6; } to { transform: scale(1.1); opacity: 1; } }
            @keyframes agent-orbit { from { transform: rotate(0deg) translateX(60px) rotate(0deg); } to { transform: rotate(360deg) translateX(60px) rotate(-360deg); } }
            .agent-link { position: absolute; background: rgba(251, 191, 36, 0.2); height: 1px; transform-origin: left; }
        `}</style>
    </div>
);
