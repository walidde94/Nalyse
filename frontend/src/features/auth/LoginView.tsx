import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onSuccess }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            background: 'var(--bg-app)',
            padding: '20px'
        }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>

            <div className="card glass" style={{ maxWidth: '480px', width: '100%', padding: '64px', zIndex: 1, border: '1px solid var(--border-highlight)', margin: 'auto' }}>
                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        margin: '0 auto 24px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: 'var(--shadow-primary)'
                    }}>
                        <BarChart3 size={32} />
                    </div>
                    <h1 className="text-h2" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Welcome Back</h1>
                    <p className="text-sec">Modern analytics for forward thinkers</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="fade-in" style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '24px',
                        color: 'var(--danger)',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label htmlFor="email" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="btn btn-icon btn-ghost btn-sm"
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            >
                                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    margin: '32px 0',
                    opacity: 0.5
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }}></div>
                    <span className="text-sm">OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }}></div>
                </div>

                {/* Register Link */}
                <div style={{ textAlign: 'center' }}>
                    <p className="text-sm text-secondary">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="btn btn-ghost btn-sm"
                            style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}
                        >
                            Create one now
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p className="text-xs text-secondary">
                        By signing in, you agree to our{' '}
                        <a href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
