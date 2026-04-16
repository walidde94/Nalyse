import { prisma } from '../config/database';
import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const initializeWorkspaceSocket = (io: Server) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        // Authenticate/Join Workspace Room
        socket.on('join_workspace', async (data: { workspaceId: string, userId: string }) => {
            const { workspaceId, userId } = data;
            
            // Validate membership via Prisma
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: { workspaceId, userId }
                }
            });

            if (membership) {
                // Join successful
                socket.join(`workspace:${workspaceId}`);
                
                // Broadcast presence globally inside the room
                socket.to(`workspace:${workspaceId}`).emit('workspace:presence', { 
                    userId, 
                    action: 'joined', 
                    timestamp: new Date() 
                });
            } else {
                socket.emit('error', { message: 'Unauthorized or not a member' });
            }
        });

        socket.on('disconnect', () => {
             // Handle cleanup if needed
        });
    });
};

/**
 * Log an activity to the AuditLog and immediately broadcast it to the workspace.
 * Uses Command-Event pattern mapping directly to our frontend Zustand requirements.
 */
export const executeWorkspaceAction = async (
    workspaceId: string,
    userId: string,
    action: string, // e.g., 'FILE_UPLOADED', 'ANALYSIS_STARTED'
    entityId: string | null = null,
    details?: any
) => {
    try {
        // 1. Write immutable log
        const auditLog = await prisma.auditLog.create({
            data: {
                workspaceId,
                userId,
                action,
                entityId,
                details: details || {}
            },
            include: { user: { select: { id: true, email: true, displayName: true } } }
        });

        // 2. Broadcast via WebSocket
        if (ioInstance) {
            ioInstance.to(`workspace:${workspaceId}`).emit('workspace:action', {
                ...auditLog,
                timestamp: new Date()
            });
        }
    } catch (err) {
        console.error('Failed to log workspace activity', err);
    }
};
