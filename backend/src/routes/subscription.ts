
import { createCheckoutSession, createPortalSession, syncSubscriptionStatus, cancelSubscription, getTransactions, requestRefund } from '../controllers/subscription';
import { handleStripeWebhook } from '../controllers/webhooks';
import { authenticate } from '../middleware/auth';
import express, { Router } from 'express';

const router = Router();

router.post('/checkout-session', authenticate, createCheckoutSession);
router.post('/portal-session', authenticate, createPortalSession);
router.post('/sync-status', authenticate, syncSubscriptionStatus);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/transactions', authenticate, getTransactions);
router.post('/refund', authenticate, requestRefund);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
