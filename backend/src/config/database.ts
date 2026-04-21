import 'dotenv/config';
import path from 'path';
import { DataSource } from 'typeorm';
import { PrismaClient } from '@prisma/client';

// ─── State flags ────────────────────────────────────────────────────────────
/** True once TypeORM has connected successfully */
export let typeormReady = false;
/** True once Prisma has connected successfully */
export let prismaReady = false;

// Prisma instance is at the bottom of the file


async function ensureAuditLogTable() {
    try {
        console.log('🧬 [Metadata] Verifying Audit Pipeline...');
        // We use a raw query to check and create the table bypassing the Prisma CLI push logic
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "audit_logs" (
                "id" TEXT PRIMARY KEY,
                "workspace_id" TEXT NOT NULL,
                "user_id" TEXT NOT NULL,
                "action" TEXT NOT NULL,
                "entity_id" TEXT,
                "details" JSONB,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ [Metadata] Audit Pipeline Verified.');
    } catch (err: any) {
        console.error('⚠️ [Metadata] Audit Pipeline verification failed (non-critical):', err.message);
    }
}

import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { File } from '../entities/File';
import { Analysis } from '../entities/Analysis';
import { Group } from '../entities/Group';
import { Project } from '../entities/Project';
import { ApiKey } from '../entities/ApiKey';
import { RemoteSource } from '../entities/RemoteSource';
import { Agent } from '../entities/Agent';
import { AgentTask } from '../entities/AgentTask';
import { AgentLog } from '../entities/AgentLog';
import { Report } from '../entities/Report';
import { Dashboard } from '../entities/Dashboard';

const entities = [User, Organization, File, Analysis, Group, Project, ApiKey, RemoteSource, Agent, AgentTask, AgentLog, Report, Dashboard];

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const getOptions = (): any => {
    if (isTest) {
        return {
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: false,
            entities,
        };
    }

    // Harden production configuration
    const config: any = {
        type: 'postgres',
        synchronize: false, // Disabled to prevent conflicts with Prisma
        logging: false,
        entities,
        migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
    };

    // Support standard PG environment variables and common hosting patterns
    // We check for length to ensure we don't pick up empty strings from .env files
    const dbUrl = [
        process.env.DATABASE_URL,
        process.env.DATABASE_PUBLIC_URL,
        process.env.POSTGRES_URL,
        process.env.DIRECT_URL
    ].find(url => url && url.length > 10);

    const dbHost = process.env.DB_HOST || process.env.PGHOST || 'localhost';
    const dbPort = parseInt(process.env.DB_PORT || process.env.PGPORT || '5432');
    const dbUser = process.env.DB_USER || process.env.PGUSER || 'admin';
    const dbPass = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
    const dbName = process.env.DB_NAME || process.env.PGDATABASE || 'nalyse_dev';

    if (dbUrl) {
        let url = dbUrl;
        
        // Strip pgbouncer if present as TypeORM doesn't need it for basic connection
        if (url.includes('pgbouncer=true')) {
            url = url.replace('pgbouncer=true', 'pgbouncer=false');
        }
        
        config.url = url;
    } else {
        config.host = dbHost;
        config.port = dbPort;
        config.username = dbUser;
        config.password = dbPass;
        config.database = dbName;
    }

    // SSL Handling for Render/Supabase/Railway
    if (isProd || process.env.DB_SSL === 'true' || (dbUrl && dbUrl.includes('sslmode=require'))) {
        config.ssl = {
            rejectUnauthorized: false
        };
    }

    return config;
};

export const AppDataSource = new DataSource(getOptions());

export const initializeDatabase = async () => {
    // ── TypeORM ──────────────────────────────────────────────────────────
    try {
        const options = getOptions();
        let connectionTarget = '';

        if (options.url) {
            // Log username and host while hiding password: postgresql://username:****@host:port/db
            const match = options.url.match(/postgresql:\/\/(.*?):.*?@(.*?)\//);
            if (match) {
                connectionTarget = `${match[1]}@${match[2]}`;
            } else {
                connectionTarget = options.url.split('@')[1] || 'unknown-host';
            }
        } else {
            connectionTarget = `${options.username}@${options.host}:${options.port}`;
        }

        console.log(`🔌 Initializing database connection for: ${connectionTarget}`);
        await AppDataSource.initialize();
        typeormReady = true;
        console.log('✅ TypeORM database connection established.');
    } catch (error: any) {
        console.error('❌ TypeORM database connection failed!');
        console.error('   Error:', error.message);
        
        // Store the error globally so we can report it in health checks
        (global as any).DB_CONNECTION_ERROR = error.message;
        
        if (isProd) {
            console.error('💀 Fatal: Database connection required in production. Exiting.');
            console.error('   Available Env Keys:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('POSTGRES') || k.includes('URL') || k.includes('PG')));
            throw error;
        }
        
        console.warn('');
        console.warn('╔══════════════════════════════════════════════════════════════╗');
        console.warn('║  ⚠️  DATABASE UNAVAILABLE — Running in degraded mode        ║');
        console.warn('║                                                              ║');
        console.warn('║  The server will start, but database-dependent features      ║');
        console.warn('║  (auth, files, workspaces, etc.) will return errors.         ║');
        console.warn('║                                                              ║');
        console.warn('║  To fix:                                                     ║');
        console.warn('║    • docker-compose up -d db    (easiest)                    ║');
        console.warn('║    • Install PostgreSQL locally                              ║');
        console.warn('║    • Set DATABASE_URL in .env                                ║');
        console.warn('╚══════════════════════════════════════════════════════════════╝');
        console.warn('');
    }

    // ── Prisma ───────────────────────────────────────────────────────────
    try {
        await prisma.$connect();
        prismaReady = true;
        console.log('✅ Prisma database connection established.');
        
        // Ensure critical Prisma tables exist (Manual fallback for Supabase pooler issues)
        await ensureAuditLogTable();
    } catch (error: any) {
        console.error('❌ Prisma database connection failed:', error.message);
        
        if (isProd) {
            throw error;
        }
        // In development, we already showed the banner above — just continue
    }
};

// ─── Prisma Client (used by sprint-6 modules) ──────────────────────────────
export const prisma = new PrismaClient();

// ─── ClickHouse Client (lazy — only created when needed) ────────────────────
let _clickhouse: any = null;

export const getClickhouse = () => {
    if (!_clickhouse) {
        try {
            const { createClient } = require('@clickhouse/client');
            _clickhouse = createClient({
                url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
                username: process.env.CLICKHOUSE_USER || 'default',
                password: process.env.CLICKHOUSE_PASSWORD || '',
                database: process.env.CLICKHOUSE_DATABASE || 'default',
            });
        } catch (err: any) {
            console.warn('[ClickHouse] Client creation failed (non-critical):', err.message);
            return null;
        }
    }
    return _clickhouse;
};

// Backward-compatible export — lazy proxy
export const clickhouse = new Proxy({} as any, {
    get(_target, prop) {
        const client = getClickhouse();
        if (!client) {
            // Return no-op functions for missing ClickHouse
            if (typeof prop === 'string') {
                return (..._args: any[]) => {
                    console.warn(`[ClickHouse] Not available — skipping ${String(prop)}()`);
                    return Promise.resolve(null);
                };
            }
            return undefined;
        }
        return client[prop];
    }
});
