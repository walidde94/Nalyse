import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BarChart3, BrainCircuit, Shield, Zap,
  Upload, Cpu, TrendingUp, Sparkles, ChevronDown,
  Mail, MapPin, Globe, Play, Check, Database, Lock,
  LineChart, Users, Layers
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomePageProps {
  onLogin: () => void;
  onSignup: () => void;
}

/* ─── Floating Particles ─── */
const Particles = () => {
  const pts = React.useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: Math.random() * 3 + 1, d: Math.random() * 10,
    dur: Math.random() * 14 + 10,
    c: ['#6366f1','#10b981','#c084fc','#06b6d4'][i % 4],
  })), []);
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          width:p.s, height:p.s, borderRadius:'50%',
          background:p.c, opacity:0.2,
          animation:`wpFloat ${p.dur}s ease-in-out ${p.d}s infinite alternate`,
        }}/>
      ))}
    </div>
  );
};

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, desc, color, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true }} transition={{ duration:0.6, delay }}
    style={{
      flex:'1 1 280px', padding:'32px 28px', borderRadius:20,
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.06)',
      backdropFilter:'blur(12px)',
      transition:'all 0.3s',
    }}
    whileHover={{ y:-4, borderColor:'rgba(99,102,241,0.2)', boxShadow:'0 12px 40px -12px rgba(99,102,241,0.15)' }}
  >
    <div style={{
      width:48, height:48, borderRadius:14,
      background:`${color}12`, border:`1px solid ${color}25`,
      display:'flex', alignItems:'center', justifyContent:'center',
      marginBottom:20, color,
    }}>
      <Icon size={22}/>
    </div>
    <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 10px', letterSpacing:'-0.02em' }}>{title}</h3>
    <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.65, margin:0 }}>{desc}</p>
  </motion.div>
);

interface StatItemProps {
  value: string;
  label: string;
  delay: number;
}

const StatItem = ({ value, label, delay }: StatItemProps) => (
  <motion.div
    initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true }} transition={{ duration:0.5, delay }}
    style={{ textAlign:'center', minWidth:140 }}
  >
    <div style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.03em',
      background:'linear-gradient(135deg,#6366f1,#06b6d4)',
      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
    }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{label}</div>
  </motion.div>
);

interface StepCardProps {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  delay: number;
}

const StepCard = ({ num, title, desc, icon: Icon, color, delay }: StepCardProps) => (
  <motion.div
    initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true }} transition={{ duration:0.6, delay }}
    style={{ flex:'1 1 220px', textAlign:'center', padding:'28px 20px' }}
  >
    <div style={{
      width:56, height:56, borderRadius:16,
      background:`${color}15`, border:`1px solid ${color}30`,
      display:'flex', alignItems:'center', justifyContent:'center',
      margin:'0 auto 16px', color,
    }}>
      <Icon size={24}/>
    </div>
    <div style={{ fontSize:12, fontWeight:900, letterSpacing:'0.15em', color, marginBottom:8 }}>{num}</div>
    <h4 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>{title}</h4>
    <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6, margin:0 }}>{desc}</p>
  </motion.div>
);

export const WelcomePage: React.FC<WelcomePageProps> = ({ onLogin, onSignup }) => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
  };

  const FEATURES = [
    { icon: BarChart3, title: t('welcome.feat.analytics.title'), desc: t('welcome.feat.analytics.desc'), color:'#6366f1' },
    { icon: BrainCircuit, title: t('welcome.feat.ai.title'), desc: t('welcome.feat.ai.desc'), color:'#8b5cf6' },
    { icon: TrendingUp, title: t('welcome.feat.forecast.title'), desc: t('welcome.feat.forecast.desc'), color:'#06b6d4' },
    { icon: Shield, title: t('welcome.feat.security.title'), desc: t('welcome.feat.security.desc'), color:'#10b981' },
    { icon: Layers, title: t('welcome.feat.collab.title'), desc: t('welcome.feat.collab.desc'), color:'#f59e0b' },
    { icon: LineChart, title: t('welcome.feat.bi.title'), desc: t('welcome.feat.bi.desc'), color:'#ec4899' },
  ];

  const STEPS = [
    { num:'01', icon:Upload, title:t('welcome.step.upload.title'), desc:t('welcome.step.upload.desc'), color:'#6366f1' },
    { num:'02', icon:Cpu, title:t('welcome.step.process.title'), desc:t('welcome.step.process.desc'), color:'#8b5cf6' },
    { num:'03', icon:Sparkles, title:t('welcome.step.insight.title'), desc:t('welcome.step.insight.desc'), color:'#06b6d4' },
    { num:'04', icon:Zap, title:t('welcome.step.act.title'), desc:t('welcome.step.act.desc'), color:'#10b981' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#07070f', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif", overflowX:'hidden', WebkitFontSmoothing:'antialiased' }}>
      <Particles />

      {/* ═══ AMBIENT ═══ */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:'60%', height:'60%', top:'-10%', right:'-10%', background:'radial-gradient(ellipse,rgba(99,102,241,0.08),transparent 70%)', filter:'blur(80px)' }}/>
        <div style={{ position:'absolute', width:'50%', height:'50%', bottom:'10%', left:'-10%', background:'radial-gradient(ellipse,rgba(139,92,246,0.06),transparent 70%)', filter:'blur(80px)' }}/>
      </div>

      {/* ═══ NAV BAR ═══ */}
      <motion.nav
        initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }}
        transition={{ duration:0.6 }}
        style={{
          position:'fixed', top:0, left:0, right:0, zIndex:100,
          padding:'0 40px', height:64,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background: scrolled ? 'rgba(7,7,15,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition:'all 0.35s ease',
        }}
      >
        <Logo />

        {/* Desktop Links */}
        <div style={{ display:'flex', alignItems:'center', gap:32 }} className="wp-nav-links">
          {[
            { label: t('welcome.nav.home'), id:'wp-hero' },
            { label: t('welcome.nav.features'), id:'wp-features' },
            { label: t('welcome.nav.howItWorks'), id:'wp-steps' },
            { label: t('welcome.nav.contact'), id:'wp-contact' },
          ].map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)',
              transition:'color 0.2s', padding:'4px 0',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >{l.label}</button>
          ))}
        </div>

        {/* Auth Buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onLogin} style={{
            background:'none', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:10, padding:'8px 20px', cursor:'pointer',
            fontSize:13, fontWeight:700, color:'#fff',
            transition:'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >{t('welcome.nav.login')}</button>

          <button onClick={onSignup} style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border:'none', borderRadius:10, padding:'8px 22px',
            cursor:'pointer', fontSize:13, fontWeight:700, color:'#fff',
            boxShadow:'0 4px 16px -4px rgba(99,102,241,0.4)',
            transition:'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px -4px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(99,102,241,0.4)'; }}
          >{t('welcome.nav.signup')}</button>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section id="wp-hero" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1, padding:'120px 40px 80px', textAlign:'center' }}>
        <div style={{ maxWidth:800 }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.7 }}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:100, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', fontSize:11, fontWeight:800, letterSpacing:'0.18em', color:'#6366f1', marginBottom:36 }}
          >
            <Sparkles size={13}/> {t('welcome.hero.chip')}
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6, duration:0.9, ease:[0.16,1,0.3,1] }}
            style={{ fontSize:'clamp(44px,8vw,80px)', fontWeight:800, lineHeight:1.04, letterSpacing:'-0.045em', margin:'0 0 28px' }}
          >
            {t('welcome.hero.title')}
            <br/>
            <span style={{ background:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 30%,#a78bfa 60%,#06b6d4 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'wpShimmer 8s ease infinite' }}>
              {t('welcome.hero.highlight')}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8, duration:0.7 }}
            style={{ fontSize:'clamp(16px,2vw,20px)', color:'rgba(255,255,255,0.55)', lineHeight:1.65, maxWidth:560, margin:'0 auto 44px', fontWeight:400 }}
          >
            {t('welcome.hero.desc')}
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:1, duration:0.6 }}
            style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}
          >
            <button onClick={onSignup} style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'17px 40px', borderRadius:14,
              background:'#fff', color:'#07070f',
              fontSize:15, fontWeight:800, border:'none', cursor:'pointer',
              transition:'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px -12px rgba(99,102,241,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {t('welcome.hero.cta')} <ArrowRight size={18}/>
            </button>
            <button onClick={onLogin} style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'17px 32px', borderRadius:14,
              background:'rgba(255,255,255,0.05)', color:'#fff',
              border:'1px solid rgba(255,255,255,0.1)',
              fontSize:15, fontWeight:700, cursor:'pointer',
              transition:'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {t('welcome.hero.loginCta')}
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.4 }}
            style={{ display:'flex', gap:24, justifyContent:'center', marginTop:48, flexWrap:'wrap' }}
          >
            {[
              { icon:<Shield size={13}/>, label:t('auth.soc2') },
              { icon:<Lock size={13}/>, label:t('auth.e2e') },
              { icon:<Sparkles size={13}/>, label:t('auth.aiPowered') },
            ].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                {b.icon} {b.label}
              </div>
            ))}
          </motion.div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:0.3 }} transition={{ delay:2, duration:1.5 }}
            style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', animation:'wpBob 2.5s infinite ease-in-out' }}
          >
            <ChevronDown size={18}/>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 40px', display:'flex', justifyContent:'center', gap:60, flexWrap:'wrap', maxWidth:900, margin:'0 auto' }}>
        <StatItem value="25+" label={t('welcome.stat.tools')} delay={0}/>
        <StatItem value={t('welcome.stat.realtime.val')} label={t('welcome.stat.realtime.label')} delay={0.1}/>
        <StatItem value={t('welcome.stat.enterprise.val')} label={t('welcome.stat.enterprise.label')} delay={0.2}/>
        <StatItem value={t('welcome.stat.ml.val')} label={t('welcome.stat.ml.label')} delay={0.3}/>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="wp-features" style={{ position:'relative', zIndex:1, padding:'100px 40px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}
        >
          <span style={{ fontSize:11, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#8b5cf6' }}>{t('welcome.features.tag')}</span>
          <h2 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:800, letterSpacing:'-0.035em', lineHeight:1.08, margin:'14px 0 18px', color:'#fff' }}>
            {t('welcome.features.title')}
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.5)', maxWidth:520, margin:'0 auto', lineHeight:1.65 }}>
            {t('welcome.features.desc')}
          </p>
        </motion.div>

        <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
          {FEATURES.map((f,i) => <FeatureCard key={i} {...f} delay={i * 0.08}/>)}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="wp-steps" style={{ position:'relative', zIndex:1, padding:'100px 40px', maxWidth:1000, margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}
        >
          <span style={{ fontSize:11, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#06b6d4' }}>{t('welcome.steps.tag')}</span>
          <h2 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:800, letterSpacing:'-0.035em', lineHeight:1.08, margin:'14px 0 0', color:'#fff' }}>
            {t('welcome.steps.title')}
          </h2>
        </motion.div>

        <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
          {STEPS.map((s,i) => <StepCard key={i} {...s} delay={i * 0.1}/>)}
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 40px 120px' }}>
        <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
          style={{
            maxWidth:800, margin:'0 auto', textAlign:'center',
            padding:'64px 48px', borderRadius:28,
            background:'linear-gradient(160deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04),rgba(6,182,212,0.04))',
            border:'1px solid rgba(99,102,241,0.12)',
            position:'relative', overflow:'hidden',
          }}
        >
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.1), transparent 60%)', pointerEvents:'none' }}/>
          <h2 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:800, letterSpacing:'-0.035em', lineHeight:1.08, margin:'0 0 20px', color:'#fff', position:'relative' }}>
            {t('welcome.cta.title')}<br/>
            <span style={{ background:'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {t('welcome.cta.highlight')}
            </span>
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.5)', marginBottom:36, position:'relative' }}>
            {t('welcome.cta.desc')}
          </p>
          <button onClick={onSignup} style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'18px 48px', borderRadius:14,
            background:'#fff', color:'#07070f',
            fontSize:16, fontWeight:800, border:'none', cursor:'pointer',
            boxShadow:'0 8px 32px -8px rgba(99,102,241,0.3)',
            transition:'all 0.3s', position:'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px -12px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px -8px rgba(99,102,241,0.3)'; }}
          >
            {t('welcome.cta.btn')} <ArrowRight size={18}/>
          </button>
          <p style={{ marginTop:16, fontSize:14, color:'rgba(255,255,255,0.4)', position:'relative' }}>{t('welcome.cta.note')}</p>
        </motion.div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="wp-contact" style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:700, margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:40 }}
        >
          <span style={{ fontSize:11, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#10b981' }}>{t('welcome.contact.tag')}</span>
          <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:'-0.03em', margin:'14px 0 12px', color:'#fff' }}>{t('welcome.contact.title')}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.65 }}>{t('welcome.contact.desc')}</p>
        </motion.div>
        <div style={{ display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap' }}>
          {[
            { icon:<Mail size={20}/>, label:'contact@nalyse.io', color:'#6366f1' },
            { icon:<Globe size={20}/>, label:'nalyse.io', color:'#06b6d4' },
            { icon:<MapPin size={20}/>, label:t('welcome.contact.location'), color:'#10b981' },
          ].map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${c.color}12`, border:`1px solid ${c.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:c.color }}>{c.icon}</div>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ position:'relative', zIndex:1, padding:'0 40px 48px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap', gap:16 }}>
          <Logo />
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>© 2026 Nalyse. {t('common.allRightsReserved')}</span>
          <div style={{ display:'flex', gap:24 }}>
            {[t('landing.footer.privacy'), t('landing.footer.security'), t('landing.footer.contact')].map((l,i) => (
              <span key={i} style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)', cursor:'pointer', transition:'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ═══ STYLES ═══ */}
      <style>{`
        @keyframes wpFloat {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(15px,-20px) scale(1.1); }
        }
        @keyframes wpShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes wpBob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @media (max-width: 768px) {
          .wp-nav-links { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
