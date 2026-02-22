import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';

const userRepository = () => AppDataSource.getRepository(User);
const orgRepository = () => AppDataSource.getRepository(Organization);

export class AuthService {
    /**
     * Register a new user and create their organization
     */
    async register(email: string, password: string, firstName?: string, lastName?: string, organizationName?: string) {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            // Check if user exists
            const existingUser = await transactionalEntityManager.findOne(User, { where: { email } });
            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Generate verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            // Create organization logic
            let orgName = organizationName || `${firstName || email.split('@')[0]}'s Workspace`;
            let counter = 1;
            let finalOrgName = orgName;

            while (await transactionalEntityManager.findOne(Organization, { where: { name: finalOrgName } })) {
                finalOrgName = `${orgName} (${counter})`;
                counter++;
            }

            const slug = this.generateSlug(finalOrgName);

            const organization = transactionalEntityManager.create(Organization, {
                name: finalOrgName,
                slug,
                plan: 'free',
                storageLimit: 104857600, // 100MB
                userLimit: 1,
                fileLimit: 5
            });

            const savedOrg = await transactionalEntityManager.save(Organization, organization);

            // Create user
            const user = transactionalEntityManager.create(User, {
                email,
                passwordHash,
                firstName: firstName || null,
                lastName: lastName || null,
                emailVerificationToken,
                organization: savedOrg,
                organizationId: savedOrg.id,
                role: 'user'
            });

            const savedUser = await transactionalEntityManager.save(User, user);

            return { user: savedUser, organization: savedOrg };
        });
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string) {
        const user = await userRepository().findOne({
            where: { email },
            relations: ['organization']
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await userRepository().save(user);

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken
        };
    }

    /**
     * Generate JWT access token (short-lived)
     */
    generateAccessToken(user: User) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'dev-secret-key'),
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );
    }

    /**
     * Generate JWT refresh token (long-lived)
     */
    generateRefreshToken(user: User) {
        return jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET must be set in production'); })() : 'dev-refresh-secret'),
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
        );
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET must be set in production'); })() : 'dev-refresh-secret')
            ) as any;

            const user = await userRepository().findOne({
                where: { id: decoded.userId },
                relations: ['organization']
            });

            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }

            const accessToken = this.generateAccessToken(user);
            return { accessToken, user: this.sanitizeUser(user) };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string) {
        const user = await userRepository().findOne({
            where: { emailVerificationToken: token }
        });

        if (!user) {
            throw new Error('Invalid verification token');
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        await userRepository().save(user);

        return this.sanitizeUser(user);
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string) {
        const user = await userRepository().findOne({ where: { email } });

        if (!user) {
            // Don't reveal if user exists for security
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

        await userRepository().save(user);

        // TODO: Send reset email

        return resetToken;
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string) {
        const user = await userRepository().findOne({
            where: { passwordResetToken: token }
        });

        if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            throw new Error('Invalid or expired reset token');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await userRepository().save(user);

        return this.sanitizeUser(user);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await userRepository().findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.sanitizeUser(user);
    }

    /**
     * Remove sensitive fields from user object
     */
    private sanitizeUser(user: User) {
        const { passwordHash, emailVerificationToken, passwordResetToken, ...sanitized } = user;
        return sanitized;
    }

    /**
     * Generate URL-friendly slug from organization name
     */
    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Add random suffix to ensure uniqueness
        const suffix = crypto.randomBytes(3).toString('hex');
        return `${baseSlug}-${suffix}`;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, updates: {
        firstName?: string;
        lastName?: string;
        bio?: string;
        displayName?: string;
        avatarUrl?: string;
        notificationPreferences?: any;
        apiKeys?: any[];
    }) {
        const user = await userRepository().findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (updates.firstName !== undefined) user.firstName = updates.firstName;
        if (updates.lastName !== undefined) user.lastName = updates.lastName;
        if (updates.bio !== undefined) user.bio = updates.bio;
        if (updates.displayName !== undefined) user.displayName = updates.displayName;
        if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
        if (updates.notificationPreferences !== undefined) user.notificationPreferences = updates.notificationPreferences;
        if (updates.apiKeys !== undefined) user.apiKeys = updates.apiKeys;

        await userRepository().save(user);

        return this.sanitizeUser(user);
    }
}
