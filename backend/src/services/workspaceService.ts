import { prisma } from '../config/database';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

// Track active users: Map<workspaceId, Map<socketId, {userId, joinedAt}>>
const workspacePresence = new Map<string, Map<string, { userId: string, joinedAt: Date }>>();

export const initializeWorkspaceSocket = (io: Server) => {
    ioInstance = io;

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] New connection: ${socket.id}`);

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
                socket.join(`workspace:${workspaceId}`);
                
                // Track presence
                if (!workspacePresence.has(workspaceId)) {
                    workspacePresence.set(workspaceId, new Map());
                }
                workspacePresence.get(workspaceId)!.set(socket.id, { userId, joinedAt: new Date() });

                // Send initial presence list back to the user who joined
                const occupants = Array.from(workspacePresence.get(workspaceId)!.values()).map(u => ({
                    userId: u.userId,
                    action: 'joined',
                    timestamp: u.joinedAt
                }));
                
                socket.emit('initial_presence', occupants);

                // Broadcast presence to others in the room
                socket.to(`workspace:${workspaceId}`).emit('workspace:presence', { 
                    userId, 
                    action: 'joined', 
                    timestamp: new Date() 
                });

                console.log(`[Socket] User ${userId} joined workspace ${workspaceId}`);
            } else {
                socket.emit('error', { message: 'Unauthorized or not a member' });
            }
        });

        socket.on('disconnect', () => {
            handleDisconnect(socket);
        });
    });
};

/**
 * Handle user disconnection and broadcast exit to all relevant workspaces
 */
export const handleDisconnect = (socket: Socket) => {
    workspacePresence.forEach((occupants, workspaceId) => {
        if (occupants.has(socket.id)) {
            const { userId } = occupants.get(socket.id)!;
            occupants.delete(socket.id);
            
            // Broadcast leave event
            if (ioInstance) {
                ioInstance.to(`workspace:${workspaceId}`).emit('workspace:presence', {
                    userId,
                    action: 'left',
                    timestamp: new Date()
                });
            }
            
            console.log(`[Socket] User ${userId} left workspace ${workspaceId} (disconnect)`);
            
            // Cleanup empty workspace maps
            if (occupants.size === 0) {
                workspacePresence.delete(workspaceId);
            }
        }
    });
};

/**
 * Log an activity to the AuditLog and immediately broadcast it to the workspace.
 */
export const executeWorkspaceAction = async (
    workspaceId: string,
    userId: string,
    action: string,
    entityId: string | null = null,
    details?: any
) => {
    try {
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

        if (ioInstance) {
            ioInstance.to(`workspace:${workspaceId}`).emit('workspace:action', auditLog);
        }
    } catch (err) {
        console.error('Failed to log workspace activity', err);
    }
};
