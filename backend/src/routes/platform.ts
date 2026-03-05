import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { Response } from 'express';

const router = Router();

// GET /api/platform/analytics — Aggregated platform analytics
router.get('/analytics', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // --- Users ---
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                organization: {
                    select: {
                        subscriptionTier: true
                    }
                }
            }
        });

        // --- Files ---
        const allFiles = await prisma.file.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                originalName: true,
                filename: true,
                size: true,
                mimeType: true,
                createdAt: true,
                ownerId: true
            }
        });

        // --- Analyses ---
        const allAnalyses = await prisma.analysis.findMany({
            select: {
                id: true,
                fileId: true,
                createdById: true,
                status: true,
                processingTimeMs: true,
                createdAt: true,
                completedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // ═══ ANALYSIS PERFORMANCE ═══
        const completedAnalyses = allAnalyses.filter(a => a.status === 'completed' && a.processingTimeMs);
        const failedAnalyses = allAnalyses.filter(a => a.status === 'failed');
        const pendingAnalyses = allAnalyses.filter(a => a.status === 'pending' || a.status === 'processing');

        const processingTimes = completedAnalyses.map(a => a.processingTimeMs).filter(Boolean) as number[];
        const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;
        const maxProcessingTime = processingTimes.length > 0 ? Math.max(...processingTimes) : 0;
        const minProcessingTime = processingTimes.length > 0 ? Math.min(...processingTimes) : 0;
        const medianProcessingTime = processingTimes.length > 0 ? (() => {
            const sorted = [...processingTimes].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        })() : 0;
        const p95ProcessingTime = processingTimes.length > 0 ? (() => {
            const sorted = [...processingTimes].sort((a, b) => a - b);
            const idx = Math.ceil(0.95 * sorted.length) - 1;
            return sorted[idx];
        })() : 0;

        const successRate = allAnalyses.length > 0 ? (completedAnalyses.length / allAnalyses.length * 100) : 100;

        // Analysis timeline (analyses per day)
        const analysisPerDay: Record<string, { completed: number; failed: number; total: number; avgTime: number; times: number[] }> = {};
        allAnalyses.forEach(a => {
            const day = new Date(a.createdAt).toISOString().split('T')[0];
            if (!analysisPerDay[day]) analysisPerDay[day] = { completed: 0, failed: 0, total: 0, avgTime: 0, times: [] };
            analysisPerDay[day].total++;
            if (a.status === 'completed') analysisPerDay[day].completed++;
            if (a.status === 'failed') analysisPerDay[day].failed++;
            if (a.processingTimeMs) analysisPerDay[day].times.push(a.processingTimeMs);
        });

        const analysisTimeline = Object.entries(analysisPerDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30)
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                completed: data.completed,
                failed: data.failed,
                total: data.total,
                avgTime: data.times.length > 0 ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length) : 0,
            }));

        // Processing time distribution (histogram)
        const timeDistribution = [
            { range: '0-1s', count: processingTimes.filter(t => t < 1000).length },
            { range: '1-5s', count: processingTimes.filter(t => t >= 1000 && t < 5000).length },
            { range: '5-15s', count: processingTimes.filter(t => t >= 5000 && t < 15000).length },
            { range: '15-30s', count: processingTimes.filter(t => t >= 15000 && t < 30000).length },
            { range: '30-60s', count: processingTimes.filter(t => t >= 30000 && t < 60000).length },
            { range: '60s+', count: processingTimes.filter(t => t >= 60000).length },
        ];

        // ═══ USER ACTIVITY ═══
        const userActivity = allUsers.map(u => {
            const userFiles = allFiles.filter(f => f.ownerId === u.id);
            const userAnalyses = allAnalyses.filter(a => a.createdById === u.id);
            const storageUsed = userFiles.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
            return {
                id: u.id,
                email: u.email,
                name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
                role: u.role,
                plan: u.organization?.subscriptionTier || 'hobby',
                isActive: true, // We removed this field
                createdAt: u.createdAt,
                lastLoginAt: u.lastLogin,
                fileCount: userFiles.length,
                analysisCount: userAnalyses.length,
                storageUsed,
                // Calculate login frequency
                accountAgeDays: Math.max(1, Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000)),
            };
        }).sort((a, b) => b.analysisCount - a.analysisCount);

        // ═══ USAGE METRICS ═══
        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 86400000);
        const last30d = new Date(now.getTime() - 30 * 86400000);

        const uploads7d = allFiles.filter(f => new Date(f.createdAt) > last7d).length;
        const uploads30d = allFiles.filter(f => new Date(f.createdAt) > last30d).length;
        const analyses7d = allAnalyses.filter(a => new Date(a.createdAt) > last7d).length;
        const analyses30d = allAnalyses.filter(a => new Date(a.createdAt) > last30d).length;

        // Upload timeline
        const uploadPerDay: Record<string, number> = {};
        allFiles.forEach(f => {
            const day = new Date(f.createdAt).toISOString().split('T')[0];
            uploadPerDay[day] = (uploadPerDay[day] || 0) + 1;
        });
        const uploadTimeline = Object.entries(uploadPerDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30)
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                uploads: count,
            }));

        // File type breakdown
        const filesByType: Record<string, number> = {};
        allFiles.forEach(f => {
            const ext = (f.originalName || f.filename || '').split('.').pop()?.toLowerCase() || 'other';
            filesByType[ext] = (filesByType[ext] || 0) + 1;
        });

        // File size distribution
        const fileSizes = allFiles.map(f => Number(f.size) || 0);
        const totalStorage = fileSizes.reduce((a, b) => a + b, 0);

        // ═══ RESPONSE ═══
        res.json({
            overview: {
                totalUsers: allUsers.length,
                activeUsers: allUsers.length, // replaced with total length
                totalFiles: allFiles.length,
                totalAnalyses: allAnalyses.length,
                totalStorageBytes: totalStorage,
                uploads7d,
                uploads30d,
                analyses7d,
                analyses30d,
            },
            analysisPerformance: {
                totalAnalyses: allAnalyses.length,
                completed: completedAnalyses.length,
                failed: failedAnalyses.length,
                pending: pendingAnalyses.length,
                successRate: Math.round(successRate * 100) / 100,
                avgProcessingTimeMs: Math.round(avgProcessingTime),
                medianProcessingTimeMs: Math.round(medianProcessingTime),
                p95ProcessingTimeMs: Math.round(p95ProcessingTime),
                maxProcessingTimeMs: maxProcessingTime,
                minProcessingTimeMs: minProcessingTime,
                timeline: analysisTimeline,
                timeDistribution: timeDistribution,
            },
            userActivity,
            uploadTimeline,
            fileTypes: Object.entries(filesByType).map(([name, value]) => ({ name: name.toUpperCase(), value })),
        });
    } catch (error) {
        console.error('Platform analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch platform analytics' });
    }
});

export default router;
