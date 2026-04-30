import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Mail, Check, AlertCircle, Eye, EyeOff, Fingerprint, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from '../../components/common/Logo';

interface LoginViewProps {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

// Floating particle generator for the hero side
const FloatingParticles = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 12 + 10,
    }));
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                    width: p.size, height: p.size, borderRadius: '50%',
                    background: p.id % 3 === 0 ? '#6366f1' : p.id % 3 === 1 ? '#10b981' : '#c084fc',
                    opacity: 0.25, filter: `blur(${p.size > 2 ? 1 : 0}px)`,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                }} />
            ))}
        </div>
    );
};

// Orbital ring SVG component
const OrbitalRings = () => (
    <svg width="340" height="340" viewBox="0 0 340 340" fill="none" style={{ position: 'absolute', opacity: 0.12 }}>
        <circle cx="170" cy="170" r="140" stroke="url(#orbGrad1)" strokeWidth="0.5" strokeDasharray="4 6" style={{ animation: 'spin 40s linear infinite' }} />
        <circle cx="170" cy="170" r="110" stroke="url(#orbGrad2)" strokeWidth="0.5" strokeDasharray="3 8" style={{ animation: 'spin 30s linear infinite reverse' }} />
        <circle cx="170" cy="170" r="80" stroke="url(#orbGrad1)" strokeWidth="0.5" strokeDasharray="2 10" style={{ animation: 'spin 25s linear infinite' }} />
        <defs>
            <linearGradient id="orbGrad1" x1="0" y1="0" x2="340" y2="340"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#10b981" /></linearGradient>
            <linearGradient id="orbGrad2" x1="340" y1="0" x2="0" y2="340"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
        </defs>
    </svg>
);

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onSuccess }) => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [step, setStep] = useState(0); // 0: form, 1: processing, 2: success
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => emailRef.current?.focus(), 600);
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email || !email.includes('@')) { setError(t('auth.validEmail')); return; }
        if (!password || password.length < 4) { setError(t('auth.passwordLength')); return; }
        setError('');
        setStep(1);
        try {
            await login(email, password);
            setStep(2);
            setTimeout(() => onSuccess(), 1200);
        } catch (err: any) {
            setError(err.message || t('auth.authFailed'));
            setStep(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, display: 'flex', background: 'var(--bg-main)' }}>

            {/* ═══════ LEFT SIDE — Cinematic Hero ═══════ */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    flex: '0 0 52%', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(160deg, #0a0a1a 0%, #0f0f2a 40%, #080818 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {/* Mesh gradient blobs */}
                <div style={{ position: 'absolute', width: '60%', height: '60%', top: '10%', left: '5%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '50%', height: '50%', bottom: '5%', right: '10%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '40%', height: '40%', top: '40%', left: '40%', background: 'radial-gradient(ellipse, rgba(192,132,252,0.08), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                <FloatingParticles />

                {/* Grid pattern overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

                {/* Central artwork */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, zIndex: 2 }}>
                    <OrbitalRings />

                    {/* Core logo orb */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.4, stiffness: 120, damping: 12 }}
                        style={{
                            width: 100, height: 100, borderRadius: 28,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.08))',
                            border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 60px -15px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                            position: 'relative',
                        }}
                    >
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.1), transparent)', animation: 'spin 6s linear infinite' }} />
                        <Logo hideText={true} style={{ width: 44, height: 44, color: '#6366f1' }} />
                    </motion.div>

                    {/* Hero text */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        style={{ textAlign: 'center', maxWidth: 420 }}
                    >
                        <h1 style={{
                            fontSize: 44, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            background: 'linear-gradient(135deg, #fff 30%, #6366f1 60%, #10b981)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Nalyse
                        </h1>
                        <p style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500, marginTop: 12, lineHeight: 1.6, letterSpacing: '0.01em' }}>
                            {t('auth.login.heroDesc')}<br />
                            {t('auth.login.heroSubDesc')}
                        </p>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        style={{ display: 'flex', gap: 24, marginTop: 12 }}
                    >
                        {[
                            { icon: <Shield size={14} />, label: t('auth.login.badgeSoc') },
                            { icon: <Fingerprint size={14} />, label: t('auth.login.badgeE2e') },
                            { icon: <Sparkles size={14} />, label: t('auth.login.badgeAi') },
                        ].map((badge, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--text-disabled)',
                                padding: '6px 12px', borderRadius: 20,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            }}>
                                {badge.icon} {badge.label}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom divider glow */}
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)' }} />
            </motion.div>

            {/* ═══════ RIGHT SIDE — Auth Form ═══════ */}
            <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(180deg, #08080f 0%, #0a0a14 100%)',
                    position: 'relative', padding: '40px',
                }}
            >
                {/* Subtle pattern */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.04), transparent 50%)', pointerEvents: 'none' }} />

                <AnimatePresence mode="wait">
                    {step < 1 ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}
                        >
                            {/* Card container */}
                            <div style={{
                                padding: '40px 36px', borderRadius: 24,
                                background: 'linear-gradient(160deg, rgba(18,18,30,0.8), rgba(12,12,22,0.9))',
                                border: '1px solid var(--border-default)',
                                boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(20px)',
                            }}>
                                {/* Card header */}
                                <div style={{ marginBottom: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6366f1' }}>{t('auth.login.secureAccess')}</span>
                                    </div>
                                    <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
                                        {t('auth.login.welcomeBack')}
                                    </h2>
                                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>
                                        {t('auth.login.subtitle')}
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {/* Email field */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 8 }}>
                                            {t('auth.login.emailLabel')}
                                        </label>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '0 16px', height: 52, borderRadius: 14,
                                            background: 'var(--bg-surface)',
                                            border: `1px solid ${focusedField === 'email' ? 'rgba(99,102,241,0.4)' : 'var(--border-default)'}`,
                                            boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(99,102,241,0.08), 0 0 20px -8px rgba(99,102,241,0.15)' : 'none',
                                            transition: 'all 0.3s',
                                        }}>
                                            <Mail size={16} style={{ color: focusedField === 'email' ? '#6366f1' : 'var(--text-disabled)', transition: 'color 0.3s', flexShrink: 0 }} />
                                            <input
                                                ref={emailRef}
                                                type="email"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={t('auth.login.emailPlaceholder')}
                                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, letterSpacing: '0.01em', textAlign: 'left', padding: 0, margin: 0 }}
                                            />
                                            {email && email.includes('@') && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check size={16} style={{ color: '#10b981' }} />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Password field */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 8 }}>
                                            {t('auth.login.passwordLabel')}
                                        </label>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '0 16px', height: 52, borderRadius: 14,
                                            background: 'var(--bg-surface)',
                                            border: `1px solid ${focusedField === 'password' ? 'rgba(99,102,241,0.4)' : 'var(--border-default)'}`,
                                            boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(99,102,241,0.08), 0 0 20px -8px rgba(99,102,241,0.15)' : 'none',
                                            transition: 'all 0.3s',
                                        }}>
                                            <Lock size={16} style={{ color: focusedField === 'password' ? '#6366f1' : 'var(--text-disabled)', transition: 'color 0.3s', flexShrink: 0 }} />
                                            <input
                                                ref={passwordRef}
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                                onFocus={() => setFocusedField('password')}
                                                onBlur={() => setFocusedField(null)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={t('auth.login.passwordPlaceholder')}
                                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, textAlign: 'left', padding: 0, margin: 0 }}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', padding: 4, display: 'flex', transition: 'color 0.2s' }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, fontWeight: 600 }}
                                            >
                                                <AlertCircle size={14} /> {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit button */}
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.01, y: -1 }}
                                        whileTap={{ scale: 0.99 }}
                                        style={{
                                            width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
                                            backgroundSize: '200% 100%', animation: 'shimmerBg 4s ease infinite',
                                            color: 'var(--text-primary)', fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                                            boxShadow: '0 8px 25px -8px rgba(99,102,241,0.4), 0 2px 6px rgba(0,0,0,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            position: 'relative', overflow: 'hidden', marginTop: 4,
                                        }}
                                    >
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', transform: 'skewX(-20deg) translateX(-100%)', animation: 'sweepShine 4s ease-in-out infinite' }} />
                                        <span style={{ position: 'relative', zIndex: 1 }}>{t('auth.login.signIn')}</span>
                                        <ArrowRight size={16} style={{ position: 'relative', zIndex: 1 }} />
                                    </motion.button>
                                </form>

                                {/* Divider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
                                    <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-disabled)' }}>{t('auth.login.or')}</span>
                                    <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                </div>

                                {/* Switch to register */}
                                <button
                                    onClick={onSwitchToRegister}
                                    style={{
                                        width: '100%', height: 48, borderRadius: 14, cursor: 'pointer',
                                        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                                        color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        transition: 'all 0.3s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-default)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    {t('auth.login.createAccount')}
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Bottom info */}
                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontWeight: 500 }}>
                                    {t('auth.login.securityNote')} · <span style={{ color: 'var(--text-disabled)', fontFamily: 'var(--font-mono, monospace)' }}>v3.0.2</span>
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        /* Processing / Success state */
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 2 }}
                        >
                            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step === 1 ? (
                                    <>
                                        <motion.svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                                            <circle cx="60" cy="60" r="56" fill="none" stroke='var(--border-default)' strokeWidth="2" />
                                            <motion.circle cx="60" cy="60" r="56" fill="none" stroke="url(#procGrad)" strokeWidth="2.5" strokeLinecap="round"
                                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                                                style={{ transformOrigin: 'center', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))' }}
                                            />
                                            <defs><linearGradient id="procGrad"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
                                        </motion.svg>
                                        <Fingerprint size={32} style={{ color: '#6366f1', opacity: 0.7 }} />
                                    </>
                                ) : (
                                    <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                                        style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px -8px rgba(16,185,129,0.4)' }}
                                    >
                                        <Check size={40} strokeWidth={3} color="#fff" />
                                    </motion.div>
                                )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: step === 2 ? '#10b981' : '#6366f1', marginBottom: 8 }}>
                                    {step === 1 ? t('auth.authenticating') : t('auth.accessGranted')}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {step === 1 ? t('auth.verifying') : t('auth.redirecting')}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
