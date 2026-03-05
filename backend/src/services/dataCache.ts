import crypto from 'crypto';

class LruCache {
    private cache = new Map<string, { value: any; expiresAt: number }>();
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }

    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key: string, value: any, ttlSeconds: number = 300) {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }

    delete(key: string) {
        this.cache.delete(key);
    }
}

// Singleton cache instance to mimic Redis-like caching behavior without external deps
export const Cache = new LruCache(5000);

export const generateCacheKey = (...args: any[]) => {
    return crypto.createHash('md5').update(JSON.stringify(args)).digest('hex');
};
