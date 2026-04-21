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
        // 1. Audit Log Table
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                workspace_id uuid,
                user_id uuid,
                action text NOT NULL,
                entity_id text,
                details jsonb DEFAULT '{}',
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // 2. Comprehensive Schema Healing (Fallback if Prisma sync is blocked)
        console.log('🧬 [Metadata] Starting Comprehensive Schema Healing...');

        const healingQueries = [
            // Organizations
            `CREATE TABLE IF NOT EXISTS organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, slug text UNIQUE, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id text`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_used bigint DEFAULT 0`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_limit bigint DEFAULT 104857600`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_limit int DEFAULT 1`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS file_limit int DEFAULT 5`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users int DEFAULT 5`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // Users
            `CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, password_hash text NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'member'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token text`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires timestamp with time zone`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS api_keys jsonb DEFAULT '[]'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // Workspaces
            `CREATE TABLE IF NOT EXISTS workspaces (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, organization_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            
            `CREATE TABLE IF NOT EXISTS workspace_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, user_id uuid NOT NULL, role text DEFAULT 'editor')`,
            
            `CREATE TABLE IF NOT EXISTS workspace_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, author_id uuid NOT NULL, content text NOT NULL, created_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}'`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // Files
            `CREATE TABLE IF NOT EXISTS files (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filename text NOT NULL, owner_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS workspace_id uuid`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS mime_type text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS size bigint DEFAULT 0`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // Schedules
            `CREATE TABLE IF NOT EXISTS schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, cron_expression text NOT NULL, organization_id uuid NOT NULL, created_by_user_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_run_at timestamp with time zone`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS target_file_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS dashboard_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS analysis_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,
            
            `CREATE TABLE IF NOT EXISTS schedule_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), schedule_id uuid NOT NULL, status text DEFAULT 'pending', started_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS started_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone`,

            // Workspace Messages
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}'`,

            // Legacy Cleanup: If CamelCase columns exist from failed deployments, rename or drop them
            `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='passwordHash') THEN ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash; END IF; END $$;`,
            `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organizationId') THEN ALTER TABLE users RENAME COLUMN "organizationId" TO organization_id; END IF; END $$;`,
            `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='passwordHash') THEN ALTER TABLE users DROP COLUMN "passwordHash"; END IF; END $$;`
        ];

        for (const query of healingQueries) {
            try {
                await queryRunner.query(query);
            } catch (e: any) {
                console.warn(`[SchemaHealing] Query failed: ${query.substring(0, 50)}... Error: ${e.message}`);
            }
        }

        await queryRunner.release();
        console.log('✅ [Metadata] Comprehensive Schema Healing Verified.');
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
// Heuristic: If DATABASE_URL is empty but we found a valid URL, populate it for Prisma
const finalOptions = getOptions();
if (finalOptions.url && (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10)) {
    process.env.DATABASE_URL = finalOptions.url;
}

export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: finalOptions.url
        }
    }
});

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
