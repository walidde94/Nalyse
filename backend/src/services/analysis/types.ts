export type AdvancedColumnType = 'text' | 'number' | 'date' | 'category' | 'email' | 'currency' | 'percent' | 'id' | 'country' | 'city';

export interface AnalysisOption {
    id: string;
    title: string;
    description: string;
    chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'treemap' | 'dual-axis';
    data: any[];
}

export interface Insight {
    id: string;
    type: 'pattern' | 'anomaly' | 'correlation' | 'trend' | 'quality' | 'segment';
    description: string;
    confidence: number;
    isVerified: boolean;
}

export interface ColumnHealth {
    column: string;
    type: string;
    completeness: number; // 0-100
    uniqueness: number;   // 0-100
    validity: number;     // 0-100
}

export interface DataHealth {
    score: number;
    issues: string[];
    cleanedRows: number;
    columnHealth: ColumnHealth[];
}

export interface AnalysisResult {
    type: string;
    summary: {
        rows: number;
        columns: number;
        columnTypes: Record<string, AdvancedColumnType>;
        [key: string]: any;
    };
    options: AnalysisOption[];
    aiInsights: Insight[];
    keyFindings: Insight[];
    dataLimitations: string[];
    processingLog: string[];
    sampleData: any[]; // Subset for frontend
    dataHealth: DataHealth;
    executiveReasoning?: {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    };
}
