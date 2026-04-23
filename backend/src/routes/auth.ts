import { Router } from 'express';
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

export default router;
