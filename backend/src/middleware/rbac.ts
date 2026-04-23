import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';

// Define the permissions available across the system
export enum Permission {
    // Analysis
    CREATE_ANALYSIS = 'create:analysis',
    READ_ANALYSIS = 'read:analysis',
    UPDATE_ANALYSIS = 'update:analysis',
    DELETE_ANALYSIS = 'delete:analysis',
    SHARE_ANALYSIS = 'share:analysis',

    // Files
    UPLOAD_FILE = 'upload:file',
    READ_FILE = 'read:file',
    DELETE_FILE = 'delete:file',

    // Org / Users
    MANAGE_USERS = 'manage:users',
    MANAGE_ORG = 'manage:org',
    MANAGE_BILLING = 'manage:billing',

    // Platform Level
    MANAGE_PLATFORM = 'manage:platform',
}

// Define Role -> Permissions mapping
export const RolePermissions: Record<string, Permission[]> = {
    owner: [
        ...Object.values(Permission)
    ],
    admin: [
        Permission.CREATE_ANALYSIS, Permission.READ_ANALYSIS, Permission.UPDATE_ANALYSIS, Permission.DELETE_ANALYSIS, Permission.SHARE_ANALYSIS,
        Permission.UPLOAD_FILE, Permission.READ_FILE, Permission.DELETE_FILE,
        Permission.MANAGE_USERS,
    ],
    analyst: [
        Permission.CREATE_ANALYSIS, Permission.READ_ANALYSIS, Permission.UPDATE_ANALYSIS, Permission.SHARE_ANALYSIS,
        Permission.UPLOAD_FILE, Permission.READ_FILE,
    ],
    viewer: [
        Permission.READ_ANALYSIS, Permission.READ_FILE
    ],
    user: [ // Legacy default role mapping
        ...Object.values(Permission)
    ],
    SystemAdmin: [
        ...Object.values(Permission)
    ],
    PlatformAdmin: [
        ...Object.values(Permission)
    ]
};

export const requireSystemAdmin = () => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (req.user.role !== 'SystemAdmin' && req.user.role !== 'PlatformAdmin') {
            return res.status(403).json({ error: 'Forbidden: Platform Administration access required' });
        }
        
        next();
    }
};

export const requirePermission = (permission: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        const orgId = req.user.organizationId;

        // Let's assume the user has a globally assigned role for now, in a multi-tenant setup we would check their role in the current organization
        const permissionsForRole = RolePermissions[userRole] || [];

        if (!permissionsForRole.includes(permission)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `You do not have the required permission: ${permission}`
            });
        }

        next();
    };
};
