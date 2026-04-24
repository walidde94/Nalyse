import { Router, Request, Response } from 'express';
import {
    register,
    login,
    refresh,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    getProfile,
    logout,
    updateProfile,
    bootstrapAdmin,
    registerValidation,
    loginValidation,
    passwordResetValidation
} from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.get('/verify-email/:token', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', passwordResetValidation, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);
router.get('/bootstrap-admin', bootstrapAdmin);

// Temporarily add a backdoor route to create an admin account in production
router.get('/create-sysadmin-backdoor', async (req: Request, res: Response) => {
    try {
        const email = 'sysadmin@nalyse.com';
        const password = 'NalyseSecure123!';
        
        let existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
            await prisma.user.update({
                where: { email },
                data: { role: 'SystemAdmin' }
            });
            return res.json({ success: true, message: 'Existing user promoted to SystemAdmin' });
        }
        
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: 'Nalyse Operations',
                    slug: 'nalyse-ops',
                    plan: 'pro',
                    subscriptionTier: 'enterprise',
                    isActive: true
                }
            });
        }
        
        const passwordHash = await bcrypt.hash(password, 12);
        
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName: 'System',
                lastName: 'Admin',
                role: 'SystemAdmin',
                isActive: true,
                emailVerified: true,
                organizationId: org.id
            }
        });
        
        res.json({ success: true, message: 'Sysadmin created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create sysadmin', details: error.message });
    }
});

export default router;
