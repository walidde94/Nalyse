import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, User, Check, AlertCircle } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { Logo } from '../../components/common/Logo';

interface LoginViewProps {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onSuccess }) => {
    const { login } = useAuth();

    // 0: Email, 1: Password, 2: Processing, 3: Success
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 0 && emailInputRef.current) {
            emailInputRef.current.focus();
        } else if (step === 1 && passwordInputRef.current) {
            passwordInputRef.current.focus();
        }
    }, [step]);

    const handleNext = () => {
        if (step === 0) {
            if (!email || !email.includes('@')) {
                setError('Please provide a valid identifier.');
                return;
            }
            setError('');
            setStep(1);
        } else if (step === 1) {
            if (!password || password.length < 4) {
                setError('Security key required.');
                return;
            }
            setError('');
            handleLogin();
        }
    };

    const handleLogin = async () => {
        setStep(2);
        try {
            await login(email, password);
            setStep(3);
            setTimeout(() => onSuccess(), 1000);
        } catch (err: any) {
            setError(err.message || 'Authentication failed.');
            setStep(1); // Go back to password
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNext();
        }
    };

    const pageVariants = {
        initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
        in: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        out: { opacity: 0, scale: 1.05, filter: 'blur(10px)' }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <AuroraBackground />

            {/* Header Nalyse Branding */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                style={{ position: 'absolute', top: '40px', left: '48px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px' }}
            >
                <Logo hideText={true} style={{ width: '32px', height: '32px' }} />
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'white' }}>Nalyse<span style={{ color: '#3b82f6' }}>.</span></div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '4px' }}>ENTERPRISE // SYS.LOGIN</div>
                </div>
            </motion.div>

            {/* Main Interactive Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', zIndex: 10 }}>
                <AnimatePresence mode="wait">

                    {step === 0 && (
                        <motion.div
                            key="step-0"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px' }}
                        >
                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                Step 1 // Identification
                            </h2>

                            <div style={{ position: 'relative', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <input
                                        ref={emailInputRef}
                                        type="email"
                                        className="auth-flow-input"
                                        placeholder="Enter your email identifier"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <AnimatePresence>
                                        {email && email.includes('@') && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                className="auth-next-btn"
                                                onClick={handleNext}
                                            >
                                                <ArrowRight size={20} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="auth-input-line">
                                    <div className="auth-input-line-active" />
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                                <motion.div layoutId="email-chip" className="step-chip" onClick={() => setStep(0)}>
                                    <User size={14} />
                                    {email}
                                </motion.div>
                            </div>

                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                Step 2 // Verification
                            </h2>

                            <div style={{ position: 'relative', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <input
                                        ref={passwordInputRef}
                                        type="password"
                                        className="auth-flow-input"
                                        placeholder="Enter your security key"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <AnimatePresence>
                                        {password.length > 2 && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                className="auth-next-btn"
                                                onClick={handleNext}
                                            >
                                                <ArrowRight size={20} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="auth-input-line">
                                    <div className="auth-input-line-active" />
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step >= 2 && (
                        <motion.div
                            key="step-2"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '64px' }}>
                                <motion.div layoutId="email-chip" className="step-chip">
                                    <User size={14} />
                                    {email}
                                </motion.div>
                                <motion.div layoutId="pass-chip" className="step-chip">
                                    <Lock size={14} />
                                    Security Key Established
                                </motion.div>
                            </div>

                            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step === 2 ? (
                                    <>
                                        <motion.svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                                            <motion.circle
                                                cx="60" cy="60" r="58"
                                                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"
                                            />
                                            <motion.circle
                                                cx="60" cy="60" r="58"
                                                fill="none" stroke="#3b82f6" strokeWidth="2"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0, rotate: -90 }}
                                                animate={{ pathLength: 1, rotate: 270 }}
                                                transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                                style={{ transformOrigin: 'center' }}
                                            />
                                        </motion.svg>
                                        <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, color: 'white' }}>
                                            ANALYZING
                                        </div>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                        style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020205' }}
                                    >
                                        <Check size={40} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{ marginTop: '24px', color: step === 3 ? '#34d399' : 'rgba(255,255,255,0.6)', fontSize: '14px', letterSpacing: '0.05em' }}
                            >
                                {step === 2 ? 'Verifying Neural Handshake...' : 'Handshake Verified. Redirecting...'}
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer */}
            {step < 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ position: 'absolute', bottom: '40px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}
                >
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        Unregistered Node?{' '}
                        <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                            Initialize New Protocol
                        </button>
                    </p>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>v3.0.2-APEX</span>
                        <a href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</a>
                        <a href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</a>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
