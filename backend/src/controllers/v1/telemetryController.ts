import { Request, Response } from 'express';

let mockTelemetryData = [
    { id: 1, device: 'Terminal-Alpha', throughput: 850, latency: 12, status: 'online', lastUpdate: new Date().toISOString() },
    { id: 2, device: 'Node-Omega', throughput: 420, latency: 45, status: 'warning', lastUpdate: new Date().toISOString() },
    { id: 3, device: 'Gateway-Zetta', throughput: 1200, latency: 8, status: 'online', lastUpdate: new Date().toISOString() },
    { id: 4, device: 'Edge-Beta', throughput: 150, latency: 120, status: 'critical', lastUpdate: new Date().toISOString() },
];

export const getTelemetry = (req: Request, res: Response) => {
    res.json(mockTelemetryData);
};

export const pushTelemetry = (req: Request, res: Response) => {
    const { device, value, status } = req.body;

    // Create new row
    const newRow = {
        id: mockTelemetryData.length + 1,
        device: device || `Device-${Math.random().toString(36).substring(7).toUpperCase()}`,
        throughput: value || Math.floor(Math.random() * 1000) + 100,
        latency: Math.floor(Math.random() * 50) + 5,
        status: status || (Math.random() > 0.8 ? 'warning' : 'online'),
        lastUpdate: new Date().toISOString()
    };

    mockTelemetryData.push(newRow);

    // Trigger Real-time Update via Socket.io
    // Since we are in a controller, we require index to get the broadcast helper
    try {
        const { broadcastUpdate } = require('../../index');
        broadcastUpdate('source_data', {
            count: mockTelemetryData.length,
            latest: newRow.device,
            triggeredBy: 'manual_push'
        });
        // Also broadcast as a file update to trigger generic UI refreshes in App.tsx
        broadcastUpdate('file', { action: 'source_push', sourceId: 'telemetry', userId: (req as any).user?.userId });
    } catch (e) {
        console.error('Failed to broadcast update:', e);
    }

    res.status(201).json({
        message: 'Telemetry row pushed successfully',
        row: newRow,
        totalRows: mockTelemetryData.length
    });
};
