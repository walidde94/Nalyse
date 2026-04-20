import { prisma } from '../config/database';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

// Track active users in DM conversations: Map<conversationId, Set<socketId>>
const conversationPresence = new Map<string, Set<string>>();

export const initializeChatSocket = (io: Server) => {
    ioInstance = io;

    io.on('connection', (socket: Socket) => {
        // Join a private conversation room
        socket.on('join_chat', async (data: { conversationId: string, userId: string }) => {
            const { conversationId, userId } = data;
            
            // Verify user is a participant in this conversation
            const conversation = await prisma.directConversation.findFirst({
                where: {
                    id: conversationId,
                    participants: {
                        some: { id: userId }
                    }
                }
            });

            if (conversation) {
                socket.join(`chat:${conversationId}`);
                
                if (!conversationPresence.has(conversationId)) {
                    conversationPresence.set(conversationId, new Set());
                }
                conversationPresence.get(conversationId)!.add(socket.id);

                console.log(`[ChatSocket] User ${userId} joined conversation ${conversationId}`);
            } else {
                socket.emit('error', { message: 'Unauthorized: Not a participant of this conversation' });
            }
        });

        socket.on('leave_chat', (data: { conversationId: string }) => {
            const { conversationId } = data;
            socket.leave(`chat:${conversationId}`);
            if (conversationPresence.has(conversationId)) {
                conversationPresence.get(conversationId)!.delete(socket.id);
                if (conversationPresence.get(conversationId)!.size === 0) {
                    conversationPresence.delete(conversationId);
                }
            }
        });

        socket.on('disconnect', () => {
            conversationPresence.forEach((sockets, conversationId) => {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        conversationPresence.delete(conversationId);
                    }
                }
            });
        });
    });
};

/**
 * Broadcast a new direct message to all participants in a conversation room
 */
export const broadcastDirectMessage = (conversationId: string, event: string, payload: any) => {
    if (ioInstance) {
        ioInstance.to(`chat:${conversationId}`).emit(event, payload);
    }
};
