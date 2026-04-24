import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const authService = new AuthService();

// Validation rules
export const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('organizationName').optional().trim().isLength({ min: 1, max: 100 })
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

export const passwordResetValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number')
];

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, organizationName } = req.body;

        const { user, organization } = await authService.register(
            email,
            password,
            firstName,
            lastName,
            organizationName
        );

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            organization: {
                id: organization.id,
                name: organization.name,
                plan: organization.plan
            }
        });
    } catch (error: any) {
        console.error('Registration error:', error);

        // Handle duplicate email error (TypeORM check + explicit service throw)
        if (error.message?.includes('already exists') || error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Email is already registered. Please sign in.' });
        }

        res.status(500).json({ error: error instanceof Error ? error.message : "Server error during registration" });
    }
};

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await authService.login(email, password);

        // Log the login attempt
        try {
            await prisma.platformAuditLog.create({
                data: {
                    userId: user.id,
                    action: 'LOGIN',
                    resource: 'AUTH',
                    ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
                    details: {
                        userAgent: req.headers['user-agent'] || 'unknown',
                        device: req.headers['sec-ch-ua-platform'] || 'unknown',
                        loginAt: new Date().toISOString()
                    }
                }
            });
        } catch (logError) {
            console.error('Failed to log login attempt:', logError);
            // Don't fail the login if logging fails
        }

        res.json({
            accessToken,
            refreshToken,
            user
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const { accessToken, user } = await authService.refreshAccessToken(refreshToken);

        res.json({ accessToken, user });
    } catch (error: any) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: error.message });
    }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const user = await authService.verifyEmail(token as string);

        res.json({
            message: 'Email verified successfully',
            user
        });
    } catch (error: any) {
        console.error('Email verification error:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        await authService.requestPasswordReset(email);

        // Always return success to prevent email enumeration
        res.json({
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
    } catch (error: any) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Reset token is required' });
        }

        const user = await authService.resetPassword(token as string, password);

        res.json({
            message: 'Password reset successful',
            user
        });
    } catch (error: any) {
        console.error('Password reset error:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await authService.getUserById(req.user.userId);

        res.json({ user });
    } catch (error: any) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * Logout (client-side token removal, but we log it)
 */
export const logout = async (req: AuthRequest, res: Response) => {
    try {
        // In a production app, you might want to blacklist the token
        // For now, we just log the logout

        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { firstName, lastName, bio, displayName, avatarUrl, notificationPreferences, apiKeys } = req.body;

        const user = await authService.updateUserProfile(req.user.userId, {
            firstName,
            lastName,
            bio,
            displayName,
            avatarUrl,
            notificationPreferences,
            apiKeys
        });

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
/**
 * Bootstrap the system admin
 */
export const bootstrapAdmin = async (req: Request, res: Response) => {
    try {
        const user = await authService.bootstrapAdmin();
        res.json({
            message: 'System Admin bootstrapped successfully',
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error('Bootstrap error:', error);
        res.status(500).json({ error: 'Failed to bootstrap admin' });
    }
};
