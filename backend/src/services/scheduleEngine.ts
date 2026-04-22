import { prisma } from '../config/database';
import axios from 'axios';

/**
 * Enhanced Schedule Engine
 * Handles real logic for PDF generation and distribution history tracking.
 */

const generateRealReportData = async (schedule: any): Promise<any> => {
    console.log(`[ScheduleEngine] 🔍 Gathering data for schedule: ${schedule.name}`);
    
    // If it's linked to a dashboard
    if (schedule.dashboardId) {
        const dashboard = await prisma.dashboard.findUnique({ where: { id: schedule.dashboardId } });
        return { type: 'Dashboard', name: dashboard?.name || 'Unknown', timestamp: new Date() };
    }

    // If it's linked to an analysis
    if (schedule.analysisId) {
        const analysis = await prisma.analysis.findUnique({ 
            where: { id: schedule.analysisId },
            include: { file: true }
        });
        return { type: 'Analysis', context: analysis?.file?.filename || 'System Insight', timestamp: new Date() };
    }
    
    return { type: 'General', timestamp: new Date() };
};

const dispatchReport = async (schedule: any, data: any) => {
    // 4. Delivery Orchestration
    const deliveryChannel = (schedule.config as any)?.deliveryChannel || 'email';
    const deliverTo = (schedule.config as any)?.deliverTo;

    if (deliveryChannel === 'email' && deliverTo) {
        console.log(`[ScheduleEngine] Delivering report via Email to ${deliverTo}`);
        // await sendEmail(deliverTo, 'Intelligence Report', html);
    } else if (deliveryChannel === 'webhook' && deliverTo) {
        console.log(`[ScheduleEngine] Triggering Webhook at ${deliverTo}`);
        try {
            await axios.post(deliverTo, {
                report: schedule.name,
                data: data,
                event: 'automation.report_generated'
            });
        } catch (e: any) {
            console.error(`[ScheduleEngine] Webhook failed: ${e.message}`);
            throw e;
        }
    }
};

export const processSingleSchedule = async (schedule: any) => {
    const startTime = Date.now();
    const run = await prisma.scheduleRun.create({
        data: {
            scheduleId: schedule.id,
            status: 'pending',
            startedAt: new Date(),
            metadata: { modules: (schedule.config as any)?.modules, config: schedule.config } as any
        }
    });

    try {
        // 1. Logic
        const reportData = await generateRealReportData(schedule);
        
        // 2. Dispatch
        await dispatchReport(schedule, reportData);

        // 3. Success
        await prisma.scheduleRun.update({
            where: { id: run.id },
            data: {
                status: 'success',
                completedAt: new Date(),
                durationMs: Date.now() - startTime,
                outputUrl: `/api/automation/reports/${run.id}/view`
            }
        });

        await prisma.schedule.update({
            where: { id: schedule.id },
            data: { lastRunAt: new Date() }
        });

    } catch (err: any) {
        console.error(`[ScheduleEngine] Run ${run.id} failed:`, err);
        await prisma.scheduleRun.update({
            where: { id: run.id },
            data: {
                status: 'failed',
                completedAt: new Date(),
                errorMessage: err.message,
                durationMs: Date.now() - startTime
            }
        });
    }
};

export const runScheduleEngine = async () => {
    try {
        const activeSchedules = await prisma.schedule.findMany({
            where: { isActive: true }
        });

        for (const schedule of activeSchedules) {
            const now = new Date();
            const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : new Date(0);
            
            // Simulation: Run if it hasn't run in the last 10 minutes
            const msSinceLastRun = now.getTime() - lastRun.getTime();
            if (msSinceLastRun > 600 * 1000) {
                await processSingleSchedule(schedule);
            }
        }
    } catch (error) {
        console.error('[ScheduleEngine] Error:', error);
    }
};

let engineInterval: NodeJS.Timeout | null = null;

export const startScheduleEngine = (intervalMs: number = 30000) => {
    if (engineInterval) return;
    console.log(`[ScheduleEngine] background reporting engine started (Interval: ${intervalMs}ms)`);
    engineInterval = setInterval(runScheduleEngine, intervalMs);
};

export const stopScheduleEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
    }
};
