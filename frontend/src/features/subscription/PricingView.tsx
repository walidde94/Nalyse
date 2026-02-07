import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

const PLANS = [
    {
        id: 'free',
        name: 'Starter',
        price: '$0',
        description: 'Perfect for individual data explorers',
        features: [
            '100MB Storage',
            'Basic Visualizations',
            'Standard AI Insights',
            '5 Datasets limit',
            'Community Support'
        ],
        cta: 'Current Plan',
        isCurrent: true,
        highlight: false
    },
    {
        id: 'pro',
        name: 'Professional',
        price: '$29',
        period: '/mo',
        description: 'Advanced tools for power users and analysts',
        features: [
            '10GB Storage',
            'SQL Query Engine',
            'Correlation Analysis',
            'Unlimited Datasets',
            'Priority Support',
            'Shareable Live Reports'
        ],
        cta: 'Upgrade to Pro',
        isCurrent: false,
        highlight: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'Dedicated resources for large scale teams',
        features: [
            'Unlimited Storage',
            'Team Collaboration',
            'Audit Logs & SSO',
            'White-label Reporting',
            'Dedicated Account Manager',
            'Custom API Access'
        ],
        cta: 'Contact Sales',
        isCurrent: false,
        highlight: false
    }
];

export const PricingView = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const currentPlan = (user as any)?.organization?.plan || 'free';

    const handleUpgrade = async (planId: string) => {
        if (planId === currentPlan) return;
        if (planId === 'free') return;
        if (planId === 'enterprise') {
            window.location.href = 'mailto:sales@nalyse.ai';
            return;
        }

        setLoading(planId);
        // Simulate Stripe Checkout
        setTimeout(() => {
            addToast(`Processing your ${planId} subscription...`, 'info');
            setTimeout(() => {
                setLoading(null);
                addToast('Payment Successful! Welcome to Pro.', 'success');
                // In a real app, we'd redirect to Stripe or update backend
                onClose();
            }, 2000);
        }, 1000);
    };

    return (
        <div className="flex-col items-center gap-12 fade-in" style={{ padding: '64px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 className="text-h1" style={{ marginBottom: '16px' }}>Simple, transparent pricing</h1>
                <p className="text-sec" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that's right for your data needs. No hidden fees.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
                width: '100%'
            }}>
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className="card flex-col"
                        style={{
                            padding: '48px 32px',
                            border: plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                            background: plan.highlight ? 'var(--bg-card)' : 'var(--bg-app)',
                            transform: plan.highlight ? 'scale(1.05)' : 'none',
                            zIndex: plan.highlight ? 2 : 1,
                            boxShadow: plan.highlight ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                        }}
                    >
                        {plan.highlight && (
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>
                                MOST POPULAR
                            </div>
                        )}
                        <h3 className="text-h3" style={{ fontSize: '24px', marginBottom: '8px' }}>{plan.name}</h3>
                        <p className="text-sec" style={{ marginBottom: '32px', minHeight: '48px' }}>{plan.description}</p>

                        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{plan.period}</span>
                        </div>

                        <button
                            className={`btn ${plan.id === currentPlan ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                            style={{ width: '100%', marginBottom: '40px' }}
                            disabled={plan.id === currentPlan || !!loading}
                            onClick={() => handleUpgrade(plan.id)}
                        >
                            {loading === plan.id ? 'Connecting...' : plan.id === currentPlan ? 'Active Plan' : plan.cta}
                        </button>

                        <div className="flex-col gap-4">
                            <p style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Includes:</p>
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3" style={{ fontSize: '15px' }}>
                                    <span style={{ color: 'var(--success)' }}>✓</span>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-sec">
                Need more? <button style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>Contact us</button> for custom limits and enterprise features.
            </p>
        </div>
    );
};
