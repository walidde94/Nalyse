import { prisma } from '../../config/database';
import {
    AnalysisConfig, CreateAnalysisConfigDTO, UpdateAnalysisConfigDTO,
    MLEngineConfigPayload, MLEngineResult, DEFAULT_CONFIG, BUILT_IN_PRESETS,
    ValidationResult
} from './analysis.types';
import { validateAnalysisConfig } from './analysis.validation';

export class AnalysisConfigService {

    // ─── CRUD ────────────────────────────────────────────────────

    /**
     * Create a new analysis configuration for the given user.
     */
    async create(userId: string, dto: CreateAnalysisConfigDTO): Promise<{ config: any; validation: ValidationResult }> {
        const fullConfig: Partial<AnalysisConfig> = {
            ...DEFAULT_CONFIG,
            ...dto.config,
            name: dto.name,
            description: dto.description,
            mode: dto.mode,
            isPreset: dto.isPreset ?? false,
        };

        const validation = validateAnalysisConfig(fullConfig);
        if (!validation.valid) {
            return { config: null as any, validation };
        }

        const saved = await prisma.analysisConfiguration.create({
            data: {
                name: dto.name,
                description: dto.description || null,
                mode: dto.mode,
                isPreset: dto.isPreset ?? false,
                isBuiltIn: false,
                config: fullConfig as any,
                ownerId: userId,
            }
        });

        return { config: saved, validation };
    }

    /**
     * Update an existing configuration.
     */
    async update(configId: string, userId: string, dto: UpdateAnalysisConfigDTO): Promise<{ config: any; validation: ValidationResult }> {
        const existing = await prisma.analysisConfiguration.findUnique({ where: { id: configId } });
        if (!existing || existing.ownerId !== userId) throw new Error('Configuration not found');
        if (existing.isBuiltIn) throw new Error('Built-in presets cannot be modified');

        const mergedConfig: any = { ...(existing.config as object), ...dto.config };
        if (dto.name) mergedConfig.name = dto.name;
        if (dto.description !== undefined) mergedConfig.description = dto.description;

        const validation = validateAnalysisConfig(mergedConfig);
        if (!validation.valid) {
            return { config: existing, validation };
        }

        const saved = await prisma.analysisConfiguration.update({
            where: { id: existing.id },
            data: {
                name: dto.name ?? existing.name,
                description: dto.description !== undefined ? (dto.description || null) : existing.description,
                config: mergedConfig,
            }
        });

        return { config: saved, validation };
    }

    /**
     * Delete a user-owned configuration.
     */
    async delete(configId: string, userId: string): Promise<void> {
        const existing = await prisma.analysisConfiguration.findUnique({ where: { id: configId } });
        if (!existing || existing.ownerId !== userId) throw new Error('Configuration not found');
        if (existing.isBuiltIn) throw new Error('Built-in presets cannot be deleted');

        await prisma.analysisConfiguration.delete({ where: { id: existing.id } });
    }

    /**
     * Save an existing configuration as a reusable preset.
     */
    async saveAsPreset(configId: string, userId: string, presetName: string): Promise<any> {
        const source = await prisma.analysisConfiguration.findUnique({ where: { id: configId } });
        if (!source || source.ownerId !== userId) throw new Error('Source configuration not found');

        const preset = await prisma.analysisConfiguration.create({
            data: {
                name: presetName || `${source.name} (Preset)`,
                description: source.description,
                mode: source.mode,
                isPreset: true,
                isBuiltIn: false,
                config: { ...(source.config as object), name: presetName || source.name, isPreset: true },
                ownerId: userId,
            }
        });

        return preset;
    }

    // ─── Queries ─────────────────────────────────────────────────

    /**
     * Return all configs for the user + built-in presets.
     */
    async findAllForUser(userId: string): Promise<any[]> {
        const [userConfigs, builtIns] = await Promise.all([
            prisma.analysisConfiguration.findMany({ where: { ownerId: userId }, orderBy: { updatedAt: 'desc' } }),
            prisma.analysisConfiguration.findMany({ where: { isBuiltIn: true }, orderBy: { name: 'asc' } }),
        ]);
        return [...builtIns, ...userConfigs];
    }

    /**
     * Return only presets (built-in + user-defined).
     */
    async findPresets(userId: string): Promise<any[]> {
        const [builtIns, userPresets] = await Promise.all([
            prisma.analysisConfiguration.findMany({ where: { isBuiltIn: true }, orderBy: { name: 'asc' } }),
            prisma.analysisConfiguration.findMany({ where: { ownerId: userId, isPreset: true }, orderBy: { updatedAt: 'desc' } }),
        ]);
        return [...builtIns, ...userPresets];
    }

    /**
     * Get a single config by id, scoped to the user or built-in.
     */
    async findById(configId: string, userId: string): Promise<any | null> {
        return prisma.analysisConfiguration.findFirst({
            where: {
                id: configId,
                OR: [
                    { ownerId: userId },
                    { isBuiltIn: true }
                ]
            },
        });
    }

    // ─── ML Engine Integration ───────────────────────────────────

    /**
     * Build the payload for the ML engine and call it.
     * For now this returns a simulated result until a real ML service is connected.
     */
    async applyToDataset(configId: string, datasetId: string, userId: string): Promise<MLEngineResult> {
        const config = await this.findById(configId, userId);
        if (!config) throw new Error('Configuration not found');

        const payload: MLEngineConfigPayload = {
            configId: config.id,
            datasetId,
            config: config.config as AnalysisConfig,
        };

        // TODO: Replace with actual HTTP call to Python ML engine
        // e.g. const result = await axios.post(`${ML_ENGINE_URL}/analyze`, payload);
        return this.simulateMLEngine(payload);
    }

    // ─── Seed Built-in Presets ───────────────────────────────────

    /**
     * Ensures the 3 built-in presets exist in the database.
     * Safe to call multiple times (idempotent).
     */
    async seedBuiltInPresets(): Promise<void> {
        for (const preset of BUILT_IN_PRESETS) {
            const exists = await prisma.analysisConfiguration.findFirst({ where: { name: preset.name, isBuiltIn: true } });
            if (!exists) {
                await prisma.analysisConfiguration.create({
                    data: {
                        name: preset.name,
                        description: preset.description,
                        mode: 'advanced',
                        isPreset: true,
                        isBuiltIn: true,
                        config: { ...preset.config, name: preset.name, description: preset.description, mode: 'advanced', isPreset: true } as any,
                        ownerId: null,
                    }
                });
            }
        }
    }

    // ─── Private ─────────────────────────────────────────────────

    private simulateMLEngine(payload: MLEngineConfigPayload): MLEngineResult {
        const cfg = payload.config;
        const start = Date.now();

        const insights: Record<string, any>[] = [
            { type: 'summary', title: 'Dataset Overview', detail: 'Analysis completed with configured parameters.' },
        ];

        if (cfg.outlierDetection) {
            insights.push({
                type: 'outlier',
                title: 'Outlier Report',
                detail: `Detected using ${cfg.outlierMethod} method (threshold: ${cfg.outlierThreshold}).`,
                outlierCount: Math.floor(Math.random() * 15) + 1,
            });
        }
        if (cfg.enableCorrelation) {
            insights.push({
                type: 'correlation',
                title: 'Correlation Matrix',
                detail: 'Top correlations identified across feature set.',
                topCorrelations: [
                    { pair: ['revenue', 'marketing_spend'], correlation: 0.87 },
                    { pair: ['churn_rate', 'support_tickets'], correlation: 0.72 },
                ],
            });
        }
        if (cfg.enableClustering) {
            insights.push({
                type: 'clustering',
                title: `K-Means Clustering (k=${cfg.clusterCount})`,
                detail: `${cfg.clusterCount} clusters identified with clear separation.`,
                silhouetteScore: 0.62 + Math.random() * 0.2,
            });
        }
        if (cfg.enableForecasting) {
            insights.push({
                type: 'forecast',
                title: `${cfg.forecastHorizon}-Period Forecast`,
                detail: 'Time-series forecast generated with ARIMA / ETS ensemble.',
                forecastAccuracy: 0.78 + Math.random() * 0.15,
            });
        }

        return {
            insights,
            accuracyMetrics: {
                r2Score: 0.82 + Math.random() * 0.1,
                mae: 120 + Math.random() * 50,
                rmse: 180 + Math.random() * 70,
                silhouetteScore: cfg.enableClustering ? 0.6 + Math.random() * 0.2 : undefined,
            },
            confidenceScore: [0.90, 0.95, 0.99].includes(cfg.confidenceLevel) ? cfg.confidenceLevel : 0.95,
            processingTimeMs: Date.now() - start + Math.floor(Math.random() * 800),
            warnings: cfg.samplePercentage < 30 ? ['Low sample percentage may affect reliability.'] : [],
        };
    }
}

export const analysisConfigService = new AnalysisConfigService();
