/**
 * Analysis Cache — In-Memory LRU Cache with TTL
 *
 * Caches analysis results keyed by file checksum to avoid
 * re-analyzing the same file content. Uses an LRU eviction
 * strategy with configurable max entries and TTL.
 *
 * No external dependencies (Redis not required).
 * Can be swapped for Redis in production by implementing
 * the same AnalysisCache interface.
 *
 * @module analysisCache
 */

import crypto from 'crypto';
import { AnalysisResult } from './analysis/types';

interface CacheEntry {
    result: AnalysisResult;
    timestamp: number;
    size: number;       // Approximate bytes
    accessCount: number;
}

interface CacheConfig {
    maxEntries: number;
    ttlMs: number;          // Time-to-live in milliseconds
    maxMemoryMB: number;    // Approximate max memory usage
}

const DEFAULT_CONFIG: CacheConfig = {
    maxEntries: 100,
    ttlMs: 30 * 60 * 1000,  // 30 minutes
    maxMemoryMB: 256,
};

class AnalysisCacheImpl {
    private cache = new Map<string, CacheEntry>();
    private config: CacheConfig;
    private hits = 0;
    private misses = 0;
    private currentMemoryBytes = 0;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /** Generate cache key from file content checksum + mimetype */
    static createKey(contentOrChecksum: string | Buffer, mimetype: string): string {
        const hash = Buffer.isBuffer(contentOrChecksum)
            ? crypto.createHash('md5').update(contentOrChecksum).digest('hex')
            : contentOrChecksum; // Already a checksum
        return `analysis:${hash}:${mimetype}`;
    }

    /** Get cached analysis result */
    get(key: string): AnalysisResult | null {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }

        // Check TTL
        if (Date.now() - entry.timestamp > this.config.ttlMs) {
            this.currentMemoryBytes -= entry.size;
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        entry.accessCount++;
        this.hits++;

        // Move to end (most recently used) by delete+re-insert
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.result;
    }

    /** Cache an analysis result */
    set(key: string, result: AnalysisResult): void {
        // Estimate size (rough: JSON stringify length)
        const size = JSON.stringify(result).length;

        // Evict if over limits
        while (
            this.cache.size >= this.config.maxEntries ||
            this.currentMemoryBytes + size > this.config.maxMemoryMB * 1024 * 1024
        ) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) {
                const oldEntry = this.cache.get(oldest)!;
                this.currentMemoryBytes -= oldEntry.size;
                this.cache.delete(oldest);
            } else {
                break;
            }
        }

        // Don't cache if single result exceeds 50MB
        if (size > 50 * 1024 * 1024) return;

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            size,
            accessCount: 1,
        });
        this.currentMemoryBytes += size;
    }

    /** Invalidate a specific cache entry */
    invalidate(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentMemoryBytes -= entry.size;
            this.cache.delete(key);
            return true;
        }
        return false;
    }

    /** Invalidate all entries matching a pattern */
    invalidateByChecksum(checksum: string): number {
        let count = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (key.includes(checksum)) {
                this.currentMemoryBytes -= entry.size;
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /** Clear entire cache */
    clear(): void {
        this.cache.clear();
        this.currentMemoryBytes = 0;
        this.hits = 0;
        this.misses = 0;
    }

    /** Get cache statistics */
    getStats(): {
        entries: number;
        hits: number;
        misses: number;
        hitRate: string;
        memoryMB: string;
        maxMemoryMB: number;
    } {
        const total = this.hits + this.misses;
        return {
            entries: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0%',
            memoryMB: `${(this.currentMemoryBytes / 1024 / 1024).toFixed(1)}`,
            maxMemoryMB: this.config.maxMemoryMB,
        };
    }

    /** Periodic cleanup of expired entries */
    cleanup(): number {
        let cleaned = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.ttlMs) {
                this.currentMemoryBytes -= entry.size;
                this.cache.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
}

// Singleton instance
export const analysisCache = new AnalysisCacheImpl();

// Start periodic cleanup every 5 minutes
setInterval(() => {
    const cleaned = analysisCache.cleanup();
    if (cleaned > 0) {
        console.log(`🧹 Analysis cache: cleaned ${cleaned} expired entries. ${analysisCache.getStats().entries} remaining.`);
    }
}, 5 * 60 * 1000);

export { AnalysisCacheImpl };
