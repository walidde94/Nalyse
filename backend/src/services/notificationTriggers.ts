/**
 * Centralized Notification Trigger Module
 * ──────────────────────────────────────────────────────────────────────
 * Every platform event that should generate a notification flows through
 * this module. Each trigger checks the recipient's notification preferences
 * before persisting, ensuring user control is respected.
 */

import { prisma } from '../config/database';
import { createNotification, CreateNotificationInput } from './notificationService';

// ── Preference Gate ────────────────────────────────────────────────────
/**
 * Check if a user has opted-in to a specific notification category.
 * Defaults to true (opt-out model) so notifications work out-of-the-box.
 */
async function isNotificationAllowed(userId: string, prefKey: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true }
        });
        const prefs = (user?.notificationPreferences as Record<string, any>) || {};
        // Opt-out model: if the key is not explicitly set to false, it's allowed
        return prefs[prefKey] !== false;
    } catch {
        return true; // On error, default to allowing
    }
}

/**
 * Create a notification only if the user's preferences allow it.
 */
async function createIfAllowed(prefKey: string, input: CreateNotificationInput) {
    const allowed = await isNotificationAllowed(input.userId, prefKey);
    if (!allowed) {
        return null;
    }
    return createNotification(input);
}

// ── File & Analysis Triggers ───────────────────────────────────────────

export async function triggerFileUploaded(userId: string, organizationId: string | null, filename: string) {
    return createIfAllowed('file_uploads', {
        userId,
        organizationId,
        title: 'Dataset Uploaded',
        message: `"${filename}" has been uploaded successfully and is ready for processing.`,
        category: 'success',
        priority: 'low',
        source: 'DATA_ENGINE',
        iconType: 'upload',
        color: '#10b981',
        actionLabel: 'View Files',
        actionUrl: '/dashboard',
    });
}

export async function triggerAnalysisCompleted(
    userId: string,
    organizationId: string | null,
    filename: string,
    fileId: string,
    durationMs: number
) {
    const durationSec = (durationMs / 1000).toFixed(1);
    return createIfAllowed('analysis_complete', {
        userId,
        organizationId,
        title: 'Analysis Complete',
        message: `Neural analysis for "${filename}" completed in ${durationSec}s. Insights are ready.`,
        category: 'success',
        priority: 'medium',
        source: 'NEURAL_ENGINE',
        iconType: 'chart',
        color: '#6366f1',
        actionLabel: 'View Results',
        actionUrl: `/analysis/${fileId}`,
        metadata: { fileId, durationMs },
    });
}

export async function triggerAnalysisFailed(
    userId: string,
    organizationId: string | null,
    filename: string,
    errorMessage?: string
) {
    return createIfAllowed('analysis_complete', {
        userId,
        organizationId,
        title: 'Analysis Failed',
        message: `Analysis for "${filename}" encountered an error${errorMessage ? ': ' + errorMessage.slice(0, 120) : '.'}`,
        category: 'error',
        priority: 'high',
        source: 'NEURAL_ENGINE',
        iconType: 'alert',
        color: '#ef4444',
    });
}

// ── Scheduled Report Triggers ──────────────────────────────────────────

export async function triggerReportGenerated(
    userId: string,
    organizationId: string | null,
    reportName: string,
    reportUrl: string
) {
    return createIfAllowed('scheduled_reports', {
        userId,
        organizationId,
        title: 'Report Ready',
        message: `Your scheduled report "${reportName}" has been generated and is ready for download.`,
        category: 'info',
        priority: 'medium',
        source: 'REPORT_ENGINE',
        iconType: 'file',
        color: '#8b5cf6',
        actionLabel: 'Download Report',
        actionUrl: reportUrl,
        metadata: { reportName },
    });
}

// ── Collaboration Triggers ─────────────────────────────────────────────

export async function triggerDirectMessage(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
) {
    return createIfAllowed('direct_messages', {
        userId: recipientUserId,
        title: `Message from ${senderName}`,
        message: messagePreview.slice(0, 200),
        category: 'info',
        priority: 'medium',
        source: 'CHAT',
        iconType: 'message',
        color: '#3b82f6',
        actionLabel: 'Open Chat',
        actionUrl: `/private-chat`,
        metadata: { type: 'dm', conversationId, senderName },
    });
}

export async function triggerMention(
    mentionedUserId: string,
    mentionerName: string,
    messagePreview: string,
    workspaceName: string,
    workspaceId: string
) {
    return createIfAllowed('mentions', {
        userId: mentionedUserId,
        title: `${mentionerName} mentioned you`,
        message: `In ${workspaceName}: "${messagePreview.slice(0, 150)}"`,
        category: 'alert',
        priority: 'high',
        source: 'WORKSPACE',
        iconType: 'at',
        color: '#8b5cf6',
        actionLabel: 'View Message',
        actionUrl: `/shared-workspaces`,
        metadata: { type: 'mention', workspaceId, mentionerName },
    });
}

export async function triggerWorkspaceMessage(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    workspaceName: string,
    workspaceId: string
) {
    return createIfAllowed('thread_replies', {
        userId: recipientUserId,
        title: `New message in ${workspaceName}`,
        message: `${senderName}: "${messagePreview.slice(0, 150)}"`,
        category: 'info',
        priority: 'low',
        source: 'WORKSPACE',
        iconType: 'message',
        color: '#60a5fa',
        metadata: { type: 'message', workspaceId },
    });
}

export async function triggerMemberJoined(
    notifyUserId: string,
    newMemberName: string,
    workspaceName: string,
    organizationId: string
) {
    return createIfAllowed('thread_replies', {
        userId: notifyUserId,
        organizationId,
        title: 'New Team Member',
        message: `${newMemberName} joined workspace "${workspaceName}".`,
        category: 'info',
        priority: 'low',
        source: 'WORKSPACE',
        iconType: 'user',
        color: '#10b981',
    });
}

// ── Security Triggers ──────────────────────────────────────────────────

export async function triggerNewLogin(
    userId: string,
    ipAddress: string,
    location: string,
    device: string
) {
    return createIfAllowed('new_logins', {
        userId,
        title: 'New Sign-In Detected',
        message: `A login was recorded from ${location} (${device}).`,
        category: 'warning',
        priority: 'high',
        source: 'SECURITY',
        iconType: 'shield',
        color: '#f59e0b',
        metadata: { ipAddress, location, device },
    });
}

// ── File Sharing Trigger ───────────────────────────────────────────────

export async function triggerFileShared(
    userId: string,
    organizationId: string | null,
    filename: string,
    workspaceName: string
) {
    return createIfAllowed('file_uploads', {
        userId,
        organizationId,
        title: 'File Shared',
        message: `"${filename}" was shared to workspace "${workspaceName}".`,
        category: 'info',
        priority: 'low',
        source: 'DATA_ENGINE',
        iconType: 'share',
        color: '#6366f1',
    });
}
