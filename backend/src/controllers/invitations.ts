import { Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';
import { sendInvitation } from '../services/emailService';

// ═══════════════════════════════════════════════════════════════════
// SEND INVITATION
// ═══════════════════════════════════════════════════════════════════

export const sendWorkspaceInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { email, role = 'member' } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Role must be admin, member, or viewer' });
        }

        // Get inviter + org
        const inviter = await prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true }
        });

        if (!inviter?.organization) {
            return res.status(400).json({ error: 'You must belong to an organization to send invitations' });
        }

        const org = inviter.organization;

        // Check org user limit
        const currentUserCount = await prisma.user.count({
            where: { organizationId: org.id }
        });

        if (currentUserCount >= org.maxUsers) {
            return res.status(403).json({
                error: 'Team limit reached',
                message: `Your plan allows up to ${org.maxUsers} team members. Upgrade to add more.`
            });
        }

        // Check for already-member
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
        if (existingUser && existingUser.organizationId === org.id) {
            return res.status(409).json({ error: 'This user is already a member of your workspace' });
        }

        // Check for existing pending invitation
        const existingInvite = await prisma.userInvitation.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                organizationId: org.id,
                status: 'pending'
            }
        });

        if (existingInvite) {
            // Resend the existing invitation
            const inviterName = inviter.firstName || inviter.email;
            await sendInvitation(email.trim(), inviterName, org.name, role, existingInvite.token);
            return res.json({ message: 'Invitation resent', invitation: existingInvite });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

        const invitation = await prisma.userInvitation.create({
            data: {
                email: email.toLowerCase().trim(),
                role: role,
                token,
                organizationId: org.id,
                inviterId: userId,
                expiresAt,
            }
        });

        // Send email
        const inviterName = inviter.firstName || inviter.email;
        await sendInvitation(email.trim(), inviterName, org.name, role, token);

        res.json({
            message: 'Invitation sent',
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
            }
        });
    } catch (error: any) {
        console.error('Invitation error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
};

// ═══════════════════════════════════════════════════════════════════
// ACCEPT INVITATION
// ═══════════════════════════════════════════════════════════════════

export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) return res.status(401).json({ error: 'You must be logged in to accept an invitation' });
        if (!token) return res.status(400).json({ error: 'Invitation token is required' });

        const invitation = await prisma.userInvitation.findUnique({
            where: { token: token as string },
            include: { organization: true }
        });

        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `Invitation already ${invitation.status}` });
        }

        if (new Date() > new Date(invitation.expiresAt)) {
            await prisma.userInvitation.update({
                where: { id: invitation.id },
                data: { status: 'expired' }
            });
            return res.status(410).json({ error: 'Invitation has expired. Ask the inviter to send a new one.' });
        }

        // Verify the accepting user's email matches
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            return res.status(403).json({
                error: 'Email mismatch',
                message: `This invitation was sent to ${invitation.email}. You are logged in as ${user.email}.`
            });
        }

        // Join org
        await prisma.user.update({
            where: { id: user.id },
            data: {
                organizationId: invitation.organizationId,
                role: invitation.role === 'admin' ? 'admin' : 'member'
            }
        });

        // Mark invitation accepted
        await prisma.userInvitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted' }
        });

        res.json({
            message: `Successfully joined ${invitation.organization?.name || 'the workspace'}`,
            organizationId: invitation.organizationId,
            role: invitation.role
        });
    } catch (error: any) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
};

// ═══════════════════════════════════════════════════════════════════
// DECLINE INVITATION
// ═══════════════════════════════════════════════════════════════════

export const declineInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const invitation = await prisma.userInvitation.findUnique({
            where: { token: token as string }
        });
        if (!invitation || invitation.status !== 'pending') {
            return res.status(404).json({ error: 'Invitation not found or already resolved' });
        }

        await prisma.userInvitation.update({
            where: { id: invitation.id },
            data: { status: 'declined' }
        });

        res.json({ message: 'Invitation declined' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to decline invitation' });
    }
};

// ═══════════════════════════════════════════════════════════════════
// LIST ORG INVITATIONS (admin-only)
// ═══════════════════════════════════════════════════════════════════

export const listInvitations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId) {
            return res.status(400).json({ error: 'You do not belong to an organization' });
        }

        const invitations = await prisma.userInvitation.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(invitations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
};

// ═══════════════════════════════════════════════════════════════════
// REVOKE INVITATION
// ═══════════════════════════════════════════════════════════════════

export const revokeInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const invitation = await prisma.userInvitation.findUnique({
            where: { id: id as string }
        });
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

        // Only the inviter or org admin can revoke
        if (invitation.inviterId !== userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.role !== 'admin' || user.organizationId !== invitation.organizationId) {
                return res.status(403).json({ error: 'Not authorized to revoke this invitation' });
            }
        }

        await prisma.userInvitation.delete({ where: { id: invitation.id } });
        res.json({ message: 'Invitation revoked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to revoke invitation' });
    }
};
