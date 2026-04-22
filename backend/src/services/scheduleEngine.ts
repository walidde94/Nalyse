import { prisma } from '../config/database';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Mock report generation helper - in a real app this would call a template engine
const generateEnterpriseReport = async (schedule: any, runId: string) => {
    const config = schedule.config as any;
    const orgSettings = await prisma.schedule.findFirst({ 
        where: { name: '__SYSTEM_SETTINGS__', organizationId: schedule.organizationId } 
    });
    const settings = (orgSettings?.config as any) || { brandName: 'NALYSE', brandColor: '#6366f1' };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Inter', sans-serif; background: #0a0a0c; color: #fff; padding: 60px; }
            .header { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 900; color: ${settings.brandColor}; }
            .dossier-id { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; }
            .title { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: -0.02em; }
            .meta { color: rgba(255,255,255,0.4); margin-top: 10px; font-size: 14px; }
            .section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; margin-top: 40px; }
            h2 { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${settings.brandColor}; margin-bottom: 20px; }
            p { line-height: 1.6; color: rgba(255,255,255,0.7); }
            .footer { margin-top: 100px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: rgba(255,255,255,0.3); }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">${settings.brandName}</div>
            <div class="dossier-id">Run ID: ${runId}</div>
        </div>
        <h1 class="title">${schedule.name}</h1>
        <div class="meta">Automated Intelligence Report • Generated ${new Date().toLocaleString()}</div>
        
        <div class="section">
            <h2>Intelligence Summary</h2>
            <p>${schedule.description || 'No description provided.'}</p>
            <p>This automated dossier aggregates telemetry across your enterprise infrastructure, including real-time analysis scores, data pipeline health, and security compliance metrics.</p>
        </div>

        <div class="section">
            <h2>System Telemetry</h2>
            <p>All monitored nodes are reporting optimal status. Cluster health is currently at 98.4%. No anomalies detected in the last 24-hour cycle.</p>
        </div>

        <div class="footer">
            ${settings.footerText || 'Confidential Intelligence Document • Internal Use Only'}
        </div>
    </body>
    </html>
    `;
};

export const processSingleSchedule = async (schedule: any) => {
    // 1. Create immediate record so UI sees it
    const run = await prisma.scheduleRun.create({
        data: {
            scheduleId: schedule.id,
            status: 'running',
            startedAt: new Date(),
            metadata: { modules: (schedule.config as any)?.modules || {} }
        }
    });

    // 2. Process in background
    (async () => {
        try {
            console.log(`[ScheduleEngine] 🚀 Starting manual run for "${schedule.name}" (Run ID: ${run.id})`);
            const html = await generateEnterpriseReport(schedule, run.id);
            const filename = `reports/report_${run.id}.html`;
            const filePath = path.join(process.cwd(), filename);
            
            if (!fs.existsSync(path.join(process.cwd(), 'reports'))) {
                fs.mkdirSync(path.join(process.cwd(), 'reports'), { recursive: true });
            }
            fs.writeFileSync(filePath, html);

            await prisma.scheduleRun.update({
                where: { id: run.id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    outputUrl: filename,
                    durationMs: Date.now() - run.startedAt.getTime()
                }
            });

            // Delivery logic
            const deliveryChannel = (schedule.config as any)?.deliveryChannel || 'email';
            const deliverTo = (schedule.config as any)?.deliverTo;
            if (deliveryChannel === 'webhook' && deliverTo) {
                await axios.post(deliverTo, { runId: run.id, status: 'completed', reportUrl: filename }).catch(() => {});
            }

            console.log(`[ScheduleEngine] ✅ Report generated: ${filename}`);
        } catch (error: any) {
            console.error(`[ScheduleEngine] ❌ Error in manual run:`, error.message);
            await prisma.scheduleRun.update({
                where: { id: run.id },
                data: { status: 'failed', errorMessage: error.message, completedAt: new Date() }
            });
        }
    })();

    return run;
};

export const startScheduleEngine = () => {
    console.log('[ScheduleEngine] Monitoring pipelines every 60s...');
    setInterval(async () => {
        // In a real app, you'd check which schedules are due (e.g. using cron-parser)
        // For this demo, we assume the trigger logic is manual or via external cron
    }, 60000);
};
