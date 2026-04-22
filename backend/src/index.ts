import 'dotenv/config';
import 'reflect-metadata'; // Required for TypeORM
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalApiLimiter, authLimiter as redisAuthLimiter, webhookLimiter } from './middleware/rateLimiter';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase, prisma, typeormReady, prismaReady } from './config/database';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import reportRoutes from './routes/reports';
import biRoutes from './routes/bi';
import organizationRoutes from './routes/organization';
import apiKeyRoutes from './routes/apikeys';
import groupRoutes from './routes/groups';
import projectRoutes from './routes/projects';
import v1Routes from './routes/v1';
import sourceRoutes from './routes/sources';
import agentRoutes from './routes/agents';
import pulseRoutes from './routes/pulse';
import subscriptionRoutes from './routes/subscription';
import aiRoutes from './routes/ai';
import automationRoutes from './routes/automation';
import collaborationRoutes from './routes/collaboration';
import webhookRoutes from './routes/webhooks';
import dashboardRoutes from './routes/dashboards';
import workspaceRoutes from './routes/workspaces';
import chatRoutes from './routes/chats';
import commentRoutes from './routes/comments';
import { initializeWorkspaceSocket } from './services/workspaceService';
import { initializeChatSocket } from './services/chatService';
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true); // Allow all for now to ensure mobile access works smoothly
            }
        },
        methods: ["GET", "POST"]
    }
});

let liveDataCount = 252; // Starting count

export const broadcastUpdate = (entity: string, data: any) => {
    io.emit('live_update', { entity, data, timestamp: new Date() });
};

// NOTE: Socket initialization and schedule engine are started AFTER database
// initialization inside startServer() to prevent Prisma queries before DB is ready.

const PORT = process.env.PORT || 3000;

// Rate limiting for External API
const externalApiLimiter = globalApiLimiter;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: (origin, callback) => {
        // Reflect origin to satisfy credentials: true requirement
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Logging
app.use(morgan('dev'));

// Body parsing (Exclude webhook)
app.use((req, res, next) => {
    if (req.originalUrl === '/api/subscription/webhook') {
        next();
    } else {
        express.json({ limit: '500mb' })(req, res, next);
    }
});
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Rate limiting
app.use('/api/', globalApiLimiter);

app.use('/api/auth/login', redisAuthLimiter);
app.use('/api/auth/register', redisAuthLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bi', biRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/v1', externalApiLimiter, v1Routes);
app.use('/api/sources', sourceRoutes);


app.use('/api/agents', agentRoutes);
app.use('/api/ai', aiRoutes);

app.use('/api/automation', automationRoutes);
app.use('/api/pulse', pulseRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/webhooks', webhookLimiter, webhookRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        services: {
            typeorm: typeormReady ? 'connected' : 'unavailable',
            prisma: prismaReady ? 'connected' : 'unavailable',
        },
        dbError: (global as any).DB_CONNECTION_ERROR || null 
    });
});

app.get('/api/health/db', async (req, res) => {
    try {
        const auditLogCount = await prisma.auditLog.count();
        res.json({ status: 'healthy', auditLogCount });
    } catch (err: any) {
        res.status(500).json({ status: 'unhealthy', error: err.message });
    }
});

// Lightweight heartbeat for latency measurement
app.get('/heartbeat', (req, res) => {
    res.status(204).end();
});

// Heartbeat for dashboard sync (compatibility)
app.head('/heartbeat', (req, res) => {
    res.status(204).end();
});

// Mock Live Data for Testing Connectors
app.get('/api/mock-live-data', (req, res) => {
    const isIndustrial = req.query.scale === 'industrial';
    const isPerformance = req.query.type === 'performance';

    let responseData: any[] = [];

    if (isIndustrial) {
        const hubs = [
            { city: 'Berlin', lat: 52.5200, lng: 13.4050, region: 'Europe' },
            { city: 'New York', lat: 40.7128, lng: -74.0060, region: 'North America' },
            { city: 'Tokyo', lat: 35.6762, lng: 139.6503, region: 'Asia' },
            { city: 'London', lat: 51.5074, lng: -0.1278, region: 'Europe' },
            { city: 'Sydney', lat: -33.8688, lng: 151.2093, region: 'Australia' }
        ];
        const products = ['Omega', 'Sigma', 'Zetta', 'Xenon', 'Quantum'];

        for (let i = 0; i < hubs.length; i++) {
            responseData.push({
                id: i + 1,
                city: hubs[i].city,
                lat: hubs[i].lat,
                lng: hubs[i].lng,
                region: hubs[i].region,
                product: products[i % products.length] + ' V-Series',
                sales: Math.floor(Math.random() * 5000) + 1000,
                timestamp: new Date().toISOString()
            });
        }
    } else if (isPerformance) {
        const clusters = ['CRISIS-ZONE-A', 'CRISIS-ZONE-B', 'FAILOVER-ALPHA'];
        for (let i = 0; i < liveDataCount; i++) {
            responseData.push({
                id: i + 1,
                service: `LegacyNode-${i + 1}`,
                latency_ms: Math.floor(Math.random() * 1200) + 500, // Extreme latency
                throughput: Math.floor(Math.random() * 500), // Collapsed throughput
                memory_usage: Math.floor(Math.random() * 20) + 80, // Maxed memory
                cluster: clusters[i % clusters.length]
            });
        }
    } else {
        responseData = [
            { id: 1, product: "Alpha Unit", sales: 12500, region: "North" },
            { id: 2, product: "Beta Unit", sales: 150, region: "South" },
            { id: 3, product: "Gamma Core", sales: 8400, region: "West" },
            { id: 4, product: "Delta Prime", sales: 11000, region: "North" },
            { id: 5, product: "Epsilon Next", sales: 9500, region: "West" },
            { id: 6, product: "Zeta Final", sales: 200, region: "East" },
            { id: 7, product: "Supernova", sales: 18000, region: "Global" }
        ];
    }

    // Trigger instant signal
    broadcastUpdate('source_data', { count: responseData.length });

    return res.json(responseData);
});

// Endpoint to simulate data growth
app.post('/api/simulate-growth', (req, res) => {
    liveDataCount += 10;
    broadcastUpdate('source_data', { count: liveDataCount });
    res.json({ message: 'Data growing...', currentCount: liveDataCount });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Nalyse API',
        version: '1.0.0',
        docs: '/api/docs'
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
    const isProd = process.env.NODE_ENV === 'production';

    try {
        // Initialize database connection
        await initializeDatabase();
    } catch (error) {
        if (isProd) {
            console.error('💀 Fatal: Database connection required in production. Exiting.');
            process.exit(1);
        }
        // In development, we continue without a database (logged in initializeDatabase)
    }

    // ── Start services that depend on the database ──────────────────────
    // These are started AFTER initializeDatabase() so Prisma queries
    // inside socket handlers and the schedule engine don't fire before
    // the connection is established.

    // Attach Real-Time Workspace & Chat Engines
    initializeWorkspaceSocket(io);
    initializeChatSocket(io);

    // Start the Automated Reporting Cron Engine
    if (prismaReady) {
        const { startScheduleEngine } = require('./services/scheduleEngine');
        startScheduleEngine(20000); // Evaluates reporting schedules every 20 seconds
    } else {
        console.warn('⚠️  Schedule engine skipped (database unavailable)');
    }

    // Start Analytical Workers
    try {
        const { initAnalysisWorker } = require('./services/workers/analysisWorker');
        initAnalysisWorker();
    } catch (error: any) {
        console.warn('⚠️  Analysis worker skipped:', error.message);
    }

    // ── Start HTTP Server ───────────────────────────────────────────────
    httpServer.listen(Number(PORT), () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log(`║  🚀 Nalyse Backend running on port ${PORT}                    ║`);
        console.log('║                                                              ║');
        console.log(`║  TypeORM:   ${typeormReady ? '✅ Connected' : '❌ Unavailable'}                                  ║`);
        console.log(`║  Prisma:    ${prismaReady  ? '✅ Connected' : '❌ Unavailable'}                                  ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
    });
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;
