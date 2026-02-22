import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Organization } from '../entities/Organization';
import { User } from '../entities/User';
import { UserInvitation } from '../entities/UserInvitation';
import crypto from 'crypto';

export const getOrganization = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);

    try {
        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user || !user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Get members
        const members = await userRepo.find({
            where: { organizationId: user.organization.id },
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'avatarUrl', 'lastLoginAt']
        });

        // Get pending invitations
        const invRepo = AppDataSource.getRepository(UserInvitation);
        const pendingInvites = await invRepo.find({
            where: { organizationId: user.organization.id, status: 'pending' }
        });

        res.json({
            organization: user.organization,
            members,
            pendingInvites,
            currentUserRole: user.role
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { name, settings } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);

    try {
        const user = await userRepo.findOne({ where: { id: userId }, relations: ['organization'] });

        if (!user || !user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update organization settings' });
        }

        user.organization.name = name || user.organization.name;
        // user.organization.settings = settings... (if we had a settings JSON col)

        await orgRepo.save(user.organization);

        res.json(user.organization);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update organization' });
    }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { email, role } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRepo = AppDataSource.getRepository(User);
    const inviteRepo = AppDataSource.getRepository(UserInvitation);

    try {
        const user = await userRepo.findOne({ where: { id: userId }, relations: ['organization'] });
        if (!user || !user.organization) return res.status(404).json({ error: 'No organization' });

        if (user.role !== 'admin') return res.status(403).json({ error: 'Only admins can invite members' });

        // Check user limit
        const memberCount = await userRepo.count({ where: { organizationId: user.organization.id } });
        const pendingInviteCount = await inviteRepo.count({
            where: { organizationId: user.organization.id, status: 'pending' }
        });

        const effectiveUserLimit = user.organization.plan === 'free' ? 1 : user.organization.userLimit;

        if (memberCount + pendingInviteCount >= effectiveUserLimit) {
            return res.status(403).json({
                error: 'User limit exceeded',
                details: `Your plan allows up to ${effectiveUserLimit} user(s). Please upgrade to add more.`
            });
        }

        // Check if user already exists in this org
        const existingMember = await userRepo.findOne({ where: { email, organizationId: user.organization.id } });
        if (existingMember) return res.status(400).json({ error: 'User already in organization' });

        // Check pending invite
        const existingInvite = await inviteRepo.findOne({
            where: { email, organizationId: user.organization.id, status: 'pending' }
        });

        if (existingInvite) {
            return res.json({ message: 'Invite already sent', invite: existingInvite });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const invite = inviteRepo.create({
            email,
            role: role || 'user',
            organization: user.organization,
            inviter: user,
            token,
            expiresAt,
            status: 'pending'
        });

        await inviteRepo.save(invite);

        // MOCK EMAIL SENDING
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        res.json({ message: 'Invitation sent', invite });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
};
