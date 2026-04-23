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

        const tablesToNormalize = [
            'users', 'organizations', 'workspaces', 'workspace_members', 
            'workspace_messages', 'files', 'schedules', 'schedule_runs', 
            'audit_logs', 'dashboards', 'analyses', 'groups', 'reports',
            'agent', 'agent_task', 'remote_sources', 'direct_messages', 'direct_conversations'
        ];

        for (const table of tablesToNormalize) {
            try {
                // Fetch all columns for the table
                const columns: Array<{column_name: string}> = await queryRunner.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [table]);

                const columnNames = columns.map((c: {column_name: string}) => c.column_name);

                for (const col of columns) {
                    const name = col.column_name;
                    // If column is CamelCase, normalize it to snake_case
                    if (/[A-Z]/.test(name)) {
                        const snakeName = name.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
                        const snakeExists = columnNames.includes(snakeName);

                        if (snakeExists) {
                            // BOTH exist — copy data from CamelCase to snake_case, then DROP CamelCase
                            console.log(`[SchemaNormalizer] Merging ${table}."${name}" -> "${snakeName}" (both exist)`);
                            try {
                                await queryRunner.query(`UPDATE "${table}" SET "${snakeName}" = "${name}" WHERE "${snakeName}" IS NULL AND "${name}" IS NOT NULL`);
                                await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "${name}"`);
                                console.log(`[SchemaNormalizer] Dropped duplicate column ${table}."${name}"`);
                            } catch (e: any) {
                                console.warn(`[SchemaNormalizer] Merge/drop failed for ${table}."${name}": ${e.message}`);
                            }
                        } else {
                            // Only CamelCase exists — rename it
                            console.log(`[SchemaNormalizer] Renaming ${table}."${name}" -> "${snakeName}"`);
                            try {
                                await queryRunner.query(`ALTER TABLE "${table}" RENAME COLUMN "${name}" TO "${snakeName}"`);
                            } catch (e: any) {
                                console.warn(`[SchemaNormalizer] Rename failed for ${table}."${name}": ${e.message}`);
                            }
                        }
                    }
                }
            } catch (e: any) {
                console.warn(`[SchemaNormalizer] Failed to process table ${table}: ${e.message}`);
            }
        }

        const healingQueries = [
            // === Core Tables ===
            `CREATE TABLE IF NOT EXISTS organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL)`,
            `CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL)`,
            `CREATE TABLE IF NOT EXISTS workspaces (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, organization_id uuid NOT NULL)`,

            // === Organizations columns ===
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug text`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id text`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_used bigint DEFAULT 0`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_limit bigint DEFAULT 104857600`,
            `UPDATE organizations SET storage_used = 0 WHERE storage_used IS NULL`,
            `UPDATE organizations SET storage_limit = 104857600 WHERE storage_limit IS NULL`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_limit int DEFAULT 1`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS file_limit int DEFAULT 5`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users int DEFAULT 5`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // === Users columns ===
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`,
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

            // === Workspaces columns ===
            `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,

            // === Workspace Members ===
            `CREATE TABLE IF NOT EXISTS workspace_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, user_id uuid NOT NULL, role text DEFAULT 'editor')`,

            // === Workspace Messages ===
            `CREATE TABLE IF NOT EXISTS workspace_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, author_id uuid NOT NULL, content text NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}'`,
            `ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'`,

            // === Files ===
            `CREATE TABLE IF NOT EXISTS files (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filename text NOT NULL, owner_id uuid NOT NULL)`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS original_name text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS mime_type text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS size bigint DEFAULT 0`,
            `UPDATE files SET size = 0 WHERE size IS NULL`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS path text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS s3_key text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS s3_bucket text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS group_id uuid`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata jsonb`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS checksum text`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS status text DEFAULT 'ready'`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS workspace_id uuid`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // === Analyses ===
            `CREATE TABLE IF NOT EXISTS analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), file_id uuid NOT NULL, created_by_id uuid NOT NULL, status text DEFAULT 'pending', created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS results jsonb`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS insights jsonb`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS statistics jsonb`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS error_message text`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS processing_time_ms int`,
            `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone`,

            // === Analysis Comments ===
            `CREATE TABLE IF NOT EXISTS analysis_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_id uuid NOT NULL, author_id uuid NOT NULL, content text NOT NULL, target_type text NOT NULL, target_id text, reply_to_id uuid, reactions jsonb DEFAULT '[]', is_resolved boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,

            // === Dashboards ===
            `CREATE TABLE IF NOT EXISTS dashboards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, user_id uuid NOT NULL)`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS panels jsonb DEFAULT '[]'`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS grid_layout jsonb DEFAULT '[]'`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS workspace_id uuid`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // === Schedules ===
            `CREATE TABLE IF NOT EXISTS schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, cron_expression text NOT NULL, organization_id uuid NOT NULL, created_by_user_id uuid NOT NULL)`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS config jsonb`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS target_file_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS dashboard_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS analysis_id uuid`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_run_at timestamp with time zone`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS next_run_at timestamp with time zone`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // === Schedule Runs ===
            `CREATE TABLE IF NOT EXISTS schedule_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), schedule_id uuid NOT NULL, status text DEFAULT 'pending', started_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS duration_ms int`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS output_url text`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS error_message text`,
            `ALTER TABLE schedule_runs ADD COLUMN IF NOT EXISTS metadata jsonb`,

            // === Direct Conversations ===
            `CREATE TABLE IF NOT EXISTS direct_conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE direct_conversations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,
            // Prisma many-to-many join table for DirectConversation <-> User
            `CREATE TABLE IF NOT EXISTS "_ConversationParticipants" ("A" uuid NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE, "B" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE)`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "_ConversationParticipants_AB_unique" ON "_ConversationParticipants"("A", "B")`,
            `CREATE INDEX IF NOT EXISTS "_ConversationParticipants_B_index" ON "_ConversationParticipants"("B")`,

            // === Direct Messages ===
            `CREATE TABLE IF NOT EXISTS direct_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL, sender_id uuid NOT NULL, content text NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS image_url text`,
            `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid`,
            `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'`,
            `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false`,
            `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false`,

            // === Notifications ===
            `CREATE TABLE IF NOT EXISTS notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL, message text NOT NULL, created_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'info'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source text DEFAULT 'SYSTEM'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS icon_type text DEFAULT 'bell'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label text`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url text`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS prediction text`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS confidence float`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS impact_score float`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false`,
            `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false`,

            // === Reports ===
            `CREATE TABLE IF NOT EXISTS reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, config jsonb NOT NULL, user_id uuid NOT NULL)`,
            `ALTER TABLE reports ADD COLUMN IF NOT EXISTS organization_id uuid`,
            `ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token text`,
            `ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false`,
            `ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
            `ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()`,

            // === User Invitations ===
            `CREATE TABLE IF NOT EXISTS user_invitations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, token text NOT NULL, organization_id uuid NOT NULL, inviter_id uuid NOT NULL)`,
            `ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS role text DEFAULT 'member'`,
            `ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone`,
            `ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'`,
            `ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,

            // === Audit Logs ===
            `CREATE TABLE IF NOT EXISTS audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, user_id uuid NOT NULL, action text NOT NULL, created_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id text`,
            `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details jsonb`,

            // === Groups ===
            `CREATE TABLE IF NOT EXISTS groups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, owner_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE groups ADD COLUMN IF NOT EXISTS description text`,

            // === Agents ===
            `CREATE TABLE IF NOT EXISTS agent (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, role text NOT NULL, status text NOT NULL, user_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE agent ADD COLUMN IF NOT EXISTS current_goal text`,
            `ALTER TABLE agent ADD COLUMN IF NOT EXISTS final_report text`,
            `CREATE TABLE IF NOT EXISTS agent_task (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), description text NOT NULL, agent_id uuid NOT NULL, status text DEFAULT 'pending', created_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE agent_task ADD COLUMN IF NOT EXISTS result text`,

            // === Remote Sources ===
            `CREATE TABLE IF NOT EXISTS remote_sources (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type text NOT NULL, owner_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE remote_sources ADD COLUMN IF NOT EXISTS config jsonb`,
            `ALTER TABLE remote_sources ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'`,
            `ALTER TABLE remote_sources ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone`,

            // === Webhooks ===
            `CREATE TABLE IF NOT EXISTS webhooks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, url text NOT NULL, organization_id uuid NOT NULL, created_by_user_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS secret text`,
            `ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS events jsonb DEFAULT '["analysis.completed"]'`,
            `ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,

            // === Analysis Configurations ===
            `CREATE TABLE IF NOT EXISTS analysis_configurations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, config jsonb NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now())`,
            `ALTER TABLE analysis_configurations ADD COLUMN IF NOT EXISTS description text`,
            `ALTER TABLE analysis_configurations ADD COLUMN IF NOT EXISTS mode text DEFAULT 'standard'`,
            `ALTER TABLE analysis_configurations ADD COLUMN IF NOT EXISTS is_preset boolean DEFAULT false`,
            `ALTER TABLE analysis_configurations ADD COLUMN IF NOT EXISTS is_built_in boolean DEFAULT false`,
            `ALTER TABLE analysis_configurations ADD COLUMN IF NOT EXISTS owner_id uuid`
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
