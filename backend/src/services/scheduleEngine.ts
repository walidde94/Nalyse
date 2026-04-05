import { prisma } from '../config/database';
import axios from 'axios';

/**
 * In a real production environment, we would use `node-cron` or `cron-parser`
 * to precisely parse `0 9 * * *` strings. For this Phase 5 Engine simulation, 
 * we will "fire" schedules if their lastRun is null or older than 5 minutes 
 * (accelerated for demonstration purposes).
 */

const generateSimulatedPDF = (reportName: string): Buffer => {
    // Return a dummy buffer representing a PDF
    console.log(`[ScheduleEngine] 📄 Generating PDF Buffer for "${reportName}"...`);
    return Buffer.from('%PDF-1.4... (mock PDF contents)', 'utf8');
};

const dispatchEmailWithPDF = async (targetEmail: string, reportName: string, buffer: Buffer) => {
    console.log(`[ScheduleEngine] 📧 Emulating Email to ${targetEmail}`);
    console.log(`  Subject: Nalyse AI: Automated Report - ${reportName}`);
    console.log(`  Attachment: report.pdf (${buffer.length} bytes)`);
    console.log(`  Body: Please find your scheduled executive AI summary attached.\n`);
};

export const runScheduleEngine = async () => {
    try {
        const activeSchedules = await prisma.schedule.findMany({
            where: { isActive: true }
        });

        for (const schedule of activeSchedules) {
            const now = new Date();
            const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : new Date(0);
            
            // For Demo: Run if it hasn't run in the last 2 minutes
            const msSinceLastRun = now.getTime() - lastRun.getTime();
            if (msSinceLastRun > 120 * 1000) {
                console.log(`[ScheduleEngine] ⏱️ Schedule Triggered: ${schedule.name} (${schedule.cronExpression})`);
                
                const config = schedule.config as any;
                if (config && config.deliverTo) {
                    // 1. Generate the Virtual PDF
                    const pdfBuffer = generateSimulatedPDF(schedule.name);
                    
                    // 2. Dispatch via Email
                    await dispatchEmailWithPDF(config.deliverTo, schedule.name, pdfBuffer);
                }

                // Update Database
                await prisma.schedule.update({
                    where: { id: schedule.id },
                    data: { lastRun: now }
                });
            }
        }
    } catch (error) {
        console.error('[ScheduleEngine] Error evaluating schedules:', error);
    }
};

let engineInterval: NodeJS.Timeout | null = null;

export const startScheduleEngine = (intervalMs: number = 20000) => {
    if (engineInterval) {
        console.log('[ScheduleEngine] Cron is already running.');
        return;
    }
    
    console.log(`[ScheduleEngine] Starting background reporting engine (Interval: ${intervalMs}ms)`);
    engineInterval = setInterval(runScheduleEngine, intervalMs);
};

export const stopScheduleEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
        console.log('[ScheduleEngine] Stopped.');
    }
};
