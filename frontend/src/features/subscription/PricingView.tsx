import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

const PLANS = [
    {
        id: 'free',
        name: 'Starter',
        price: '$0',
        period: '',
        description: 'Perfect for individual data explorers',
        features: [
            '100MB Storage',
            'Basic Visualizations',
            'Standard AI Insights',
            '5 Datasets limit',
            'Community Support'
        ],
        cta: 'Active Plan',
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
        period: '',
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
    const { user, token, syncSubscription, refreshProfile, requestSubscriptionCancellation } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const currentPlan = (user as any)?.organization?.plan || 'free';

    useEffect(() => {
        syncSubscription();
    }, []);

    const handleSync = async () => {
        setLoading('sync');
        try {
            const result = await syncSubscription();
            if (result && result.success) {
                addToast(result.message || 'Plan status synchronized', 'success');
            } else if (result && !result.success) {
                addToast(result.message || 'You are still on the Starter plan.', 'warning');
            } else {
                addToast('Sync failed locally. Please refresh.', 'error');
            }
        } catch (error: any) {
            addToast(`Sync error: ${error.message || 'Unknown error'}`, 'error');
        }
        setLoading(null);
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel your Professional subscription? You will keep your features until the end of the current billing cycle.')) {
            return;
        }

        setLoading('cancel');
        const success = await requestSubscriptionCancellation();
        if (success) {
            addToast('Subscription cancellation requested. It will end at the close of your current period.', 'success');
        } else {
            addToast('Cancellation failed. Please use the Billing Portal.', 'error');
        }
        setLoading(null);
    };

    const handleUpgrade = async (planId: string) => {
        if (planId === 'enterprise') {
            window.location.href = 'mailto:sales@nalyse.ai';
            return;
        }

        setLoading(planId);
        try {
            const res = await fetch(`${API_URL}/api/subscription/checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({}) // Backend defaults to Pro price ID
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to start checkout');
            }

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Checkout Error:', error);
            addToast(error.message || 'Failed to initiate checkout', 'error');
            setLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setLoading('portal');
        try {
            const res = await fetch(`${API_URL}/api/subscription/portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to open portal');

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No portal URL returned');
            }
        } catch (error) {
            console.error(error);
            addToast('Failed to open billing portal', 'error');
            setLoading(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    const org = (user as any)?.organization;
    const isCancelled = org?.cancelAtPeriodEnd;

    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (currentPlan === 'pro' || currentPlan === 'enterprise') {
            fetchTransactions();
        }
    }, [currentPlan]);

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/subscription/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
            }
        } catch (e) {
            console.error('Failed to fetch transactions:', e);
        }
    };

    const handleRefundRequest = async () => {
        if (!window.confirm('Request a refund for your latest Professional charge? This will immediately revert your account to the Starter plan.')) {
            return;
        }

        setLoading('refund');
        try {
            const res = await fetch(`${API_URL}/api/subscription/refund`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Refund processed successfully. Your account has been downgraded.', 'success');
                await syncSubscription();
            } else {
                addToast('Refund failed. Please contact support@nalyse.ai', 'error');
            }
        } catch (e) {
            addToast('An error occurred during refund request.', 'error');
        }
        setLoading(null);
    };

    return (
        <div style={{ padding: '64px 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }} className="fade-in">
            <div style={{ textAlign: 'center', width: '100%' }}>
                <h1 className="text-h1" style={{ marginBottom: '16px' }}>Simple, transparent pricing</h1>
                <p className="text-sec" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that's right for your data needs. No hidden fees.
                </p>

                {currentPlan === 'pro' && (
                    <div style={{
                        marginTop: '32px',
                        padding: '24px',
                        borderRadius: '16px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        maxWidth: '500px',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', gap: '48px', textAlign: 'left' }}>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Member Since</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(org?.subscriptionStartedAt)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: isCancelled ? 'var(--danger)' : 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {isCancelled ? 'Subscription Ends' : 'Next Billing Date'}
                                </p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: isCancelled ? 'var(--danger)' : 'var(--text-primary)' }}>{formatDate(org?.currentPeriodEnd)}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button onClick={handleManageSubscription} className="btn btn-secondary" style={{ flex: 1 }} disabled={!!loading}>
                                {loading === 'portal' ? 'Loading Portal...' : 'Manage Billing'}
                            </button>
                            {!isCancelled && (
                                <button
                                    onClick={handleCancel}
                                    className="btn"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--danger)',
                                        color: 'var(--danger)',
                                        flex: 1
                                    }}
                                    disabled={!!loading}
                                >
                                    {loading === 'cancel' ? 'Processing...' : 'Cancel Plan'}
                                </button>
                            )}
                        </div>

                        {isCancelled && (
                            <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600, marginTop: '8px' }}>
                                Your access will remain active until {formatDate(org?.currentPeriodEnd)}.
                            </p>
                        )}

                        {!isCancelled && (
                            <button
                                onClick={handleRefundRequest}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-tertiary)',
                                    fontSize: '11px',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    marginTop: '8px'
                                }}
                                disabled={!!loading}
                            >
                                {loading === 'refund' ? 'Refund in progress...' : 'Request refund for latest charge'}
                            </button>
                        )}
                    </div>
                )}

                {currentPlan === 'free' && (
                    <div style={{ marginTop: '24px' }}>
                        <button
                            onClick={handleSync}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                fontSize: '14px',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                opacity: loading === 'sync' ? 0.6 : 1
                            }}
                            disabled={!!loading}
                        >
                            {loading === 'sync' ? 'Syncing...' : 'Already subscribed? Click here to sync status'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
                width: '100%'
            }}>
                {PLANS.map((plan) => {
                    // Logic to determine button state
                    const isCurrentPlan = plan.id === currentPlan;
                    const isPlanFree = plan.id === 'free';
                    const isPlanEnterprise = plan.id === 'enterprise';

                    let buttonText = plan.cta;
                    let isDisabled = false;
                    let action = () => handleUpgrade(plan.id);

                    if (isCurrentPlan) {
                        buttonText = 'Active Plan';
                        isDisabled = true;
                    } else if (currentPlan === 'pro' && isPlanFree) {
                        // Downgrade logic could go here, or handled via portal
                        buttonText = 'Downgrade via Portal';
                        action = handleManageSubscription;
                        isDisabled = false;
                    }

                    return (
                        <div
                            key={plan.id}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '48px 32px',
                                border: plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                                background: plan.highlight ? 'var(--bg-card)' : 'var(--bg-app)',
                                transform: plan.highlight ? 'scale(1.05)' : 'none',
                                zIndex: plan.highlight ? 2 : 1,
                                boxShadow: plan.highlight ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                position: 'relative'
                            }}
                        >
                            {plan.highlight && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: '16px',
                                    background: 'var(--primary)',
                                    color: 'var(--text-primary)',
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
                                className={`btn ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                                style={{ width: '100%', marginBottom: '40px' }}
                                disabled={isDisabled || !!loading}
                                onClick={action}
                            >
                                {loading === plan.id ? 'Processing...' : buttonText}
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Includes:</p>
                                {plan.features.map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                                        <span style={{ color: 'var(--success)' }}>✓</span>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {transactions.length > 0 && (
                <div style={{ width: '100%', marginTop: '32px' }}>
                    <h2 className="text-h2" style={{ marginBottom: '24px', fontSize: '20px' }}>Transaction History</h2>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-default)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Invoice</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '14px' }}>
                                        <td style={{ padding: '20px 24px', fontWeight: 600 }}>{tx.number}</td>
                                        <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{formatDate(tx.date)}</td>
                                        <td style={{ padding: '20px 24px', fontWeight: 700 }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                background: tx.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: tx.status === 'paid' ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <a href={tx.pdf} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                PDF ↗
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <p className="text-sec">
                Need more? <button style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>Contact us</button> for custom limits and enterprise features.
            </p>
        </div>
    );
};
