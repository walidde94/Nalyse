
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2026-01-28.clover', // Update to match expected version in build error
});

export const PRODUCTS = {
    FREE: {
        id: 'free',
        name: 'Starter',
        storageLimit: 100 * 1024 * 1024, // 100MB
        fileLimit: 5,
        features: ['basic_viz', 'standard_ai']
    },
    PRO: {
        id: 'pro',
        name: 'Professional',
        priceId: process.env.STRIPE_PRICE_ID_PRO,
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
        fileLimit: 1000, // Effectively unlimited
        features: ['basic_viz', 'standard_ai', 'sql_engine', 'correlation', 'advanced_export']
    },
    ENTERPRISE: {
        id: 'enterprise',
        name: 'Enterprise',
        storageLimit: 1000 * 1024 * 1024 * 1024, // 1TB
        fileLimit: -1, // Unlimited
        features: ['all']
    }
};

export const getPlanFromPriceId = (priceId: string) => {
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
    return 'free'; // Default fallback
};
