import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
let globalIo: Server | null = null;

export const initializePresenceSocket = (io: Server) => {
    globalIo = io;
    io.on('connection', (socket: Socket) => {
        let userId: string | null = null;

        // Try to get userId from auth token or query
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (token) {
            try {
                const decoded = jwt.verify(
                    token as string,
                    process.env.JWT_SECRET || 'dev-secret-key'
                ) as any;
                userId = decoded.userId;
            } catch (err) {
                // Silently fail if token is invalid
            }
        }

        if (userId) {
            // Track connection
            const isFirstConnection = !connectedUsers.has(userId);
            if (isFirstConnection) {
                connectedUsers.set(userId, new Set());
                
                // Fetch current status from DB to broadcast correctly
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { presenceStatus: true, customStatusText: true }
                }).then((user: any) => {
                    if (user) {
                        let currentStatus = user.presenceStatus || 'available';
                        
                        // If they were marked offline in DB, they are now available because they connected
                        if (currentStatus === 'offline') {
                            currentStatus = 'available';
                            // Update DB so poll and others see them as available
                            prisma.user.update({
                                where: { id: userId },
                                data: { presenceStatus: 'available', lastActiveAt: new Date() }
                            }).catch((e: any) => console.error('[Presence] DB Update failed on connect:', e));
                        }

                        io.emit('live_update', { 
                            entity: 'presence', 
                            data: { 
                                userId, 
                                status: currentStatus,
                                customText: user.customStatusText || null
                            },
                            timestamp: new Date()
                        });
                    }
                }).catch((err: any) => {
                    console.error('[Presence] Error fetching user status on connect:', err);
                });
            }
            connectedUsers.get(userId)!.add(socket.id);
            console.log(`[Presence] User ${userId} connected. Total connections: ${connectedUsers.get(userId)!.size}`);
        }

        socket.on('disconnect', () => {
            if (userId && connectedUsers.has(userId)) {
                connectedUsers.get(userId)!.delete(socket.id);
                if (connectedUsers.get(userId)!.size === 0) {
                    connectedUsers.delete(userId);
                    
                    // Fetch from DB to preserve persistent statuses
                    prisma.user.findUnique({
                        where: { id: userId },
                        select: { presenceStatus: true, customStatusText: true }
                    }).then((user: any) => {
                        let finalStatus = 'offline';
                        if (user && ['vacation', 'busy', 'away'].includes(user.presenceStatus)) {
                            finalStatus = user.presenceStatus;
                        }
                        
                        io.emit('live_update', { 
                            entity: 'presence', 
                            data: { 
                                userId, 
                                status: finalStatus,
                                customText: user?.customStatusText || null 
                            },
                            timestamp: new Date()
                        });
                        console.log(`[Presence] User ${userId} went offline (status broadcast: ${finalStatus}).`);
                    }).catch((err: any) => {
                        console.error('[Presence] Error on disconnect status check:', err);
                        io.emit('live_update', { 
                            entity: 'presence', 
                            data: { userId, status: 'offline' },
                            timestamp: new Date()
                        });
                    });
                }
            }
        });
    });
};

export const broadcastStatusUpdate = (userId: string, status: string, customText: string | null) => {
    if (globalIo) {
        globalIo.emit('live_update', {
            entity: 'presence',
            data: { userId, status, customText },
            timestamp: new Date()
        });
    }
};

export const getOnlineUsers = () => Array.from(connectedUsers.keys());

export const isUserOnline = (userId: string) => connectedUsers.has(userId);
