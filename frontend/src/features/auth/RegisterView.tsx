import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, Eye, EyeOff } from 'lucide-react';

interface RegisterViewProps {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onSuccess }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        organizationName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain a number';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setIsLoading(true);

        try {
            await register(
                formData.email,
                formData.password,
                formData.firstName,
                formData.lastName,
                formData.organizationName
            );
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(''); // Clear error on input change
    };

    const passwordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'var(--danger)' };
        if (strength === 3) return { strength, label: 'Fair', color: 'var(--warning)' };
        if (strength === 4) return { strength, label: 'Good', color: 'var(--primary)' };
        return { strength, label: 'Strong', color: 'var(--success)' };
    };

    const pwStrength = passwordStrength(formData.password);

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-app)', padding: '20px' }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '0%', left: '0%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>

            <div className="card glass" style={{ maxWidth: '540px', width: '100%', padding: '64px', zIndex: 1, border: '1px solid var(--border-highlight)' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 20px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: 'var(--shadow-primary)'
                    }}>
                        <BarChart3 size={28} />
                    </div>
                    <h1 className="text-h2" style={{ fontSize: '2.25rem', marginBottom: '8px' }}>Create Account</h1>
                    <p className="text-sec">Join the next generation of data-driven teams</p>
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

                {/* Register Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Name Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label htmlFor="firstName" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                First Name
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                className="input"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                className="input"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Organization */}
                    <div>
                        <label htmlFor="organizationName" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Organization Name
                        </label>
                        <input
                            id="organizationName"
                            type="text"
                            className="input"
                            placeholder="Acme Corp"
                            value={formData.organizationName}
                            onChange={(e) => handleChange('organizationName', e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password */}
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
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                                disabled={isLoading}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="btn btn-icon btn-sm btn-ghost"
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

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: '4px',
                                                borderRadius: '2px',
                                                background: i <= pwStrength.strength ? pwStrength.color : 'var(--border-default)',
                                                transition: 'background 0.3s ease'
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs" style={{ color: pwStrength.color }}>
                                    {pwStrength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            className="input"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
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

                {/* Login Link */}
                <div style={{ textAlign: 'center' }}>
                    <p className="text-sm text-secondary">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="btn btn-ghost btn-sm"
                            style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}
                        >
                            Sign in
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p className="text-xs text-secondary">
                        By creating an account, you agree to our{' '}
                        <a href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
