import path from 'path';
import { DataSource } from 'typeorm';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@clickhouse/client';
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
        console.log('✅ Database connection established.');

        // Legacy auto-sync block removed. Schema should be managed exclusively via Prisma.
    } catch (error: any) {
        console.error('❌ Database connection failed!');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        
        // Store the error globally so we can report it in health checks
        (global as any).DB_CONNECTION_ERROR = error.message;
        
        throw error;
    }
};

// ─── Prisma Client (used by sprint-6 modules) ──────────────────────────────
export const prisma = new PrismaClient();

// ─── ClickHouse Client (used by ClickHouseService) ─────────────────────────
export const clickhouse = createClient({
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'default',
});
