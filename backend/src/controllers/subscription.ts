
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { stripe } from '../config/stripe';

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { priceId } = req.body;

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization) {
            return res.status(404).json({ error: 'User or Organization not found' });
        }

        // Create or get Stripe Customer
        let customerId = user.organization.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user.id,
                    organizationId: user.organization.id
                }
            });
            customerId = customer.id;

            // Update Org with Customer ID
            user.organization.stripeCustomerId = customerId;
            await AppDataSource.getRepository(Organization).save(user.organization);
        }

        const createSession = async (cid: string) => {
            const priceToUse = priceId || process.env.STRIPE_PRICE_ID_PRO;
            if (!priceToUse) {
                console.error('[Stripe] Missing PRICE_ID_PRO in environment variables');
                throw new Error('Subscription price configuration missing');
            }

            return await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: cid,
                line_items: [
                    {
                        price: priceToUse,
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?canceled=true`,
                customer_update: {
                    address: 'auto',
                    name: 'auto'
                }
            });
        };

        let session;
        try {
            session = await createSession(customerId);
        } catch (error: any) {
            // If customer was deleted in Stripe manually
            if (error.code === 'resource_missing' || error.message.includes('No such customer')) {
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: {
                        userId: user.id,
                        organizationId: user.organization.id
                    }
                });
                customerId = newCustomer.id;
                user.organization.stripeCustomerId = customerId;
                await AppDataSource.getRepository(Organization).save(user.organization);

                session = await createSession(customerId);
            } else {
                throw error;
            }
        }

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization || !user.organization.stripeCustomerId) {
            return res.status(400).json({ error: 'No active billing account found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.organization.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const cancelSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization || !user.organization.stripeSubscriptionId) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        // We set it to cancel at period end so they don't lose access immediately
        const subscription = await stripe.subscriptions.update(user.organization.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        // Update local status if needed (though webhook will also handle this)
        // For now, we'll let the webhook/sync handle the final plan flip, 
        // but we could mark a 'canceling' state here.

        res.json({
            success: true,
            message: 'Subscription will be canceled at the end of the current billing period.',
            cancelAt: new Date(subscription.cancel_at! * 1000)
        });
    } catch (error: any) {
        console.error('Stripe Cancel Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization || !user.organization.stripeCustomerId) {
            return res.json({ transactions: [] });
        }

        const invoices = await stripe.invoices.list({
            customer: user.organization.stripeCustomerId,
            limit: 12
        });

        const transactions = invoices.data.map(inv => ({
            id: inv.id,
            amount: inv.amount_paid / 100,
            currency: inv.currency,
            status: inv.status,
            date: new Date(inv.created * 1000),
            pdf: inv.invoice_pdf,
            number: inv.number
        }));

        res.json({ transactions });
    } catch (error: any) {
        console.error('Stripe Transactions Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const requestRefund = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization || !user.organization.stripeCustomerId) {
            return res.status(400).json({ error: 'No active billing account' });
        }

        // Find the latest successful payment intent
        const paymentIntents = await stripe.paymentIntents.list({
            customer: user.organization.stripeCustomerId,
            limit: 1
        });

        if (paymentIntents.data.length === 0) {
            return res.status(404).json({ error: 'No transactions found to refund' });
        }

        const latestPI = paymentIntents.data[0];

        // Only allow refund if status is succeeded and within 24 hours (simulated policy)
        if (latestPI.status !== 'succeeded') {
            return res.status(400).json({ error: 'Latest payment is not eligible for refund' });
        }

        const refund = await stripe.refunds.create({
            payment_intent: latestPI.id,
            reason: 'requested_by_customer'
        });

        // Downgrade immediately on refund
        const org = user.organization;
        org.plan = 'free';
        org.stripeSubscriptionId = null;
        org.currentPeriodEnd = null;
        org.cancelAtPeriodEnd = false;
        org.storageLimit = 104857600; // 100MB
        org.fileLimit = 5;
        org.userLimit = 1;

        await AppDataSource.getRepository(Organization).save(org);

        user.plan = 'free';
        await userRepo.save(user);

        res.json({ success: true, refundId: refund.id });
    } catch (error: any) {
        console.error('Stripe Refund Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const syncSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization || !user.organization.stripeCustomerId) {
            return res.status(400).json({ error: 'No active billing account found' });
        }

        const org = user.organization;

        // Auto-downgrade if subscription is set to cancel and has expired
        const now = new Date();
        if (org.cancelAtPeriodEnd && org.currentPeriodEnd && new Date(org.currentPeriodEnd) <= now) {
            org.plan = 'free';
            org.storageLimit = 104857600; // 100MB
            org.fileLimit = 5;
            org.userLimit = 1;
            org.stripeSubscriptionId = null;
            org.currentPeriodEnd = null;
            org.cancelAtPeriodEnd = false;

            user.plan = 'free';
            user.subscriptionStatus = 'inactive';

            await AppDataSource.getRepository(Organization).save(org);
            await userRepo.save(user);

            return res.json({
                success: true,
                plan: 'free',
                message: 'Subscription has reached its end date and was downgraded to free.'
            });
        }

        try {
            // Fetch active subscriptions from Stripe
            const subscriptions = await stripe.subscriptions.list({
                customer: org.stripeCustomerId || undefined,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                const priceId = sub.items.data[0].price.id;
                console.log(`[SubscriptionSync] User ${userId} active sub: ${sub.id}, price: ${priceId}`);
                console.log(`[SubscriptionSync] Expected Pro: ${process.env.STRIPE_PRICE_ID_PRO}, Expected Enterprise: ${process.env.STRIPE_PRICE_ID_ENTERPRISE}`);

                // Update plan based on priceId
                if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
                    org.plan = 'pro';
                    org.storageLimit = 10737418240; // 10GB
                    org.fileLimit = 1000;
                    org.userLimit = 10;
                    user.plan = 'pro';
                } else if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) {
                    org.plan = 'enterprise';
                    org.storageLimit = 1099511627776; // 1TB
                    org.fileLimit = 10000;
                    org.userLimit = 100;
                    user.plan = 'enterprise';
                }

                org.stripeSubscriptionId = sub.id;
                org.currentPeriodEnd = new Date((sub as any).current_period_end * 1000);
                org.cancelAtPeriodEnd = (sub as any).cancel_at_period_end;
                if ((sub as any).start_date) {
                    org.subscriptionStartedAt = new Date((sub as any).start_date * 1000);
                }

                await AppDataSource.getRepository(Organization).save(org);
                await userRepo.save(user);

                return res.json({
                    success: true,
                    plan: org.plan,
                    currentPeriodEnd: org.currentPeriodEnd,
                    cancelAtPeriodEnd: org.cancelAtPeriodEnd,
                    subscriptionStartedAt: org.subscriptionStartedAt
                });
            } else {
                // No active subscriptions found - Downgrade to free
                org.plan = 'free';
                org.storageLimit = 5368709120; // 5GB
                org.fileLimit = 5;
                org.userLimit = 1;
                org.stripeSubscriptionId = null;
                org.currentPeriodEnd = null;
                org.cancelAtPeriodEnd = false;

                user.plan = 'free';
                user.subscriptionStatus = 'inactive';

                await AppDataSource.getRepository(Organization).save(org);
                await userRepo.save(user);
                return res.json({ success: true, plan: org.plan, message: 'Downgraded to free as no active subscriptions found' });
            }
        } catch (stripeError: any) {
            // If customer is deleted in Stripe, it returns 404
            if (stripeError.code === 'resource_missing' || stripeError.message.includes('No such customer')) {
                org.plan = 'free';
                org.storageLimit = 5368709120; // 5GB
                org.fileLimit = 5;
                org.userLimit = 1;
                org.stripeCustomerId = null;
                org.stripeSubscriptionId = null;
                user.plan = 'free';
                user.stripeCustomerId = null;
                user.subscriptionStatus = 'inactive';
                await AppDataSource.getRepository(Organization).save(org);
                await userRepo.save(user);
                return res.json({ success: true, plan: 'free', message: 'Customer not found in Stripe, reset to free' });
            }
            throw stripeError;
        }
    } catch (error: any) {
        console.error('Sync Subscription Error:', error);
        res.status(500).json({ error: error.message });
    }
};
