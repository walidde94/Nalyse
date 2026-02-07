import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import { analyzeFile, analyzeRawData } from '../services/analyzer';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

interface DatasetRelationship {
    sourceDataset: string;
    targetDataset: string;
    potentialJoinKeys: Array<{
        sourceColumn: string;
        targetColumn: string;
        matchScore: number;
        sampleMatches: number;
    }>;
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'no-relationship';
    confidence: number;
}

interface CrossDatasetInsight {
    title: string;
    description: string;
    type: 'relationship' | 'aggregation' | 'trend' | 'anomaly';
    affectedDatasets: string[];
    confidence: number;
    suggestedAction?: string;
}

interface MultiDatasetAnalysis {
    datasets: Array<{
        fileId: string;
        filename: string;
        rows: number;
        columns: number;
        columnTypes: Record<string, string>;
        keyColumns: string[];
    }>;
    relationships: DatasetRelationship[];
    crossDatasetInsights: CrossDatasetInsight[];
    suggestedJoins: Array<{
        description: string;
        datasets: string[];
        joinKeys: Record<string, string>;
        expectedResultRows: number;
    }>;
    aggregatedMetrics: {
        totalRows: number;
        totalColumns: number;
        totalDatasets: number;
        dataQualityScore: number;
    };
    visualizationSuggestions: Array<{
        title: string;
        type: string;
        datasets: string[];
        description: string;
    }>;
}

/**
 * Detect potential join keys between two datasets
 */
function detectJoinKeys(
    sourceData: any[],
    targetData: any[],
    sourceColumns: string[],
    targetColumns: string[]
): Array<{ sourceColumn: string; targetColumn: string; matchScore: number; sampleMatches: number }> {
    const potentialJoins: Array<{
        sourceColumn: string;
        targetColumn: string;
        matchScore: number;
        sampleMatches: number;
    }> = [];

    for (const sourceCol of sourceColumns) {
        for (const targetCol of targetColumns) {
            // Check if column names are similar
            const nameSimilarity = calculateNameSimilarity(sourceCol, targetCol);

            if (nameSimilarity > 0.6 || sourceCol.toLowerCase().includes('id') || targetCol.toLowerCase().includes('id')) {
                // Check value overlap
                const sourceValues = new Set(sourceData.slice(0, 100).map(r => String(r[sourceCol]).trim()));
                const targetValues = new Set(targetData.slice(0, 100).map(r => String(r[targetCol]).trim()));

                let matches = 0;
                for (const val of sourceValues) {
                    if (targetValues.has(val)) matches++;
                }

                const matchScore = matches / Math.min(sourceValues.size, targetValues.size);

                if (matchScore > 0.1) {
                    potentialJoins.push({
                        sourceColumn: sourceCol,
                        targetColumn: targetCol,
                        matchScore: matchScore * nameSimilarity,
                        sampleMatches: matches
                    });
                }
            }
        }
    }

    return potentialJoins.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

/**
 * Calculate name similarity between two column names
 */
function calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().replace(/[_-]/g, '');
    const n2 = name2.toLowerCase().replace(/[_-]/g, '');

    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;

    // Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= n1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= n2.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= n1.length; i++) {
        for (let j = 1; j <= n2.length; j++) {
            if (n1[i - 1] === n2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[n1.length][n2.length];
    return 1 - distance / Math.max(n1.length, n2.length);
}

/**
 * Determine relationship type based on join keys
 */
function determineRelationshipType(
    sourceData: any[],
    targetData: any[],
    sourceKey: string,
    targetKey: string
): 'one-to-one' | 'one-to-many' | 'many-to-many' | 'no-relationship' {
    const sourceUnique = new Set(sourceData.map(r => r[sourceKey])).size;
    const targetUnique = new Set(targetData.map(r => r[targetKey])).size;

    const sourceRatio = sourceUnique / sourceData.length;
    const targetRatio = targetUnique / targetData.length;

    if (sourceRatio > 0.95 && targetRatio > 0.95) return 'one-to-one';
    if (sourceRatio > 0.95 && targetRatio < 0.95) return 'one-to-many';
    if (sourceRatio < 0.95 && targetRatio > 0.95) return 'one-to-many';
    return 'many-to-many';
}

/**
 * Generate cross-dataset insights
 */
function generateCrossDatasetInsights(
    datasets: Array<{ filename: string; data: any[]; columns: string[] }>,
    relationships: DatasetRelationship[]
): CrossDatasetInsight[] {
    const insights: CrossDatasetInsight[] = [];

    // Insight 1: Identify master-detail relationships
    for (const rel of relationships) {
        if (rel.relationshipType === 'one-to-many' && rel.confidence > 0.7) {
            insights.push({
                title: `Master-Detail Relationship Detected`,
                description: `${rel.sourceDataset} appears to be a master table with ${rel.targetDataset} as details. This suggests a parent-child relationship.`,
                type: 'relationship',
                affectedDatasets: [rel.sourceDataset, rel.targetDataset],
                confidence: rel.confidence,
                suggestedAction: `Consider joining these datasets for comprehensive analysis`
            });
        }
    }

    // Insight 2: Identify potential fact-dimension relationships
    const potentialFactTables = datasets.filter(d => d.data.length > 100 && d.columns.length > 5);
    const potentialDimensions = datasets.filter(d => d.data.length < 100 && d.columns.length < 10);

    if (potentialFactTables.length > 0 && potentialDimensions.length > 0) {
        insights.push({
            title: `Star Schema Pattern Detected`,
            description: `Found ${potentialFactTables.length} potential fact table(s) and ${potentialDimensions.length} dimension table(s). This suggests a data warehouse structure.`,
            type: 'relationship',
            affectedDatasets: [...potentialFactTables.map(d => d.filename), ...potentialDimensions.map(d => d.filename)],
            confidence: 0.75,
            suggestedAction: `Build a star schema for OLAP analysis`
        });
    }

    // Insight 3: Identify common columns across datasets
    const columnFrequency: Record<string, string[]> = {};
    for (const dataset of datasets) {
        for (const col of dataset.columns) {
            const normalizedCol = col.toLowerCase().replace(/[_-]/g, '');
            if (!columnFrequency[normalizedCol]) columnFrequency[normalizedCol] = [];
            columnFrequency[normalizedCol].push(dataset.filename);
        }
    }

    const commonColumns = Object.entries(columnFrequency).filter(([_, files]) => files.length > 1);
    if (commonColumns.length > 0) {
        insights.push({
            title: `Common Columns Across Datasets`,
            description: `Found ${commonColumns.length} column(s) that appear in multiple datasets, suggesting potential join opportunities.`,
            type: 'relationship',
            affectedDatasets: datasets.map(d => d.filename),
            confidence: 0.8,
            suggestedAction: `Review common columns for data consistency`
        });
    }

    return insights;
}

/**
 * Multi-file upload and analysis endpoint
 */
export const uploadMultipleFilesHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!organizationId) return res.status(400).json({ error: 'Organization required' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const fileRepo = AppDataSource.getRepository(File);
    const uploadedFiles: File[] = [];

    try {
        // Upload all files
        for (const file of files) {
            const newFile = fileRepo.create({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                s3Key: file.path,
                ownerId: userId,
                organizationId: organizationId,
                isFavorite: false
            });

            const savedFile = await fileRepo.save(newFile);
            uploadedFiles.push(savedFile);
        }

        res.json({
            message: `${files.length} files uploaded successfully`,
            files: uploadedFiles
        });

    } catch (error: any) {
        console.error('Multi-file upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
};

/**
 * Analyze multiple datasets and find relationships
 */
export const analyzeMultipleDatasetsHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { fileIds } = req.body; // Array of file IDs

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
        return res.status(400).json({ error: 'At least 2 file IDs required' });
    }

    const fileRepo = AppDataSource.getRepository(File);

    try {
        // Load all files
        const files = await fileRepo.find({
            where: fileIds.map(id => ({ id: id as string, ownerId: userId, isDeleted: false }))
        });

        if (files.length < 2) {
            return res.status(404).json({ error: 'Not enough valid files found' });
        }

        // Load and parse data from each file
        const datasets: Array<{
            fileId: string;
            filename: string;
            data: any[];
            columns: string[];
            analysis: any;
        }> = [];

        for (const file of files) {
            if (!file.s3Key || !fs.existsSync(file.s3Key)) continue;

            const rawContent = fs.readFileSync(file.s3Key);
            let records: any[] = [];

            if (file.mimeType.includes('json') || file.filename.endsWith('.json')) {
                records = JSON.parse(rawContent.toString());
            } else if (file.mimeType.includes('csv') || file.filename.endsWith('.csv')) {
                records = parse(rawContent, { columns: true, skip_empty_lines: true, relax_column_count: true });
            }

            if (records.length > 0) {
                const analysis = await analyzeFile(file.s3Key, file.mimeType);
                datasets.push({
                    fileId: file.id,
                    filename: file.originalName,
                    data: records,
                    columns: Object.keys(records[0]),
                    analysis
                });
            }
        }

        if (datasets.length < 2) {
            return res.status(400).json({ error: 'Not enough parseable datasets' });
        }

        // Detect relationships between datasets
        const relationships: DatasetRelationship[] = [];

        for (let i = 0; i < datasets.length; i++) {
            for (let j = i + 1; j < datasets.length; j++) {
                const source = datasets[i];
                const target = datasets[j];

                const joinKeys = detectJoinKeys(
                    source.data,
                    target.data,
                    source.columns,
                    target.columns
                );

                if (joinKeys.length > 0) {
                    const bestJoin = joinKeys[0];
                    const relType = determineRelationshipType(
                        source.data,
                        target.data,
                        bestJoin.sourceColumn,
                        bestJoin.targetColumn
                    );

                    relationships.push({
                        sourceDataset: source.filename,
                        targetDataset: target.filename,
                        potentialJoinKeys: joinKeys,
                        relationshipType: relType,
                        confidence: bestJoin.matchScore
                    });
                }
            }
        }

        // Generate cross-dataset insights
        const crossDatasetInsights = generateCrossDatasetInsights(datasets, relationships);

        // Generate suggested joins
        const suggestedJoins = relationships
            .filter(r => r.confidence > 0.5)
            .map(r => ({
                description: `Join ${r.sourceDataset} with ${r.targetDataset} on ${r.potentialJoinKeys[0].sourceColumn} = ${r.potentialJoinKeys[0].targetColumn}`,
                datasets: [r.sourceDataset, r.targetDataset],
                joinKeys: {
                    [r.sourceDataset]: r.potentialJoinKeys[0].sourceColumn,
                    [r.targetDataset]: r.potentialJoinKeys[0].targetColumn
                },
                expectedResultRows: Math.max(
                    datasets.find(d => d.filename === r.sourceDataset)?.data.length || 0,
                    datasets.find(d => d.filename === r.targetDataset)?.data.length || 0
                )
            }));

        // Calculate aggregated metrics
        const totalRows = datasets.reduce((sum, d) => sum + d.data.length, 0);
        const totalColumns = datasets.reduce((sum, d) => sum + d.columns.length, 0);
        const avgDataQuality = datasets.reduce((sum, d) => sum + (d.analysis.dataHealth?.score || 0), 0) / datasets.length;

        // Generate visualization suggestions
        const visualizationSuggestions = [];

        // Suggest relationship diagram
        if (relationships.length > 0) {
            visualizationSuggestions.push({
                title: 'Dataset Relationship Diagram',
                type: 'network',
                datasets: datasets.map(d => d.filename),
                description: 'Visualize how datasets connect through foreign keys'
            });
        }

        // Suggest combined metrics dashboard
        visualizationSuggestions.push({
            title: 'Combined Metrics Dashboard',
            type: 'dashboard',
            datasets: datasets.map(d => d.filename),
            description: 'Aggregate key metrics across all datasets'
        });

        const result: MultiDatasetAnalysis = {
            datasets: datasets.map(d => ({
                fileId: d.fileId,
                filename: d.filename,
                rows: d.data.length,
                columns: d.columns.length,
                columnTypes: d.analysis.summary?.columnTypes || {},
                keyColumns: d.columns.filter(c => c.toLowerCase().includes('id'))
            })),
            relationships,
            crossDatasetInsights,
            suggestedJoins,
            aggregatedMetrics: {
                totalRows,
                totalColumns,
                totalDatasets: datasets.length,
                dataQualityScore: avgDataQuality
            },
            visualizationSuggestions
        };

        res.json(result);

    } catch (error: any) {
        console.error('Multi-dataset analysis error:', error);
        res.status(500).json({ error: 'Analysis failed: ' + error.message });
    }
};
