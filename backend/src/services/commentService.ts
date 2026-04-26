import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export const initializeCommentSocket = (io: Server) => {
    ioInstance = io;

    io.on('connection', (socket: Socket) => {
        socket.on('join_analysis', (data: { analysisId: string }) => {
            const { analysisId } = data;
            socket.join(`analysis:${analysisId}`);
            console.log(`[CommentSocket] Socket ${socket.id} joined analysis ${analysisId}`);
        });

        socket.on('leave_analysis', (data: { analysisId: string }) => {
            const { analysisId } = data;
            socket.leave(`analysis:${analysisId}`);
        });
    });
};

export const broadcastCommentUpdate = (analysisId: string, event: string, payload: any) => {
    if (ioInstance) {
        console.log(`[CommentSocket] Broadcasting ${event} to analysis:${analysisId}`);
        ioInstance.to(`analysis:${analysisId}`).emit(event, payload);
    }
};
