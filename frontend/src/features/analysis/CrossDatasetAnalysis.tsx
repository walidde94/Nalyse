import React, { useState } from 'react';
import { Network, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Database, Link2, Lightbulb } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './CrossDatasetAnalysis.css';

interface DatasetInfo {
    fileId: string;
    filename: string;
    rows: number;
    columns: number;
    columnTypes: Record<string, string>;
    keyColumns: string[];
}

interface Relationship {
    sourceDataset: string;
    targetDataset: string;
    potentialJoinKeys: Array<{
        sourceColumn: string;
        targetColumn: string;
        matchScore: number;
        sampleMatches: number;
    }>;
    relationshipType: string;
    confidence: number;
}

interface CrossDatasetInsight {
    title: string;
    description: string;
    type: string;
    affectedDatasets: string[];
    confidence: number;
    suggestedAction?: string;
}

interface SuggestedJoin {
    description: string;
    datasets: string[];
    joinKeys: Record<string, string>;
    expectedResultRows: number;
}

interface VisualizationSuggestion {
    title: string;
    type: string;
    datasets: string[];
    description: string;
}

interface MultiDatasetAnalysisResult {
    datasets: DatasetInfo[];
    relationships: Relationship[];
    crossDatasetInsights: CrossDatasetInsight[];
    suggestedJoins: SuggestedJoin[];
    aggregatedMetrics: {
        totalRows: number;
        totalColumns: number;
        totalDatasets: number;
        dataQualityScore: number;
    };
    visualizationSuggestions: VisualizationSuggestion[];
}

interface CrossDatasetAnalysisProps {
    fileIds: string[];
}

export const CrossDatasetAnalysis: React.FC<CrossDatasetAnalysisProps> = ({ fileIds }) => {
    const { token } = useAuth();
    const [analysis, setAnalysis] = useState<MultiDatasetAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (fileIds.length >= 2) {
            analyzeDatasets();
        }
    }, [fileIds]);

    const analyzeDatasets = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/files/analyze-multiple',
                { fileIds },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setAnalysis(response.data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="cross-dataset-analysis loading">
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Analyzing datasets and detecting relationships...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cross-dataset-analysis error">
                <AlertTriangle size={48} />
                <h2>Analysis Failed</h2>
                <p>{error}</p>
                <button onClick={analyzeDatasets} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    if (!analysis) {
        return null;
    }

    const getRelationshipColor = (type: string) => {
        switch (type) {
            case 'one-to-one': return '#10b981';
            case 'one-to-many': return '#3b82f6';
            case 'many-to-many': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getConfidenceLevel = (confidence: number) => {
        if (confidence >= 0.8) return { label: 'High', color: '#10b981' };
        if (confidence >= 0.5) return { label: 'Medium', color: '#f59e0b' };
        return { label: 'Low', color: '#ef4444' };
    };

    return (
        <div className="cross-dataset-analysis">
            {/* Header */}
            <div className="analysis-header">
                <h1>Cross-Dataset Analysis</h1>
                <p>Comprehensive analysis of {analysis.datasets.length} datasets with relationship detection and insights</p>
            </div>

            {/* Aggregated Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <Database size={24} />
                    <div className="metric-content">
                        <span className="metric-value">{analysis.aggregatedMetrics.totalDatasets}</span>
                        <span className="metric-label">Datasets</span>
                    </div>
                </div>
                <div className="metric-card">
                    <BarChart3 size={24} />
                    <div className="metric-content">
                        <span className="metric-value">{analysis.aggregatedMetrics.totalRows.toLocaleString()}</span>
                        <span className="metric-label">Total Rows</span>
                    </div>
                </div>
                <div className="metric-card">
                    <TrendingUp size={24} />
                    <div className="metric-content">
                        <span className="metric-value">{analysis.aggregatedMetrics.totalColumns}</span>
                        <span className="metric-label">Total Columns</span>
                    </div>
                </div>
                <div className="metric-card">
                    <CheckCircle2 size={24} />
                    <div className="metric-content">
                        <span className="metric-value">{analysis.aggregatedMetrics.dataQualityScore.toFixed(0)}%</span>
                        <span className="metric-label">Data Quality</span>
                    </div>
                </div>
            </div>

            {/* Datasets Overview */}
            <section className="analysis-section">
                <h2><Database size={20} /> Datasets Overview</h2>
                <div className="datasets-grid">
                    {analysis.datasets.map((dataset) => (
                        <div key={dataset.fileId} className="dataset-card">
                            <h3>{dataset.filename}</h3>
                            <div className="dataset-stats">
                                <div className="stat">
                                    <span className="stat-label">Rows:</span>
                                    <span className="stat-value">{dataset.rows.toLocaleString()}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Columns:</span>
                                    <span className="stat-value">{dataset.columns}</span>
                                </div>
                            </div>
                            {dataset.keyColumns.length > 0 && (
                                <div className="key-columns">
                                    <span className="key-label">Key Columns:</span>
                                    <div className="key-tags">
                                        {dataset.keyColumns.map(col => (
                                            <span key={col} className="key-tag">{col}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Relationships */}
            {analysis.relationships.length > 0 && (
                <section className="analysis-section">
                    <h2><Link2 size={20} /> Detected Relationships ({analysis.relationships.length})</h2>
                    <div className="relationships-list">
                        {analysis.relationships.map((rel, index) => {
                            const confidenceLevel = getConfidenceLevel(rel.confidence);
                            return (
                                <div key={index} className="relationship-card">
                                    <div className="relationship-header">
                                        <div className="relationship-datasets">
                                            <span className="dataset-name">{rel.sourceDataset}</span>
                                            <ArrowRight size={20} />
                                            <span className="dataset-name">{rel.targetDataset}</span>
                                        </div>
                                        <div className="relationship-badges">
                                            <span
                                                className="relationship-type"
                                                style={{ backgroundColor: getRelationshipColor(rel.relationshipType) }}
                                            >
                                                {rel.relationshipType}
                                            </span>
                                            <span
                                                className="confidence-badge"
                                                style={{ color: confidenceLevel.color }}
                                            >
                                                {confidenceLevel.label} Confidence
                                            </span>
                                        </div>
                                    </div>
                                    <div className="join-keys">
                                        <h4>Potential Join Keys:</h4>
                                        {rel.potentialJoinKeys.map((join, jIndex) => (
                                            <div key={jIndex} className="join-key">
                                                <code>{join.sourceColumn}</code>
                                                <span className="join-operator">=</span>
                                                <code>{join.targetColumn}</code>
                                                <span className="match-score">
                                                    {(join.matchScore * 100).toFixed(0)}% match
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Cross-Dataset Insights */}
            {analysis.crossDatasetInsights.length > 0 && (
                <section className="analysis-section">
                    <h2><Lightbulb size={20} /> Cross-Dataset Insights ({analysis.crossDatasetInsights.length})</h2>
                    <div className="insights-list">
                        {analysis.crossDatasetInsights.map((insight, index) => {
                            const confidenceLevel = getConfidenceLevel(insight.confidence);
                            return (
                                <div key={index} className="insight-card">
                                    <div className="insight-header">
                                        <h3>{insight.title}</h3>
                                        <span
                                            className="confidence-badge"
                                            style={{ color: confidenceLevel.color }}
                                        >
                                            {confidenceLevel.label}
                                        </span>
                                    </div>
                                    <p className="insight-description">{insight.description}</p>
                                    <div className="insight-datasets">
                                        <span className="datasets-label">Affected Datasets:</span>
                                        {insight.affectedDatasets.map(ds => (
                                            <span key={ds} className="dataset-tag">{ds}</span>
                                        ))}
                                    </div>
                                    {insight.suggestedAction && (
                                        <div className="suggested-action">
                                            <strong>Suggested Action:</strong> {insight.suggestedAction}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Suggested Joins */}
            {analysis.suggestedJoins.length > 0 && (
                <section className="analysis-section">
                    <h2><Network size={20} /> Suggested Joins ({analysis.suggestedJoins.length})</h2>
                    <div className="joins-list">
                        {analysis.suggestedJoins.map((join, index) => (
                            <div key={index} className="join-card">
                                <p className="join-description">{join.description}</p>
                                <div className="join-details">
                                    <div className="join-info">
                                        <span className="info-label">Expected Rows:</span>
                                        <span className="info-value">{join.expectedResultRows.toLocaleString()}</span>
                                    </div>
                                    <div className="join-keys-display">
                                        {Object.entries(join.joinKeys).map(([dataset, key]) => (
                                            <div key={dataset} className="join-key-item">
                                                <span className="dataset-name">{dataset}</span>
                                                <code>{key}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Visualization Suggestions */}
            {analysis.visualizationSuggestions.length > 0 && (
                <section className="analysis-section">
                    <h2><BarChart3 size={20} /> Visualization Suggestions</h2>
                    <div className="viz-suggestions">
                        {analysis.visualizationSuggestions.map((viz, index) => (
                            <div key={index} className="viz-card">
                                <h3>{viz.title}</h3>
                                <span className="viz-type">{viz.type}</span>
                                <p>{viz.description}</p>
                                <div className="viz-datasets">
                                    {viz.datasets.map(ds => (
                                        <span key={ds} className="dataset-tag">{ds}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
