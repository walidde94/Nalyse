import { prisma } from '../config/database';
import { broadcastUpdate } from '../index';

export type NotificationCategory = 'info' | 'alert' | 'success' | 'warning' | 'error' | string;
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical' | string;

export interface CreateNotificationInput {
    userId: string;
    organizationId?: string;
    title: string;
    message: string;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    source?: string;
    iconType?: string;
    color?: string;
    actionLabel?: string;
    actionUrl?: string;
    prediction?: string;
    confidence?: number;
    impactScore?: number;
    metadata?: Record<string, any>;
}

/**
 * Get all notifications for a user, ordered by pinned first, then newest.
 */
export async function getUserNotifications(userId: string, options?: {
    category?: NotificationCategory;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
}) {
    const where: any = { userId };

    if (options?.category) {
        where.category = options.category;
    }
    if (options?.unreadOnly) {
        where.read = false;
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [items, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: [
                { pinned: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            skip: offset
        }),
        prisma.notification.count({ where })
    ]);

    return { items, total };
}

/**
 * Get unread count per category for the header badge.
 */
export async function getUnreadCounts(userId: string) {
    const results = await prisma.notification.groupBy({
        by: ['category'],
        where: {
            userId,
            read: false
        },
        _count: {
            _all: true
        }
    });

    const counts: Record<string, number> = { total: 0 };
    for (const r of results) {
        counts[r.category] = r._count._all;
        counts.total += r._count._all;
    }
    return counts;
}

/**
 * Create a new notification for a user. Returns the created entity.
 */
export async function createNotification(input: CreateNotificationInput) {
    const n = await prisma.notification.create({
        data: {
            userId: input.userId,
            organizationId: input.organizationId || null,
            title: input.title,
            message: input.message,
            category: input.category || 'info',
            priority: input.priority || 'medium',
            source: input.source || 'SYSTEM',
            iconType: input.iconType || 'bell',
            color: input.color || '#6366f1',
            actionLabel: input.actionLabel || null,
            actionUrl: input.actionUrl || null,
            prediction: input.prediction || null,
            confidence: input.confidence ?? null,
            impactScore: input.impactScore ?? null,
            metadata: input.metadata || {},
        }
    });
    broadcastUpdate('notification', { action: 'new', notification: n });
    return n;
}

/**
 * Send a notification to all users in an organization.
 */
export async function createOrgNotification(
    organizationId: string,
    input: Omit<CreateNotificationInput, 'userId' | 'organizationId'>
) {
    // Find all users in the org
    const users = await prisma.user.findMany({ where: { organizationId } });

    const notifications: any[] = [];
    for (const user of users) {
        const n = await createNotification({
            ...input,
            userId: user.id,
            organizationId,
        });
        notifications.push(n);
    }
    return notifications;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true }
    });
}

/**
 * Mark ALL notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
}

/**
 * Toggle pin status.
 */
export async function togglePin(id: string, userId: string) {
    const n = await prisma.notification.findFirst({ where: { id, userId } });
    if (!n) return null;

    return prisma.notification.update({
        where: { id: n.id },
        data: { pinned: !n.pinned }
    });
}

/**
 * Delete / dismiss a notification.
 */
export async function deleteNotification(id: string, userId: string) {
    return prisma.notification.deleteMany({
        where: { id, userId }
    });
}

/**
 * Delete all notifications for a user.
 */
export async function deleteAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
        where: { userId }
    });
}
