import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_URL } from '../../config';

const getPlans = (t: (key: string) => string) => [
    {
        id: 'free',
        name: t('pricing.plans.starter.name'),
        price: '$0',
        period: '',
        description: t('pricing.plans.starter.desc'),
        features: [
            t('pricing.features.storage100'),
            t('pricing.features.vis'),
            t('pricing.features.ai'),
            t('pricing.features.datasets5'),
            t('pricing.features.community')
        ],
        cta: t('pricing.activePlan'),
        isCurrent: true,
        highlight: false
    },
    {
        id: 'pro',
        name: t('pricing.plans.pro.name'),
        price: '$29',
        period: '/mo',
        description: t('pricing.plans.pro.desc'),
        features: [
            t('pricing.features.storage10'),
            t('pricing.features.sql'),
            t('pricing.features.correlation'),
            t('pricing.features.unlimited'),
            t('pricing.features.priority'),
            t('pricing.features.live')
        ],
        cta: t('pricing.upgradePro'),
        isCurrent: false,
        highlight: true
    },
    {
        id: 'enterprise',
        name: t('pricing.plans.enterprise.name'),
        price: t('pricing.plans.enterprise.price') || 'Custom',
        period: '',
        description: t('pricing.plans.enterprise.desc'),
        features: [
            t('pricing.features.storageInf'),
            t('pricing.features.collab'),
            t('pricing.features.audit'),
            t('pricing.features.white'),
            t('pricing.features.manager'),
            t('pricing.features.api')
        ],
        cta: t('pricing.contactSales'),
        isCurrent: false,
        highlight: false
    }
];

export const PricingView = ({ onClose }: { onClose: () => void }) => {
    const { user, token, syncSubscription, refreshProfile, requestSubscriptionCancellation } = useAuth();
    const { addToast } = useToast();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState<string | null>(null);

    const PLANS = getPlans(t);

    const currentPlan = (user as any)?.organization?.plan || 'free';

    useEffect(() => {
        syncSubscription();
    }, []);

    const handleSync = async () => {
        setLoading('sync');
        try {
            const result = await syncSubscription();
            if (result && result.success) {
                addToast(result.message || t('pricing.syncSuccess') || 'Plan status synchronized', 'success');
            } else if (result && !result.success) {
                addToast(result.message || t('pricing.syncWarning') || 'You are still on the Starter plan.', 'warning');
            } else {
                addToast(t('pricing.syncError') || 'Sync failed locally. Please refresh.', 'error');
            }
        } catch (error: any) {
            addToast(`${t('pricing.syncError')}: ${error.message || 'Unknown error'}`, 'error');
        }
        setLoading(null);
    };

    const handleCancel = async () => {
        if (!window.confirm(t('pricing.cancelConfirm') || 'Are you sure you want to cancel your Professional subscription? You will keep your features until the end of the current billing cycle.')) {
            return;
        }

        setLoading('cancel');
        const success = await requestSubscriptionCancellation();
        if (success) {
            addToast(t('pricing.cancelSuccess') || 'Subscription cancellation requested. It will end at the close of your current period.', 'success');
        } else {
            addToast(t('pricing.cancelError') || 'Cancellation failed. Please use the Billing Portal.', 'error');
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
            addToast(t('pricing.portalError') || 'Failed to open billing portal', 'error');
            setLoading(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
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
        if (!window.confirm(t('pricing.refundConfirm') || 'Request a refund for your latest Professional charge? This will immediately revert your account to the Starter plan.')) {
            return;
        }

        setLoading('refund');
        try {
            const res = await fetch(`${API_URL}/api/subscription/refund`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                addToast(t('pricing.refundSuccess') || 'Refund processed successfully. Your account has been downgraded.', 'success');
                await syncSubscription();
            } else {
                addToast(t('pricing.refundError') || 'Refund failed. Please contact support@nalyse.ai', 'error');
            }
        } catch (e) {
            addToast(t('pricing.refundError') || 'An error occurred during refund request.', 'error');
        }
        setLoading(null);
    };

    return (
        <div style={{ padding: '64px 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }} className="fade-in">
            <div style={{ textAlign: 'center', width: '100%' }}>
                <h1 className="text-h1" style={{ marginBottom: '16px' }}>{t('pricing.title')}</h1>
                <p className="text-sec" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    {t('pricing.subtitle')}
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
                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('pricing.memberSince')}</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(org?.subscriptionStartedAt)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: isCancelled ? 'var(--danger)' : 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {isCancelled ? t('pricing.subEnds') : t('pricing.nextBilling')}
                                </p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: isCancelled ? 'var(--danger)' : 'var(--text-primary)' }}>{formatDate(org?.currentPeriodEnd)}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button onClick={handleManageSubscription} className="btn btn-secondary" style={{ flex: 1 }} disabled={!!loading}>
                                {loading === 'portal' ? t('common.loading') : t('pricing.manageBilling')}
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
                                    {loading === 'cancel' ? t('analysis.query.processing') : t('pricing.cancelPlan')}
                                </button>
                            )}
                        </div>

                        {isCancelled && (
                            <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600, marginTop: '8px' }}>
                                {t('pricing.cancelDesc').replace('{date}', formatDate(org?.currentPeriodEnd))}
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
                                {loading === 'refund' ? t('analysis.query.processing') : t('pricing.refundRequest')}
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
                            {loading === 'sync' ? t('connectors.syncing') : t('pricing.syncStatus')}
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
                        buttonText = t('pricing.activePlan');
                        isDisabled = true;
                    } else if (currentPlan === 'pro' && isPlanFree) {
                        // Downgrade logic could go here, or handled via portal
                        buttonText = t('pricing.downgradePortal') || 'Downgrade via Portal';
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
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 700
                                }}>
                                    {t('pricing.popular')}
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
                                {loading === plan.id ? t('analysis.query.processing') : buttonText}
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{t('pricing.includes')}</p>
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
                    <h2 className="text-h2" style={{ marginBottom: '24px', fontSize: '20px' }}>{t('pricing.history')}</h2>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-default)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('pricing.invoice')}</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('pricing.date')}</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('pricing.amount')}</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('pricing.status')}</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('pricing.receipt')}</th>
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
                {t('pricing.needMore')} <button style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>{t('pricing.contactUs')}</button> {t('pricing.customLimits')}
            </p>
        </div>
    );
};
