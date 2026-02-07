import { AppDataSource } from '../config/database';
import { Group } from '../entities/Group';
import { User } from '../entities/User';
import { File } from '../entities/File';

const groupRepository = () => AppDataSource.getRepository(Group);

export class GroupService {
    async createGroup(name: string, description: string, userId: string) {
        const group = groupRepository().create({
            name,
            description,
            ownerId: userId
        });
        return await groupRepository().save(group);
    }

    async getGroups(userId: string) {
        return await groupRepository().find({
            where: { ownerId: userId },
            relations: ['files']
        });
    }

    async getGroupById(id: string, userId: string) {
        const group = await groupRepository().findOne({
            where: { id, ownerId: userId },
            relations: ['files']
        });
        if (!group) throw new Error('Group not found');
        return group;
    }

    async updateGroup(id: string, name: string, description: string, userId: string) {
        const group = await this.getGroupById(id, userId);
        group.name = name;
        group.description = description;
        return await groupRepository().save(group);
    }

    async deleteGroup(id: string, userId: string) {
        const group = await this.getGroupById(id, userId);
        // Manually unset groupId for all files in this group before deletion
        // to ensure it works even if the DB constraint didn't update correctly
        await AppDataSource.getRepository(File).update({ groupId: id }, { groupId: null });
        return await groupRepository().remove(group);
    }
}
