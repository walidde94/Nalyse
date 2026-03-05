import { performKmeans, KMeansResult } from 'nalyse-engine';

export class RustEngineService {
    /**
     * Offloads heavy K-Means clustering to the compiled Rust N-API Micro-Engine.
     */
    public static calculateKMeans(data: number[], k: number, maxIterations: number = 100): KMeansResult {
        console.log(`[Rust Engine] Offloading ${data.length} points for K-Means to Rust core...`);
        const result = performKmeans(data, k, maxIterations);
        console.log(`[Rust Engine] Calculation complete. Generated ${result.clusters.length} clusters.`);
        return result;
    }
}
