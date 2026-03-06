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

const entities = [User, Organization, File, Analysis, Group, Project, ApiKey, RemoteSource, Agent, AgentTask, AgentLog, Report];

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
        synchronize: !isProd, // NEVER auto-synchronize in production — use migrations instead
        logging: false,
        entities,
        migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
    };

    if (process.env.DATABASE_URL) {
        // Favor URL if provided (standard for Render/Heroku)
        config.url = process.env.DATABASE_URL;
    } else {
        config.host = process.env.DB_HOST || 'localhost';
        config.port = parseInt(process.env.DB_PORT || '5432');
        config.username = process.env.DB_USER || 'admin';
        config.password = process.env.DB_PASSWORD || '';
        config.database = process.env.DB_NAME || 'nalyse_dev';
    }

    // Enhanced SSL Handling for Neon/Supabase/Render
    // Enable SSL if in production OR if explicitly requested via DB_SSL env var
    const useSSL = isProd || process.env.DB_SSL === 'true' || (config.url && config.url.includes('sslmode=require'));

    if (useSSL) {
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
        const connectionTarget = options.url
            ? options.url.split('@')[1] // Log just the host part for security
            : `${options.host}:${options.port}`;

        console.log(`🔌 Attempting to connect to database at: ${connectionTarget}`);
        await AppDataSource.initialize();
        console.log('✅ Database connection established.');
    } catch (error: any) {
        console.error('❌ Database connection failed!');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.code === 'XX000') {
            console.error('💡 Typical cause: Incorrect credentials or database name for cloud providers like Neon.');
        }
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
