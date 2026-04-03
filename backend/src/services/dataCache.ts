import crypto from 'crypto';
import Redis from 'ioredis';

// Redis connection setup for LRU / Global Object Cache
const redis = new Redis(process.env.REDIS_CACHE_URL || 'redis://localhost:6379/1', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
    }
});
redis.on('error', () => { /* silently ignore — cache fails open */ });

export const generateCacheKey = (...args: any[]) => {
    return `nalyse_cache:${crypto.createHash('sha256').update(JSON.stringify(args)).digest('hex')}`;
};

export class DistributedCache {
    /**
     * Set a value in Redis with a TTL (Time To Live in seconds)
     */
    static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!key) return;
        try {
            const data = JSON.stringify(value);
            await redis.set(key, data, 'EX', ttlSeconds);
        } catch (error) {
            console.error('[Redis Cache] Set Error:', error);
        }
    }

    /**
     * Get a decompressed value from Redis if it exists
     */
    static async get<T>(key: string): Promise<T | null> {
        if (!key) return null;
        try {
            const data = await redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            console.error('[Redis Cache] Get Error:', error);
            return null;
        }
    }

    /**
     * Delete an exact key
     */
    static async delete(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('[Redis Cache] Delete Error:', error);
        }
    }

    /**
     * Invalidate multiple keys by pattern match
     */
    static async invalidatePattern(pattern: string): Promise<number> {
        let cursor = '0';
        let count = 0;
        try {
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `nalyse_cache:*${pattern}*`, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    await redis.del(...keys);
                    count += keys.length;
                }
            } while (cursor !== '0');
            console.log(`[Redis Cache] Invalidated ${count} keys for pattern ${pattern}`);
            return count;
        } catch (error) {
            console.error('[Redis Cache] Pattern Invalidation Error:', error);
            return 0;
        }
    }

    /**
     * Flush entire application cache explicitly
     */
    static async flushAll(): Promise<void> {
        await redis.flushdb();
        console.log('[Redis Cache] Flushed all cache instances');
    }
}
