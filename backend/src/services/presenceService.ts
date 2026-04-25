import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const initializePresenceSocket = (io: Server) => {
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
            if (!connectedUsers.has(userId)) {
                connectedUsers.set(userId, new Set());
                // Broadcast that user is now online
                io.emit('live_update', { 
                    entity: 'presence', 
                    data: { userId, status: 'available' },
                    timestamp: new Date()
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
                    // Broadcast that user is now offline
                    io.emit('live_update', { 
                        entity: 'presence', 
                        data: { userId, status: 'offline' },
                        timestamp: new Date()
                    });
                    console.log(`[Presence] User ${userId} went offline.`);
                }
            }
        });
    });
};

export const getOnlineUsers = () => Array.from(connectedUsers.keys());

export const isUserOnline = (userId: string) => connectedUsers.has(userId);
