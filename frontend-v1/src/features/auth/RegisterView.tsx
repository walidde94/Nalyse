import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, User, Check, AlertCircle, Briefcase, Mail, Eye, EyeOff } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { Logo } from '../../components/common/Logo';

interface RegisterViewProps {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onSuccess }) => {
    const { register } = useAuth();

    // 0: Email, 1: Name, 2: Org, 3: Password, 4: Processing, 5: Success
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        organizationName: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);
    const firstNameRef = useRef<HTMLInputElement>(null);
    const orgRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 0 && emailRef.current) emailRef.current.focus();
        else if (step === 1 && firstNameRef.current) firstNameRef.current.focus();
        else if (step === 2 && orgRef.current) orgRef.current.focus();
        else if (step === 3 && passwordRef.current) passwordRef.current.focus();
    }, [step]);

    const handleNext = () => {
        if (step === 0) {
            if (!formData.email || !formData.email.includes('@')) {
                setError('Please provide a valid identifier.');
                return;
            }
            setError(''); setStep(1);
        } else if (step === 1) {
            if (!formData.firstName || !formData.lastName) {
                setError('First and last name required.');
                return;
            }
            setError(''); setStep(2);
        } else if (step === 2) {
            if (!formData.organizationName) {
                setError('Organization name required.');
                return;
            }
            setError(''); setStep(3);
        } else if (step === 3) {
            if (!formData.password || formData.password.length < 8) {
                setError('Security key must be at least 8 characters.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Security keys do not match.');
                return;
            }
            setError(''); handleRegister();
        }
    };

    const handleRegister = async () => {
        setStep(4);
        try {
            await register(formData.email, formData.password, formData.firstName, formData.lastName, formData.organizationName);
            setStep(5);
            setTimeout(() => onSuccess(), 1500);
        } catch (err: any) {
            setError(err.message || 'Initialization failed.');
            setStep(3);
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
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '4px' }}>ENTERPRISE // NODE.INIT</div>
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
                                Phase 1 // Network Identifier
                            </h2>

                            <div style={{ position: 'relative', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        className="auth-flow-input"
                                        placeholder="Enter your email identifier"
                                        value={formData.email}
                                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <AnimatePresence>
                                        {formData.email && formData.email.includes('@') && (
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
                                    <Mail size={14} />
                                    {formData.email}
                                </motion.div>
                            </div>

                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                Phase 2 // Operator Designation
                            </h2>

                            <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        ref={firstNameRef}
                                        type="text"
                                        className="auth-flow-input"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <div className="auth-input-line">
                                        <div className="auth-input-line-active" />
                                    </div>
                                </div>

                                <div style={{ position: 'relative', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <input
                                            type="text"
                                            className="auth-flow-input"
                                            placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setError(''); }}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <AnimatePresence>
                                            {formData.firstName && formData.lastName && (
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
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                                <motion.div layoutId="email-chip" className="step-chip" onClick={() => setStep(0)}>
                                    <Mail size={14} />
                                    {formData.email}
                                </motion.div>
                                <motion.div layoutId="name-chip" className="step-chip" onClick={() => setStep(1)}>
                                    <User size={14} />
                                    {formData.firstName} {formData.lastName}
                                </motion.div>
                            </div>

                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                Phase 3 // Entity Classification
                            </h2>

                            <div style={{ position: 'relative', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <input
                                        ref={orgRef}
                                        type="text"
                                        className="auth-flow-input"
                                        placeholder="Organization Name"
                                        value={formData.organizationName}
                                        onChange={(e) => { setFormData({ ...formData, organizationName: e.target.value }); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <AnimatePresence>
                                        {formData.organizationName.length > 1 && (
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

                    {step === 3 && (
                        <motion.div
                            key="step-3"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                                <motion.div layoutId="name-chip" className="step-chip" onClick={() => setStep(1)}>
                                    <User size={14} />
                                    {formData.firstName} {formData.lastName}
                                </motion.div>
                                <motion.div layoutId="org-chip" className="step-chip" onClick={() => setStep(2)}>
                                    <Briefcase size={14} />
                                    {formData.organizationName}
                                </motion.div>
                            </div>

                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                Phase 4 // Security Protocol
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <input
                                                ref={passwordRef}
                                                type={showPassword ? 'text' : 'password'}
                                                className="auth-flow-input"
                                                placeholder="Enter secure key"
                                                value={formData.password}
                                                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                                                onKeyDown={handleKeyDown}
                                                style={{ paddingRight: '48px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '8px',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    padding: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '6px',
                                                    transition: 'color 0.2s, background 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                                    e.currentTarget.style.background = 'none';
                                                }}
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="auth-input-line">
                                        <div className="auth-input-line-active" />
                                    </div>
                                </div>

                                <div style={{ position: 'relative', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="auth-flow-input"
                                                placeholder="Verify secure key"
                                                value={formData.confirmPassword}
                                                onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setError(''); }}
                                                onKeyDown={handleKeyDown}
                                                style={{ paddingRight: '48px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '8px',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    padding: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '6px',
                                                    transition: 'color 0.2s, background 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                                    e.currentTarget.style.background = 'none';
                                                }}
                                                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {formData.password.length >= 8 && formData.password === formData.confirmPassword && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    className="auth-next-btn bg-emerald-500 hover:bg-emerald-400"
                                                    style={{ background: '#10b981' }}
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
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step >= 4 && (
                        <motion.div
                            key="step-4"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '64px' }}>
                                <motion.div layoutId="org-chip" className="step-chip">
                                    <Briefcase size={14} />
                                    {formData.organizationName}
                                </motion.div>
                                <motion.div layoutId="pass-chip" className="step-chip">
                                    <Lock size={14} />
                                    Security Key Established
                                </motion.div>
                            </div>

                            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step === 4 ? (
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
                                            ALLOCATING
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
                                style={{ marginTop: '24px', color: step === 5 ? '#34d399' : 'rgba(255,255,255,0.6)', fontSize: '14px', letterSpacing: '0.05em' }}
                            >
                                {step === 4 ? 'Generating RSA-4096 Keys...' : 'Node Provisioned. Redirecting...'}
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer */}
            {step < 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ position: 'absolute', bottom: '40px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}
                >
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        Already Provisioned?{' '}
                        <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                            Establish Connection
                        </button>
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <a href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</a>
                        <a href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</a>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
