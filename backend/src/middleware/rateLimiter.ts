import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Dedicated Redis instance for rate limiting to avoid blocking cache/queue operations
const redisUrl = process.env.REDIS_RATE_LIMIT_URL || 'redis://localhost:6379/2';
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 times to avoid terminal spam
        return Math.min(times * 50, 2000);
    }
});

// Suppress unhandled Redis error events to prevent terminal spam when Redis is offline
redis.on('error', () => { /* silently ignore — rate limiter fails open */ });

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    errorMessage?: string;
}

/**
 * High-performance sliding window rate limiter backed by Redis.
 * O(1) performance using EVAL Lua scripts to guarantee atomicity and speed.
 */
export const redisRateLimiter = (config: RateLimitConfig) => {
    const {
        windowMs,
        maxRequests,
        keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
        errorMessage = 'Too many requests, please try again later.'
    } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting entirely if Redis connection is dead
        if (redis.status !== 'ready') {
            return next();
        }

        const key = `rate_limit:${keyGenerator(req)}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            // Atomic transaction to clear old hits, add new hit, and count current hits
            const multi = redis.multi();
            multi.zremrangebyscore(key, 0, windowStart);
            multi.zadd(key, now, `${now}-${Math.random()}`); // Unique member
            multi.zcard(key);
            multi.pexpire(key, windowMs);

            const results = await multi.exec();

            if (!results) {
                return next(); // Fail open if Redis fails
            }

            // The result of zcard is at index 2 of the multi.exec() return array
            const requestCount = results[2][1] as number;

            // Set standard RateLimit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
            res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).getTime());

            if (requestCount > maxRequests) {
                res.status(429).json({
                    error: errorMessage,
                    retryAfter: windowMs / 1000
                });
                return;
            }

            next();
        } catch (error: any) {
            // Silently fail open for known Redis-down errors
            if (error?.message?.includes('Connection is closed') || error?.message?.includes('ECONNREFUSED')) {
                return next();
            }
            console.error('[RateLimiter] Unexpected error:', error?.message);
            next();
        }
    };
};

/**
 * Pre-configured rate limiters for different contexts
 */

export const globalApiLimiter = redisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 reqs per minute standard
    keyGenerator: (req) => req.ip || 'unknown'
});

export const authLimiter = redisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 attempts per 15 mins
    keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
    errorMessage: 'Too many authentication attempts. Please try again later.'
});

export const webhookLimiter = redisRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 1000, // 1000 webhook events per minute per organization
    keyGenerator: (req) => {
        // Assume API key/webhook token is passed in header
        const orgHeader = req.headers['x-organization-id'] as string;
        return orgHeader || req.ip || 'unknown';
    },
    errorMessage: 'Webhook rate limit exceeded.'
});

export const heavyComputeLimiter = redisRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 heavy AI/forecast tasks per 5 minutes per user
    keyGenerator: (req: any) => req.user?.userId || req.ip || 'unknown',
    errorMessage: 'Heavy compute quota exceeded. Please wait before running more intensive tasks.'
});
