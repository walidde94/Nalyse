import { DataSource } from 'typeorm';
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

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const entities = [User, Organization, File, Analysis, Group, Project, ApiKey, RemoteSource, Agent, AgentTask, AgentLog, Report];

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

    return {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        host: !process.env.DATABASE_URL ? (process.env.DB_HOST || 'localhost') : undefined,
        port: !process.env.DATABASE_URL ? (parseInt(process.env.DB_PORT || '5432')) : undefined,
        username: !process.env.DATABASE_URL ? (process.env.DB_USER || 'admin') : undefined,
        password: !process.env.DATABASE_URL ? (process.env.DB_PASSWORD || '') : undefined,
        database: !process.env.DATABASE_URL ? (process.env.DB_NAME || 'nalyse_dev') : undefined,
        synchronize: true,
        logging: false,
        ssl: isProd ? { rejectUnauthorized: false } : false,
        entities,
        migrations: ['src/migrations/**/*.ts'],
    };
};

export const AppDataSource = new DataSource(getOptions());

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
