import { AppDataSource } from '../config/database';
import { Project } from '../entities/Project';

const projectRepository = () => AppDataSource.getRepository(Project);

export class ProjectService {
    async createProject(data: { title: string; description: string; objective: string; actions: string[]; impact?: string; ownerId: string }) {
        const project = projectRepository().create(data);
        return await projectRepository().save(project);
    }

    async getProjects(userId: string) {
        return await projectRepository().find({
            where: { ownerId: userId },
            order: { createdAt: 'DESC' }
        });
    }

    async getProjectById(id: string, userId: string) {
        const project = await projectRepository().findOne({
            where: { id, ownerId: userId }
        });
        if (!project) throw new Error('Project not found');
        return project;
    }

    async updateProjectStatus(id: string, status: string, userId: string) {
        const project = await this.getProjectById(id, userId);
        project.status = status;
        return await projectRepository().save(project);
    }

    async deleteProject(id: string, userId: string) {
        const project = await this.getProjectById(id, userId);
        return await projectRepository().remove(project);
    }
}
