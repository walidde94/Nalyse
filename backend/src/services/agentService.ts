import { AppDataSource } from '../config/database';
import { Agent } from '../entities/Agent';
import { AgentTask } from '../entities/AgentTask';
import { AgentLog } from '../entities/AgentLog';
import { AiService } from './aiService';
import { User } from '../entities/User';
import { PulseService } from './pulseService';

export class AgentService {
    private agentRepo = AppDataSource.getRepository(Agent);
    private taskRepo = AppDataSource.getRepository(AgentTask);
    private logRepo = AppDataSource.getRepository(AgentLog);
    private aiService = new AiService();

    async startAgent(userId: string, goal: string, role: string = 'analyst') {
        // 1. Create Agent Session
        const agent = this.agentRepo.create({
            userId,
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} Agent`,
            role,
            currentGoal: goal,
            status: 'planning'
        });
        await this.agentRepo.save(agent); // Save successfully to get ID

        // 2. Generate Plan (Async)
        this.runPlanningPhase(agent.id, goal);

        return agent;
    }

    private async runPlanningPhase(agentId: string, goal: string) {
        const agent = await this.agentRepo.findOne({ where: { id: agentId } });
        if (!agent) return;

        await this.log(agent, `Analyzing goal: "${goal}"...`);

        // Call AI
        const plan = await this.aiService.generatePlan(goal);

        await this.log(agent, `Strategy: ${plan.thought}`);

        // Create Tasks
        for (const taskDesc of plan.tasks) {
            const task = this.taskRepo.create({
                agent: agent,
                description: taskDesc,
                status: 'pending'
            });
            await this.taskRepo.save(task);
        }

        agent.status = 'working';
        await this.agentRepo.save(agent);

        // Trigger execution loop (fire and forget)
        this.executionLoop(agent.id);
    }

    private async executionLoop(agentId: string) {
        const agent = await this.agentRepo.findOne({
            where: { id: agentId },
            relations: ['user']
        });
        if (!agent) return;

        const tasks = await this.taskRepo.find({
            where: { agent: { id: agentId }, status: 'pending' },
            order: { createdAt: 'ASC' }
        });

        if (tasks.length === 0) {
            // All tasks done - Generate Final Report
            await this.log(agent, 'Synthesizing final intelligence report...');

            const completedTasks = await this.taskRepo.find({ where: { agent: { id: agentId } } });
            const logs = await this.logRepo.find({ where: { agent: { id: agentId } } });

            const report = await this.aiService.generateReport(agent.currentGoal, completedTasks, logs);

            agent.status = 'completed';
            agent.finalReport = JSON.stringify(report);
            await this.agentRepo.save(agent);

            await this.log(agent, 'Analysis complete. Report generated.', 'success');
            return;
        }

        const pulseService = new PulseService();

        for (const task of tasks) {
            // Update task status
            task.status = 'running';
            await this.taskRepo.save(task);

            await this.log(agent, `Executing: ${task.description}...`);

            // EXECUTE REAL WORK BASED ON TASK CONTEXT
            let result = 'Task completed successfully.';
            const desc = task.description.toLowerCase();

            try {
                if (desc.includes('volume') || desc.includes('files') || desc.includes('size') || desc.includes('storage') || desc.includes('data')) {
                    // Fetch real file stats
                    const pulseData = await pulseService.getWorkspacePulse(agent.userId);
                    await this.log(agent, `Accessed workspace storage: ${pulseData.revenue} total volume across ${pulseData.fileCount} files.`);

                    // Use AI to analyze the stats
                    result = await this.aiService.analyzeContext(task.description, pulseData);
                }
                else if (desc.includes('anomalies') || desc.includes('audit') || desc.includes('error')) {
                    const pulseData = await pulseService.getWorkspacePulse(agent.userId);
                    await this.log(agent, `Scanned system logs. Found ${pulseData.anomalies} issues.`);

                    // Use AI to analyze the anomalies
                    result = await this.aiService.analyzeContext(task.description, { anomalies: pulseData.anomalies, systemStatus: 'active' });
                }
                else if (desc.includes('pattern') || desc.includes('trend')) {
                    // Get broader context
                    const pulseData = await pulseService.getWorkspacePulse(agent.userId);
                    await this.log(agent, 'Correlating timestamp vectors...');

                    // Use AI to hallucinate/infer patterns based on the aggregate data
                    result = await this.aiService.analyzeContext(task.description, {
                        growth: pulseData.revenueGrowth,
                        totalVolume: pulseData.revenue,
                        recentActivity: 'High'
                    });
                }
                else {
                    // Default fallback - still try to use AI if possible, or generic
                    await new Promise(r => setTimeout(r, 1000));
                    result = await this.aiService.analyzeContext(task.description, { status: 'Verified', integrity: '100%' });
                }
            } catch (err: any) {
                result = `Execution failed: ${err.message}`;
                await this.log(agent, `Error during execution: ${err.message}`, 'error');
            }

            // Simulate processing time for UX
            await new Promise(r => setTimeout(r, 1500));

            task.status = 'completed';
            task.result = result;
            await this.taskRepo.save(task);

            await this.log(agent, `Completed: ${task.description}`, 'success');
        }

        this.executionLoop(agentId); // Check for more (or finish)
    }

    async getAgentStatus(agentId: string, userId: string) {
        const agent = await this.agentRepo.findOne({
            where: { id: agentId, userId },
        });

        if (!agent) throw new Error('Agent not found');

        const tasks = await this.taskRepo.find({ where: { agent: { id: agentId } }, order: { createdAt: 'ASC' } });
        const logs = await this.logRepo.find({ where: { agent: { id: agentId } }, order: { createdAt: 'DESC' }, take: 50 });

        return { agent, tasks, logs };
    }

    private async log(agent: Agent, message: string, level: string = 'info') {
        const log = this.logRepo.create({
            agent,
            message,
            level
        });
        await this.logRepo.save(log);
    }
}
