import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Lock, User, Check, AlertCircle, Mail, Building2, Eye, EyeOff, Fingerprint, Shield, Sparkles, Zap } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

interface RegisterViewProps {
    onSwitchToLogin: () => void;
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
                    background: p.id % 3 === 0 ? '#10b981' : p.id % 3 === 1 ? '#6366f1' : '#c084fc',
                    opacity: 0.25, filter: `blur(${p.size > 2 ? 1 : 0}px)`,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                }} />
            ))}
        </div>
    );
};

const OrbitalRings = () => (
    <svg width="340" height="340" viewBox="0 0 340 340" fill="none" style={{ position: 'absolute', opacity: 0.12 }}>
        <circle cx="170" cy="170" r="140" stroke="url(#orbGradR1)" strokeWidth="0.5" strokeDasharray="4 6" style={{ animation: 'spin 40s linear infinite' }} />
        <circle cx="170" cy="170" r="110" stroke="url(#orbGradR2)" strokeWidth="0.5" strokeDasharray="3 8" style={{ animation: 'spin 30s linear infinite reverse' }} />
        <circle cx="170" cy="170" r="80" stroke="url(#orbGradR1)" strokeWidth="0.5" strokeDasharray="2 10" style={{ animation: 'spin 25s linear infinite' }} />
        <defs>
            <linearGradient id="orbGradR1" x1="0" y1="0" x2="340" y2="340"><stop stopColor="#10b981" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
            <linearGradient id="orbGradR2" x1="340" y1="0" x2="0" y2="340"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#10b981" /></linearGradient>
        </defs>
    </svg>
);

// Password strength meter
const PasswordStrength = ({ password }: { password: string }) => {
    const getStrength = (pw: string) => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };
    const strength = getStrength(password);
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#10b981'];
    if (!password) return null;
    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.06)', transition: 'all 0.3s' }} />
                ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: colors[strength], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{labels[strength]}</span>
        </motion.div>
    );
};

const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, value, onChange, inputRef, showToggle, toggleValue, onToggle, focusedField, setFocusedField, handleKeyDown, setError }: any) => (
    <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            {label}
        </label>
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px', height: 50, borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${focusedField === name ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: focusedField === name ? '0 0 0 3px rgba(16,185,129,0.08), 0 0 20px -8px rgba(16,185,129,0.15)' : 'none',
            transition: 'all 0.3s',
        }}>
            <Icon size={16} style={{ color: focusedField === name ? '#10b981' : 'rgba(255,255,255,0.2)', transition: 'color 0.3s', flexShrink: 0 }} />
            <input
                ref={inputRef}
                type={showToggle ? (toggleValue ? 'text' : 'password') : type}
                value={value}
                onChange={(e: any) => { onChange(e.target.value); setError(''); }}
                onFocus={() => setFocusedField(name)}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontWeight: 500, textAlign: 'left', padding: 0, margin: 0 }}
            />
            {showToggle && (
                <button type="button" onClick={onToggle}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4, display: 'flex' }}
                >
                    {toggleValue ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            )}
        </div>
    </div>
);

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onSuccess }) => {
    const { register } = useAuth();
    const [currentStep, setCurrentStep] = useState(0); // 0: account, 1: org, 2: password, 3: processing, 4: success
    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', organizationName: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const emailRef = useRef<HTMLInputElement>(null);
    const orgRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentStep === 0) setTimeout(() => emailRef.current?.focus(), 400);
        else if (currentStep === 1) setTimeout(() => orgRef.current?.focus(), 400);
        else if (currentStep === 2) setTimeout(() => passwordRef.current?.focus(), 400);
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep === 0) {
            if (!formData.email || !formData.email.includes('@')) { setError('Please enter a valid email.'); return; }
            if (!formData.firstName || !formData.lastName) { setError('Full name is required.'); return; }
            setError(''); setCurrentStep(1);
        } else if (currentStep === 1) {
            if (!formData.organizationName) { setError('Organization name required.'); return; }
            setError(''); setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!formData.password || formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
            if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
            setError(''); handleRegister();
        }
    };

    const handleRegister = async () => {
        setCurrentStep(3);
        try {
            await register(formData.email, formData.password, formData.firstName, formData.lastName, formData.organizationName);
            setCurrentStep(4);
            setTimeout(() => onSuccess(), 1400);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
            setCurrentStep(2);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
    };

    const totalSteps = 3;
    const progress = ((currentStep) / totalSteps) * 100;

    const commonProps = { focusedField, setFocusedField, handleKeyDown, setError };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, display: 'flex', background: '#050508' }}>

            {/* ═══════ LEFT SIDE — Cinematic Hero ═══════ */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    flex: '0 0 48%', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(160deg, #0a0a1a 0%, #061018 40%, #080818 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <div style={{ position: 'absolute', width: '60%', height: '60%', top: '10%', right: '5%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.12), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '50%', height: '50%', bottom: '10%', left: '10%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <FloatingParticles />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, zIndex: 2 }}>
                    <OrbitalRings />
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.4, stiffness: 120, damping: 12 }}
                        style={{
                            width: 100, height: 100, borderRadius: 28,
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.08))',
                            border: '1px solid rgba(16,185,129,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 60px -15px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                            position: 'relative',
                        }}
                    >
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'conic-gradient(from 0deg, transparent, rgba(16,185,129,0.1), transparent)', animation: 'spin 6s linear infinite' }} />
                        <Logo hideText={true} style={{ width: 44, height: 44, color: '#10b981' }} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} style={{ textAlign: 'center', maxWidth: 380 }}>
                        <h1 style={{
                            fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            background: 'linear-gradient(135deg, #fff 30%, #10b981 60%, #6366f1)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Get Started
                        </h1>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 12, lineHeight: 1.6 }}>
                            Join thousands of data teams using Nalyse to power their analytics.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                        {[
                            { icon: <Zap size={13} />, label: 'Instant Setup' },
                            { icon: <Shield size={13} />, label: 'Free Tier' },
                            { icon: <Sparkles size={13} />, label: 'No Credit Card' },
                        ].map((badge, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: 'rgba(255,255,255,0.25)',
                                padding: '6px 12px', borderRadius: 20,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                                {badge.icon} {badge.label}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* ═══════ RIGHT SIDE — Stepped Form ═══════ */}
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
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.04), transparent 50%)', pointerEvents: 'none' }} />

                <AnimatePresence mode="wait">
                    {currentStep <= 2 ? (
                        <motion.div
                            key={`step-${currentStep}`}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.4 }}
                            style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 2 }}
                        >
                            {/* Progress bar */}
                            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                                {currentStep > 0 && (
                                    <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s', flexShrink: 0 }}
                                    >
                                        <ArrowLeft size={16} />
                                    </motion.button>
                                )}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
                                            Step {currentStep + 1} of {totalSteps}
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono, monospace)' }}>
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                        <motion.div
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #10b981, #6366f1)', boxShadow: '0 0 8px rgba(16,185,129,0.3)' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card */}
                            <div style={{
                                padding: '36px 32px', borderRadius: 24,
                                background: 'linear-gradient(160deg, rgba(18,18,30,0.8), rgba(12,12,22,0.9))',
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(20px)',
                            }}>

                                {/* Step 0: Account Info */}
                                {currentStep === 0 && (
                                    <>
                                        <div style={{ marginBottom: 28 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981' }}>Create Account</span>
                                            </div>
                                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Your information</h2>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 500 }}>Let's start with the basics</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <InputField {...commonProps} icon={Mail} label="Email Address" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} inputRef={emailRef} />
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <InputField {...commonProps} icon={User} label="First Name" name="firstName" placeholder="Jane" value={formData.firstName} onChange={(v: string) => setFormData({ ...formData, firstName: v })} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <InputField {...commonProps} icon={User} label="Last Name" name="lastName" placeholder="Smith" value={formData.lastName} onChange={(v: string) => setFormData({ ...formData, lastName: v })} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 1: Organization */}
                                {currentStep === 1 && (
                                    <>
                                        <div style={{ marginBottom: 28 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }} />
                                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6366f1' }}>Organization</span>
                                            </div>
                                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Your workspace</h2>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 500 }}>This will be your team's shared environment</p>
                                        </div>
                                        <InputField {...commonProps} icon={Building2} label="Organization Name" name="org" placeholder="Acme Corporation" value={formData.organizationName} onChange={(v: string) => setFormData({ ...formData, organizationName: v })} inputRef={orgRef} />
                                        
                                        {/* Enrolled summary */}
                                        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{formData.firstName} {formData.lastName}</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{formData.email}</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Password */}
                                {currentStep === 2 && (
                                    <>
                                        <div style={{ marginBottom: 28 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 10px rgba(192,132,252,0.5)' }} />
                                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c084fc' }}>Security</span>
                                            </div>
                                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Secure your account</h2>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 500 }}>Choose a strong password to protect your data</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div>
                                                <InputField {...commonProps} icon={Lock} label="Password" name="password" placeholder="Min 8 characters" value={formData.password}
                                                    onChange={(v: string) => setFormData({ ...formData, password: v })} inputRef={passwordRef}
                                                    showToggle toggleValue={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                                <PasswordStrength password={formData.password} />
                                            </div>
                                            <InputField {...commonProps} icon={Lock} label="Confirm Password" name="confirmPassword" placeholder="Repeat your password" value={formData.confirmPassword}
                                                onChange={(v: string) => setFormData({ ...formData, confirmPassword: v })}
                                                showToggle toggleValue={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#10b981' }}
                                                >
                                                    <Check size={14} /> Passwords match
                                                </motion.div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, fontWeight: 600, marginTop: 16 }}
                                        >
                                            <AlertCircle size={14} /> {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Next / Submit button */}
                                <motion.button
                                    type="button"
                                    onClick={handleNext}
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    style={{
                                        width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: 'pointer', marginTop: 20,
                                        background: currentStep === 2
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)'
                                            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
                                        backgroundSize: '200% 100%', animation: 'shimmerBg 4s ease infinite',
                                        color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
                                        boxShadow: currentStep === 2
                                            ? '0 8px 25px -8px rgba(16,185,129,0.4)'
                                            : '0 8px 25px -8px rgba(99,102,241,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        position: 'relative', overflow: 'hidden',
                                    }}
                                >
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', transform: 'skewX(-20deg) translateX(-100%)', animation: 'sweepShine 4s ease-in-out infinite' }} />
                                    <span style={{ position: 'relative', zIndex: 1 }}>
                                        {currentStep === 2 ? 'Create Account' : 'Continue'}
                                    </span>
                                    <ArrowRight size={16} style={{ position: 'relative', zIndex: 1 }} />
                                </motion.button>
                            </div>

                            {/* Switch to login */}
                            <div style={{ marginTop: 20, textAlign: 'center' }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                    Already have an account?{' '}
                                    <button onClick={onSwitchToLogin}
                                        style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}
                                    >
                                        Sign in
                                    </button>
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        /* Processing / Success */
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 2 }}
                        >
                            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {currentStep === 3 ? (
                                    <>
                                        <motion.svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                                            <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                                            <motion.circle cx="60" cy="60" r="56" fill="none" stroke="url(#regGrad)" strokeWidth="2.5" strokeLinecap="round"
                                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                                                style={{ transformOrigin: 'center', filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}
                                            />
                                            <defs><linearGradient id="regGrad"><stop stopColor="#10b981" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
                                        </motion.svg>
                                        <Fingerprint size={32} style={{ color: '#10b981', opacity: 0.7 }} />
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
                                <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: currentStep === 4 ? '#10b981' : '#6366f1', marginBottom: 8 }}>
                                    {currentStep === 3 ? 'Provisioning...' : 'Account Created'}
                                </div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                    {currentStep === 3 ? 'Setting up your workspace' : 'Welcome aboard! Redirecting...'}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
