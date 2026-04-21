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

    // Favor URL if provided.
    if (process.env.DATABASE_URL) {
        let url = process.env.DATABASE_URL;
        
        // Strip pgbouncer if present as TypeORM doesn't need it for basic connection
        if (url.includes('pgbouncer=true')) {
            url = url.replace('pgbouncer=true', 'pgbouncer=false');
        }
        
        config.url = url;
    } else {
        config.host = process.env.DB_HOST || 'localhost';
        config.port = parseInt(process.env.DB_PORT || '5432');
        config.username = process.env.DB_USER || 'admin';
        config.password = process.env.DB_PASSWORD || '';
        config.database = process.env.DB_NAME || 'nalyse_dev';
    }

    // SSL Handling for Render/Supabase
    if (isProd || process.env.DB_SSL === 'true') {
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
            // In production, a database failure is fatal
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
