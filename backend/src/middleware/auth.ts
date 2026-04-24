import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        organizationId?: string;
    };
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set') })() : 'dev-secret-key')
        ) as any;

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            organizationId: decoded.organizationId
        };

        // Security Check: Force Logout validation
        const { prisma, prismaReady } = await import('../config/database');
        if (prismaReady) {
            const dbUser = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { forceLogoutAt: true }
            });

            if (dbUser?.forceLogoutAt) {
                const tokenIssuedAtMs = (decoded.iat || 0) * 1000;
                const forceLogoutTimeMs = new Date(dbUser.forceLogoutAt).getTime();
                
                // If token was issued before (or at the same second as) the force logout timestamp, invalidate it
                // We use a 1s buffer to ensure immediate enforcement regardless of clock skew
                if (tokenIssuedAtMs <= forceLogoutTimeMs + 1000) {
                    console.warn(`[Security] Force logout enforced for user ${decoded.userId}. IAT: ${tokenIssuedAtMs}, ForceLogoutAt: ${forceLogoutTimeMs}`);
                    return res.status(401).json({ 
                        error: 'Session invalidated by administrator', 
                        code: 'FORCE_LOGOUT'
                    });
                }
            }

            // Background update of lastActiveAt
            prisma.user.update({
                where: { id: decoded.userId },
                data: { lastActiveAt: new Date() }
            }).catch(() => {});
        }

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Optional authentication - adds user to request if token is valid, but doesn't require it
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set') })() : 'dev-secret-key')
            ) as any;

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                organizationId: decoded.organizationId
            };
        }

        next();
    } catch (error) {
        // Continue without auth if token is invalid
        next();
    }
};
