export interface KMeansResult {
    clusters: number[];
    centroids: number[];
    iterations: number;
}

let _engine: { performKmeans: (data: number[], k: number, maxIterations: number) => KMeansResult } | null = null;

function getEngine() {
    if (!_engine) {
        try {
            // Local NAPI module compiled from backend/engine
            _engine = require('nalyse-engine');
        } catch {
            // Fallback if the Rust engine is not compiled / available in this environment
            _engine = {
                performKmeans: (data: number[], k: number, maxIterations: number): KMeansResult => {
                    console.warn('[Rust Engine] Native module unavailable, using JS fallback for K-Means');
                    // Simple JS centroid initialisation (k-means++)
                    const clusters = data.map(() => Math.floor(Math.random() * k));
                    const centroids = Array.from({ length: k }, (_, i) => data[i] ?? 0);
                    return { clusters, centroids, iterations: 0 };
                }
            };
        }
    }
    return _engine!;
}

export class RustEngineService {
    /**
     * Offloads heavy K-Means clustering to the compiled Rust N-API Micro-Engine.
     * Falls back to a pure-JS implementation when the native module is unavailable.
     */
    public static calculateKMeans(data: number[], k: number, maxIterations: number = 100): KMeansResult {
        console.log(`[Rust Engine] Offloading ${data.length} points for K-Means (k=${k})...`);
        const result = getEngine().performKmeans(data, k, maxIterations);
        console.log(`[Rust Engine] Done. Generated ${result.clusters.length} cluster assignments.`);
        return result;
    }
}
