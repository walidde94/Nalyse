import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface IStorageService {
    uploadFile(file: Express.Multer.File): Promise<{ key: string; location: string }>;
    deleteFile(key: string): Promise<void>;
    getSignedUrl(key: string): Promise<string>;
}

export class LocalStorageService implements IStorageService {
    private uploadDir: string;

    constructor(uploadDir: string = 'uploads/') {
        this.uploadDir = uploadDir;
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<{ key: string; location: string }> {
        // In local storage, multer might have already saved it to 'path'. 
        // If we want to standardize, we might move it from temp to permanent here.
        // For now, we assume multer saved it and we just return the relative path as key.

        const filename = file.filename;
        const key = filename; // for local, key is filename
        const location = file.path; // absolute or relative path

        return { key, location };
    }

    async deleteFile(key: string): Promise<void> {
        const filePath = path.join(this.uploadDir, key);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    async getSignedUrl(key: string): Promise<string> {
        // For local dev, return a static file served URL
        return `/uploads/${key}`;
    }
}

// Placeholder for S3
export class S3StorageService implements IStorageService {
    // AWS SDK would be imported here

    constructor() { }

    async uploadFile(file: Express.Multer.File): Promise<{ key: string; location: string }> {
        throw new Error('S3 Not Configured');
    }

    async deleteFile(key: string): Promise<void> {
    }

    async getSignedUrl(key: string): Promise<string> {
        return '';
    }
}

// Factory
export const storageService = new LocalStorageService();
// export const storageService = process.env.OrUseS3 ? new S3StorageService() : new LocalStorageService();
