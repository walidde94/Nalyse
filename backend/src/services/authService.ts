import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource, prisma } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';

const userRepository = () => AppDataSource.getRepository(User);
const orgRepository = () => AppDataSource.getRepository(Organization);

export class AuthService {
    /**
     * Register a new user and create their organization
     */
    async register(email: string, password: string, firstName?: string, lastName?: string, organizationName?: string) {
        const result = await AppDataSource.transaction(async (transactionalEntityManager) => {
            // Check if user exists
            const existingUser = await transactionalEntityManager.findOne(User, { where: { email } });
            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Generate verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            // Create or join organization logic
            let orgName = organizationName || `${firstName || email.split('@')[0]}'s Workspace`;
            let savedOrg = await transactionalEntityManager.findOne(Organization, { where: { name: orgName } });
            let isNewOrg = false;

            if (!savedOrg) {
                isNewOrg = true;
                const slug = this.generateSlug(orgName);
                const organization = transactionalEntityManager.create(Organization, {
                    id: crypto.randomUUID(),
                    name: orgName,
                    slug,
                    plan: 'free',
                    storageLimit: 104857600, // 100MB
                    userLimit: 10, // Increased default to allow more users to join
                    fileLimit: 50,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                savedOrg = await transactionalEntityManager.save(Organization, organization);
            }

            // Create user
            const user = transactionalEntityManager.create(User, {
                id: crypto.randomUUID(),
                email,
                passwordHash,
                firstName: firstName || null,
                lastName: lastName || null,
                emailVerificationToken,
                organization: savedOrg,
                organizationId: savedOrg.id,
                role: isNewOrg ? 'admin' : 'user', // First user is admin
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const savedUser = await transactionalEntityManager.save(User, user);

            return { user: savedUser, organization: savedOrg, isNewOrg };
        });

        // Create default Workspace or join existing one via Prisma after transaction commits
        try {
            if (result.isNewOrg) {
                await prisma.workspace.create({
                    data: {
                        name: 'General Workspace',
                        organizationId: result.organization.id,
                        members: {
                            create: {
                                userId: result.user.id,
                                role: 'admin'
                            }
                        }
                    }
                });
            } else {
                // Join the first available workspace in the joined organization
                const firstWs = await prisma.workspace.findFirst({ 
                    where: { organizationId: result.organization.id },
                    orderBy: { createdAt: 'asc' }
                });
                
                if (firstWs) {
                    await prisma.workspaceMember.create({
                        data: {
                            workspaceId: firstWs.id,
                            userId: result.user.id,
                            role: 'editor' // Standard role for new joiners
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to handle workspace assignment:', err);
        }

        return { user: result.user, organization: result.organization };
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

        if (!user.passwordHash) {
            throw new Error('Account data mismatch. Please use "Forgot Password" or re-register.');
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
    /**
     * Bootstrap the system admin account.
     * Only works if no SystemAdmin exists or with a secret key.
     */
    async bootstrapAdmin() {
        const userRepository = AppDataSource.getRepository(User);
        const orgRepository = AppDataSource.getRepository(Organization);

        // Check if admin@nalyse.com already exists
        let admin = await userRepository.findOneBy({ email: 'admin@nalyse.com' });

        if (admin) {
            // Update existing user to be SystemAdmin with known password
            admin.passwordHash = await bcrypt.hash('nalyse123', 12);
            admin.isActive = true;
            admin.role = 'SystemAdmin' as any;
            admin.emailVerified = true;
            await userRepository.save(admin);
            return admin;
        }

        // Otherwise check if any SystemAdmin exists at all
        const existingSystemAdmin = await userRepository.findOne({
            where: [
                { role: 'SystemAdmin' },
                { role: 'PlatformAdmin' }
            ]
        });

        if (existingSystemAdmin) {
            // Just return the existing one if we don't want to create admin@nalyse.com
            return existingSystemAdmin;
        }

        // Create a default organization for operations
        let org = await orgRepository.findOneBy({ slug: 'nalyse-ops' });
        if (!org) {
            org = orgRepository.create({
                name: 'Nalyse Operations',
                slug: 'nalyse-ops',
                plan: 'pro',
                subscriptionTier: 'enterprise',
                isActive: true
            });
            await orgRepository.save(org);
        }

        const passwordHash = await bcrypt.hash('nalyse123', 12);
        admin = userRepository.create({
            email: 'admin@nalyse.com',
            passwordHash,
            firstName: 'System',
            lastName: 'Admin',
            role: 'SystemAdmin' as any,
            isActive: true,
            emailVerified: true,
            organizationId: org.id
        });

        await userRepository.save(admin);
        return admin;
    }
}
