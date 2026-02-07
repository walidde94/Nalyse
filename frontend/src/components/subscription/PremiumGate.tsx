import { useAuth } from '../../contexts/AuthContext';

interface PremiumGateProps {
    children: React.ReactNode;
    feature: string;
    description?: string;
    onUpgrade: () => void;
}

export const PremiumGate = ({ children, feature, description, onUpgrade }: PremiumGateProps) => {
    const { user } = useAuth();
    const plan = (user as any)?.organization?.plan || 'free';

    if (plan !== 'free') {
        return <>{children}</>;
    }

    return (
        <div className="flex-col items-center justify-center gap-6 fade-in" style={{
            height: '100%',
            minHeight: '400px',
            padding: '48px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '60%',
                height: '200%',
                background: 'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
                opacity: 0.5,
                zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'var(--primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    🔒
                </div>

                <div className="flex-col gap-2">
                    <h2 className="text-h2">Unlock {feature}</h2>
                    <p className="text-sec" style={{ maxWidth: '450px', fontSize: '1.1rem' }}>
                        {description || `Professional analytics tools like ${feature} are available on our Professional plan.`}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button className="btn btn-primary btn-lg" onClick={onUpgrade}>
                        Upgrade to Pro
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => window.open('https://nalyse.ai/demo', '_blank')}>
                        See how it works
                    </button>
                </div>

                <div className="flex items-center gap-8 mt-4" style={{ opacity: 0.6 }}>
                    <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--success)' }}>✓</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Unlimited Datasets</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--success)' }}>✓</span>
                        <span className="text-xs font-bold uppercase tracking-wider">10GB Storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--success)' }}>✓</span>
                        <span className="text-xs font-bold uppercase tracking-wider">SQL Query Engine</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
