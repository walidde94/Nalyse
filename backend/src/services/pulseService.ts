import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { File } from '../entities/File';
import { Analysis } from '../entities/Analysis';
import { AgentTask } from '../entities/AgentTask';

export class PulseService {
    private userRepo = AppDataSource.getRepository(User);
    private fileRepo = AppDataSource.getRepository(File);
    private analysisRepo = AppDataSource.getRepository(Analysis);
    private taskRepo = AppDataSource.getRepository(AgentTask);

    async getWorkspacePulse(userId: string) {
        // Get user's organization scope
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization) throw new Error('User or Organization not found');
        const orgId = user.organization.id; // orgId is likely string (uuid) too, confirm if needed but let's assume standard TypeORM relation

        // 1. Files
        const files = await this.fileRepo.find({
            where: { owner: { organization: { id: orgId } } },
            relations: ['owner', 'owner.organization']
        });
        const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

        // 2. Anomalies (Failed Agent Tasks)
        // AgentTask -> Agent -> User -> Organization
        const failedTasks = await this.taskRepo.createQueryBuilder('task')
            .leftJoin('task.agent', 'agent')
            .leftJoin('agent.user', 'user')
            .leftJoin('user.organization', 'organization')
            .where('organization.id = :orgId', { orgId })
            .andWhere('task.status = :status', { status: 'failed' })
            .getCount();

        // 3. Strategic Findings (Completed Analysis)
        const findings = await this.analysisRepo.createQueryBuilder('analysis')
            .leftJoin('analysis.createdBy', 'user')
            .leftJoin('user.organization', 'organization')
            .where('organization.id = :orgId', { orgId })
            .getCount();

        // 4. "Growth" (New files in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter in memory for simplicity if date comparison is weird in TypeORM
        const newFiles = files.filter(f => new Date(f.createdAt) > thirtyDaysAgo).length;
        const growth = files.length > 0 ? ((newFiles / files.length) * 100).toFixed(1) : '0';

        return {
            revenue: this.formatBytes(totalBytes),
            revenueLabel: 'Data Volume',
            revenueGrowth: `${growth}% new data`,
            anomalies: failedTasks,
            roi: '$0.00',
            findings: findings,
            fileCount: files.length
        };
    }

    private formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}
