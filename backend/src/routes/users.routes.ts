import { Router } from 'express';
import { requirePermission, Permission } from '../middleware/rbac';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// GET all users in current organization
router.get('/', authenticate, requirePermission(Permission.MANAGE_USERS), async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.organizationId;

        if (!orgId) {
            return res.status(400).json({ error: 'User does not belong to an organization' });
        }

        const users = await prisma.user.findMany({
            where: {
                organizationId: orgId
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLogin: true
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// UPDATE user role
router.put('/:id/role', authenticate, requirePermission(Permission.MANAGE_USERS), async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const { role } = req.body;
        const orgId = req.user?.organizationId;

        if (!role || !['owner', 'admin', 'analyst', 'viewer', 'member'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role provided' });
        }

        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userToUpdate.organizationId !== orgId) {
            return res.status(403).json({ error: 'Cannot modify users outside your organization' });
        }

        // Prevent owners from changing their own role, or admins modifying owners
        if (userToUpdate.role === 'owner' && req.user?.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can modify owner roles' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role }
        });

        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// REMOVE user from org
router.delete('/:id', authenticate, requirePermission(Permission.MANAGE_USERS), async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user?.organizationId;

        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userToUpdate.organizationId !== orgId) {
            return res.status(403).json({ error: 'Cannot remove users outside your organization' });
        }

        if (userToUpdate.role === 'owner') {
            return res.status(403).json({ error: 'Cannot remove the organization owner' });
        }

        await prisma.user.delete({
            where: { id: userToUpdate.id }
        });

        res.json({ message: 'User removed from organization successfully' });
    } catch (error) {
        console.error('Error removing user:', error);
        res.status(500).json({ error: 'Failed to remove user' });
    }
});

export default router;
