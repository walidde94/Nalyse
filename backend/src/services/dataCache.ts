import crypto from 'crypto';
import Redis from 'ioredis';

// ─── Lazy Redis Connection ──────────────────────────────────────────────────
// Redis is NOT connected at import time. The connection is created on first use
// so the server can start cleanly without Redis installed.
let redis: Redis | null = null;
let redisAvailable = false;

function getRedis(): Redis | null {
    if (redis) return redisAvailable ? redis : null;

    try {
        redis = new Redis(process.env.REDIS_CACHE_URL || 'redis://localhost:6379/1', {
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            lazyConnect: true,
            connectTimeout: 3000,
            retryStrategy(times) {
                if (times > 3) return null;
                return Math.min(times * 200, 2000);
            }
        });

        redis.on('error', () => { /* silently ignore — cache fails open */ });
        redis.on('ready', () => { redisAvailable = true; });
        redis.on('close', () => { redisAvailable = false; });

        // Attempt non-blocking connect
        redis.connect().catch(() => {
            // Redis not available — all cache ops will no-op
        });
    } catch {
        // If even creating the client fails, return null
        redis = null;
    }

    return null; // First call always returns null; subsequent calls check redisAvailable
}

// Trigger lazy init on module load (non-blocking)
getRedis();

export const generateCacheKey = (...args: any[]) => {
    return `nalyse_cache:${crypto.createHash('sha256').update(JSON.stringify(args)).digest('hex')}`;
};

export class DistributedCache {
    /**
     * Set a value in Redis with a TTL (Time To Live in seconds)
     */
    static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!key || !redisAvailable || !redis) return;
        try {
            const data = JSON.stringify(value);
            await redis.set(key, data, 'EX', ttlSeconds);
        } catch (error) {
            // Fail open — cache miss is acceptable
        }
    }

    /**
     * Get a decompressed value from Redis if it exists
     */
    static async get<T>(key: string): Promise<T | null> {
        if (!key || !redisAvailable || !redis) return null;
        try {
            const data = await redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            return null;
        }
    }

    /**
     * Delete an exact key
     */
    static async delete(key: string): Promise<void> {
        if (!redisAvailable || !redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            // Fail open
        }
    }

    /**
     * Invalidate multiple keys by pattern match
     */
    static async invalidatePattern(pattern: string): Promise<number> {
        if (!redisAvailable || !redis) return 0;
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
            return 0;
        }
    }

    /**
     * Flush entire application cache explicitly
     */
    static async flushAll(): Promise<void> {
        if (!redisAvailable || !redis) return;
        await redis.flushdb();
        console.log('[Redis Cache] Flushed all cache instances');
    }
}
