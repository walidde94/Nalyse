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
        synchronize: !isProd, // NEVER auto-synchronize in production — use migrations instead
        logging: false,
        entities,
        migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
    };

    if (process.env.DATABASE_URL) {
        // Favor URL if provided. 
        // IMPORTANT: Strip Prisma-specific flags (like pgbouncer=true) which can confuse TypeORM's underlying driver.
        let url = process.env.DATABASE_URL;
        if (url.includes('?')) {
            const [base, query] = url.split('?');
            const params = query.split('&').filter(p => !p.includes('pgbouncer') && !p.includes('workaround'));
            url = params.length > 0 ? `${base}?${params.join('&')}` : base;
        }
        config.url = url;
    } else {
        config.host = process.env.DB_HOST || 'localhost';
        config.port = parseInt(process.env.DB_PORT || '5432');
        config.username = process.env.DB_USER || 'admin';
        config.password = process.env.DB_PASSWORD || '';
        config.database = process.env.DB_NAME || 'nalyse_dev';
    }

    // Enhanced SSL Handling for Neon/Supabase/Render
    // Supabase and Render require SSL for external connections
    const useSSL = isProd || process.env.DB_SSL === 'true' || (config.url && (config.url.includes('sslmode=require') || config.url.includes('supabase.co') || config.url.includes('pooler.supabase.com')));

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

        // Lazy-sync schema changes for new deployments
        if (!isTest) {
            try {
                const queryRunner = AppDataSource.createQueryRunner();
                const dashTable = await queryRunner.getTable('dashboards');
                const filesTable = await queryRunner.getTable('files');
                const needsSync = !dashTable || 
                    (filesTable && !filesTable.findColumnByName('isProcessed'));
                
                if (needsSync) {
                    console.log('🔄 Schema drift detected, synchronizing...');
                    await AppDataSource.synchronize(false);
                    console.log('✅ Schema synchronized successfully.');
                }
                await queryRunner.release();
            } catch (e) {
                console.error('⚠️ Schema sync check failed:', e);
            }
        }
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
