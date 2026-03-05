import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, User, Check, AlertCircle, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { Logo } from '../../components/common/Logo';
import { API_URL } from '../../config';

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
    const [showPassword, setShowPassword] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'token_received' | 'resetting' | 'reset_done' | 'error'>('idle');
    const [forgotMessage, setForgotMessage] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const newPasswordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 0 && emailInputRef.current) {
            emailInputRef.current.focus();
        } else if (step === 1 && passwordInputRef.current) {
            passwordInputRef.current.focus();
        }
    }, [step]);

    // Focus new password input when token is received
    useEffect(() => {
        if (forgotStatus === 'token_received' && newPasswordRef.current) {
            newPasswordRef.current.focus();
        }
    }, [forgotStatus]);

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

    const handleForgotPassword = async () => {
        const emailToReset = forgotEmail || email;
        if (!emailToReset || !emailToReset.includes('@')) {
            setForgotMessage('Please enter a valid email address.');
            setForgotStatus('error');
            return;
        }
        setForgotStatus('sending');
        try {
            const res = await fetch(`${API_URL}/api/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToReset }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            if (data.resetToken) {
                setResetToken(data.resetToken);
                setForgotStatus('token_received');
                setForgotMessage('');
            } else {
                // No account found (token not returned) — show generic message
                setForgotStatus('error');
                setForgotMessage('No account found with this email. Please check and try again.');
            }
        } catch {
            setForgotStatus('error');
            setForgotMessage('Unable to process request. Please try again later.');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setForgotMessage('New password must be at least 8 characters.');
            setForgotStatus('error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setForgotMessage('Passwords do not match.');
            setForgotStatus('error');
            return;
        }
        setForgotStatus('resetting');
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reset failed');
            setForgotStatus('reset_done');
            setForgotMessage('Password reset successful! You can now log in with your new password.');
            // Auto-return to login after 2 seconds
            setTimeout(() => {
                setShowForgotPassword(false);
                setForgotStatus('idle');
                setForgotMessage('');
                setNewPassword('');
                setConfirmNewPassword('');
                setResetToken('');
                setPassword('');
            }, 2500);
        } catch (err: any) {
            setForgotStatus('error');
            setForgotMessage(err.message || 'Password reset failed. Please try again.');
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

                            <AnimatePresence mode="wait">
                                {!showForgotPassword ? (
                                    <motion.div
                                        key="password-form"
                                        initial={{ opacity: 0, x: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                            Step 2 // Verification
                                        </h2>

                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        ref={passwordInputRef}
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="auth-flow-input"
                                                        placeholder="Enter your security key"
                                                        value={password}
                                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
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

                                        {/* Forgot Password Link */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(true);
                                                    setForgotEmail(email);
                                                    setForgotStatus('idle');
                                                    setForgotMessage('');
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'rgba(255,255,255,0.45)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    padding: '4px 0',
                                                    letterSpacing: '0.03em',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                                            >
                                                Forgot security key?
                                            </button>
                                        </motion.div>

                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertCircle size={14} /> {error}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="forgot-form"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 30 }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        {/* Back button + Title */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(false);
                                                    setForgotStatus('idle');
                                                    setForgotMessage('');
                                                    setNewPassword('');
                                                    setConfirmNewPassword('');
                                                    setResetToken('');
                                                }}
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: 'rgba(255,255,255,0.6)',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                                }}
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                            <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                                                Recovery // Reset Protocol
                                            </h2>
                                        </div>

                                        {/* Phase 1: Email input */}
                                        {(forgotStatus === 'idle' || forgotStatus === 'sending' || (forgotStatus === 'error' && !resetToken)) && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '28px' }}>
                                                    Enter your registered email to verify your identity and set a new password.
                                                </p>

                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                                            <Mail size={16} style={{ position: 'absolute', left: '2px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                                            <input
                                                                type="email"
                                                                className="auth-flow-input"
                                                                placeholder="Email identifier"
                                                                value={forgotEmail}
                                                                onChange={(e) => { setForgotEmail(e.target.value); if (forgotStatus === 'error') { setForgotStatus('idle'); setForgotMessage(''); } }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleForgotPassword(); } }}
                                                                style={{ paddingLeft: '28px' }}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={handleForgotPassword}
                                                            disabled={forgotStatus === 'sending'}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '10px 20px',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: forgotStatus === 'sending'
                                                                    ? 'rgba(59,130,246,0.3)'
                                                                    : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                                                color: 'white',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.05em',
                                                                cursor: forgotStatus === 'sending' ? 'wait' : 'pointer',
                                                                textTransform: 'uppercase' as const,
                                                                whiteSpace: 'nowrap' as const,
                                                                opacity: forgotStatus === 'sending' ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {forgotStatus === 'sending' ? (
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                                    style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                                                                />
                                                            ) : (
                                                                'Verify'
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                    <div className="auth-input-line">
                                                        <div className="auth-input-line-active" />
                                                    </div>
                                                </div>

                                                {forgotStatus === 'error' && forgotMessage && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <AlertCircle size={14} /> {forgotMessage}
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Phase 2: New password input */}
                                        {(forgotStatus === 'token_received' || forgotStatus === 'resetting' || (forgotStatus === 'error' && resetToken)) && (
                                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '28px' }}>
                                                    Identity verified for <span style={{ color: '#60a5fa', fontWeight: 600 }}>{forgotEmail}</span>. Set your new security key below.
                                                </p>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                                    {/* New Password */}
                                                    <div style={{ position: 'relative', width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    ref={newPasswordRef}
                                                                    type={showNewPassword ? 'text' : 'password'}
                                                                    className="auth-flow-input"
                                                                    placeholder="New security key (min. 8 characters)"
                                                                    value={newPassword}
                                                                    onChange={(e) => { setNewPassword(e.target.value); if (forgotStatus === 'error') { setForgotStatus('token_received'); setForgotMessage(''); } }}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResetPassword(); } }}
                                                                    style={{ paddingRight: '48px' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                                    style={{
                                                                        position: 'absolute', right: '8px', background: 'none', border: 'none',
                                                                        cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '6px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        borderRadius: '6px', transition: 'color 0.2s, background 0.2s',
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none'; }}
                                                                    title={showNewPassword ? 'Hide password' : 'Show password'}
                                                                >
                                                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="auth-input-line"><div className="auth-input-line-active" /></div>
                                                    </div>

                                                    {/* Confirm New Password */}
                                                    <div style={{ position: 'relative', width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type={showConfirmNewPassword ? 'text' : 'password'}
                                                                    className="auth-flow-input"
                                                                    placeholder="Confirm new security key"
                                                                    value={confirmNewPassword}
                                                                    onChange={(e) => { setConfirmNewPassword(e.target.value); if (forgotStatus === 'error') { setForgotStatus('token_received'); setForgotMessage(''); } }}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResetPassword(); } }}
                                                                    style={{ paddingRight: '48px' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                                    style={{
                                                                        position: 'absolute', right: '8px', background: 'none', border: 'none',
                                                                        cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '6px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        borderRadius: '6px', transition: 'color 0.2s, background 0.2s',
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none'; }}
                                                                    title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                                                                >
                                                                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                </button>
                                                            </div>
                                                            <AnimatePresence>
                                                                {newPassword.length >= 8 && newPassword === confirmNewPassword && (
                                                                    <motion.button
                                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                                        onClick={handleResetPassword}
                                                                        disabled={forgotStatus === 'resetting'}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                                                                            background: forgotStatus === 'resetting'
                                                                                ? 'rgba(16,185,129,0.3)'
                                                                                : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                                            color: 'white', fontSize: '12px', fontWeight: 600,
                                                                            letterSpacing: '0.05em', cursor: forgotStatus === 'resetting' ? 'wait' : 'pointer',
                                                                            textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
                                                                        }}
                                                                    >
                                                                        {forgotStatus === 'resetting' ? (
                                                                            <motion.div
                                                                                animate={{ rotate: 360 }}
                                                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                                                style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                                                                            />
                                                                        ) : (
                                                                            'Reset'
                                                                        )}
                                                                    </motion.button>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                        <div className="auth-input-line"><div className="auth-input-line-active" /></div>
                                                    </div>
                                                </div>

                                                {forgotStatus === 'error' && forgotMessage && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <AlertCircle size={14} /> {forgotMessage}
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Phase 3: Success */}
                                        {forgotStatus === 'reset_done' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{
                                                    padding: '24px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(52,211,153,0.08)',
                                                    border: '1px solid rgba(52,211,153,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '14px',
                                                }}
                                            >
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: 'rgba(52,211,153,0.15)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <Check size={16} style={{ color: '#34d399' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
                                                        Security Key Reset Complete
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                                                        {forgotMessage}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
