import { prisma } from './config/database';
import { createNotification } from './services/notificationService';

async function run() {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user) {
        console.log('No user found');
        process.exit(1);
    }
    const userId = user.id;
    const orgId = user.organizationId;

    await createNotification({
        userId, organizationId: orgId,
        title: 'Platform Upgrade Complete',
        message: 'v4.2.0 deployed. All systems operational with 18% performance gain.',
        category: 'success', priority: 'medium', source: 'SYS_ADMIN',
        iconType: 'check', color: '#10b981',
    });

    await createNotification({
        userId, organizationId: orgId,
        title: 'Financial Model Drift Detected',
        message: 'Q4 revenue projections diverging +12.4% from historical baselines. Re-training recommended.',
        category: 'insight', priority: 'high', source: 'NEURAL_ENGINE',
        iconType: 'brain', color: '#8b5cf6',
        prediction: 'Model confidence dropping. Est. opportunity $1.2M if captured.',
        confidence: 88,
        actionLabel: 'View Model Dashboard',
        metadata: {
            sparklineData: [45, 52, 58, 65, 76, 82, 88, 95, 98, 105, 112]
        }
    });

    await createNotification({
        userId, organizationId: orgId,
        title: 'Cluster Node Failure',
        message: 'Primary data ingestion node-alpha-3 unresponsive. Traffic rerouted to secondary.',
        category: 'critical', priority: 'critical', source: 'INFRA_MONITOR',
        iconType: 'alert', color: '#ef4444',
        impactScore: 78,
        metadata: { relatedCount: 2 }
    });

    console.log('Test notifications injected for user', userId);
    process.exit(0);
}

run().catch(console.error);
