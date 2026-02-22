
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Organization } from '../entities/Organization';
import { User } from '../entities/User';
import { stripe } from '../config/stripe';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !endpointSecret) {
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Grant access (mostly idempotent via subscription)
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                await updateSubscriptionStatus(subscription);
                break;

            case 'customer.subscription.deleted':
                const subscriptionDeleted = event.data.object;
                await updateSubscriptionStatus(subscriptionDeleted, true);
                break;

            case 'customer.deleted':
                const customerDeleted = event.data.object;
                await handleCustomerDeleted(customerDeleted.id);
                break;

            default:
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

const updateSubscriptionStatus = async (subscription: any, isDeleted: boolean = false) => {
    const orgRepo = AppDataSource.getRepository(Organization);
    const customerId = subscription.customer;
    const organization = await orgRepo.findOne({ where: { stripeCustomerId: customerId } });

    if (!organization) {
        return;
    }

    if (isDeleted) {
        organization.plan = 'free';
        organization.stripeSubscriptionId = null;
        organization.storageLimit = 104857600; // 100MB
        organization.fileLimit = 5;
        organization.userLimit = 1;
        organization.currentPeriodEnd = null;
        organization.cancelAtPeriodEnd = false;
    } else {
        const priceId = subscription.items.data[0].price.id;
        const envEnterprisePrice = process.env.STRIPE_PRICE_ID_ENTERPRISE?.trim();

        // Simple logic for plan mapping
        if (priceId === envEnterprisePrice) {
            organization.plan = 'enterprise';
            organization.storageLimit = 1099511627776; // 1TB enterprise
            organization.fileLimit = 10000;
            organization.userLimit = 100;
        } else {
            organization.plan = 'pro';
            organization.storageLimit = 10737418240; // 10GB pro
            organization.fileLimit = 1000; // Effectively unlimited datasets
            organization.userLimit = 10;
        }

        organization.stripeSubscriptionId = subscription.id;
        organization.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        organization.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        if (subscription.start_date) {
            organization.subscriptionStartedAt = new Date(subscription.start_date * 1000);
        }
    }

    await orgRepo.save(organization);

    // Update all users in the organization
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.update({ organizationId: organization.id }, { plan: organization.plan });

    // Potentially notify users via websocket
    // broadcastUpdate('organization', { id: organization.id, plan: organization.plan });
};

const handleCustomerDeleted = async (customerId: string) => {
    const orgRepo = AppDataSource.getRepository(Organization);
    const organization = await orgRepo.findOne({ where: { stripeCustomerId: customerId } });

    if (!organization) {
        return;
    }

    organization.plan = 'free';
    organization.stripeCustomerId = null;
    organization.stripeSubscriptionId = null;
    organization.storageLimit = 104857600; // Reset to 100MB
    organization.fileLimit = 5;
    organization.userLimit = 1;

    await orgRepo.save(organization);

    // Update all users in the organization
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.update(
        { organizationId: organization.id },
        {
            plan: 'free',
            stripeCustomerId: null,
            subscriptionStatus: 'inactive'
        }
    );

};
