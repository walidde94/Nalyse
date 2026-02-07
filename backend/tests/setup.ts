import { DataSource } from 'typeorm';
import { User } from '../src/entities/User';
import { Organization } from '../src/entities/Organization';
import { File } from '../src/entities/File';
import { Analysis } from '../src/entities/Analysis';
import { Group } from '../src/entities/Group';
import { Project } from '../src/entities/Project';
import { ApiKey } from '../src/entities/ApiKey';
import { RemoteSource } from '../src/entities/RemoteSource';
import { AppDataSource } from '../src/config/database';

export const setupTestDB = async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
};

export const teardownTestDB = async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
};
