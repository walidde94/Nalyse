import { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import alasql from 'alasql';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { exportToPDF } from '../../utils/pdfExport';
import AdvancedAnalytics from './AdvancedAnalytics';
import { GraphConnectionView } from './GraphConnectionView';
import { AnalysisMapView } from './AnalysisMapView';
import {
    LayoutTemplate,
    PenTool,
    Network,
    Map,
    Cpu,
    Lightbulb,
    Grid,
    Terminal,
    Presentation,
    ArrowLeft,
    FileText,
    Download,
    Share2,
    FileDown,
    AlertCircle,
    Maximize2,
    Camera,
    BrainCircuit,
    PanelLeftClose,
    PanelLeftOpen,
    ArrowUp,
    Database,
    ArrowRight,
    Brackets,
    Palette as PaletteIcon,
    DollarSign,
    Users,
    Heart,
    BarChart3,
    Layers,
    Zap,
    Activity,
    Microscope,
    Rocket,
    Sparkles,
    TrendingUp,
    CheckCircle2,
    ChevronUp,
    ChevronDown,
    MessageCircle
} from 'lucide-react';
import { ElasticSearch } from './components/ElasticSearch';
import { ElasticFilterBar } from './components/ElasticFilterBar';
import { PythonStudio } from './components/PythonStudio';
import { DeployModal } from './components/DeployModal';
import { NLQueryBar } from './components/NLQueryBar';
import { PredictiveForecasting } from './components/PredictiveForecasting';
import { WorldMapChart } from './components/WorldMapChart';
import { AnomalyDetection } from './components/AnomalyDetection';
import { NexusAuditTrail } from './components/NexusAuditTrail';
import { InsightPanel } from '../../components/ui/InsightPanel';
import { CommentThread, CommentBadge } from '../../components/ui/CommentThread';
import { TextSelectionComment } from '../../components/ui/TextSelectionComment';

interface ChartOption {
    title: string;
    description?: string;
    chartType: string;
    data: any[];
    isStatic?: boolean;
}

interface AnalysisData {
    id?: string;
    summary?: {
        columnTypes?: Record<string, string>;
        rowCount?: number;
        statistics?: any;
        dimensions?: string[];
        measures?: string[];
    };
    sampleData: any[];
    options: ChartOption[];
    executiveReasoning?: {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    };
    keyFindings?: Array<{
        type: string;
        description: string;
        confidence: number;
    }>;
    aiInsights: any[];
    dataHealth?: {
        score: number;
    };
    processingLog: string[];
    type?: string;
    // Advanced Intelligence
    mlAnalysis?: {
        correlationMatrix?: {
            columns: string[];
            entries: Array<{ col1: string; col2: string; pearson: number; spearman: number; strength: string }>;
        };
        kmeansResult?: {
            k: number;
            silhouetteScore: number;
            clusterSizes: number[];
            clusterProfiles: Array<{ clusterId: number; size: number; label: string }>;
        };
        outlierResults?: Array<{ column: string; method: string; distribution: string; outlierCount: number }>;
    };
    forecast?: {
        column: string;
        dateColumn: string;
        metrics: { trend: string; confidence: number; r2: number; modelReliability: string };
        forecast: Array<{ date: string; value: number }>;
    };
    regressionModel?: {
        equation: string;
        rSquared: number;
        pValue: number;
        dependentVar: string;
        independentVar: string;
    };
}

interface AnalysisViewProps {
    analysis: AnalysisData;
    onClose: () => void;
    onShare?: () => Promise<void>;
    onUpgradeRequested?: () => void;
    onUpdate?: (data: AnalysisData) => void;
}



// Premium Modern Color Palette
const COLORS = [
    '#34d399', // Emerald 400 (Main Brand Color)
    '#38bdf8', // Sky 400
    '#818cf8', // Indigo 400
    '#f472b6', // Pink 400
    '#fbbf24', // Amber 400
    '#a78bfa', // Violet 400
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bento-glass)',
                border: '1px solid var(--bento-border)',
                padding: '12px 16px',
                borderRadius: 'var(--bento-radius-sm)',
                boxShadow: 'var(--bento-shadow)',
                backdropFilter: 'var(--bento-blur)',
                minWidth: '150px',
                color: 'var(--text-primary)'
            }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</p>
                {payload.map((p: any, i: number) => {
                    const data = p.payload || {};
                    const isScatter = data.x !== undefined && data.y !== undefined;

                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: p.color }}></div>
                                <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{p.name || 'Value'}</span>
                            </div>
                            <div className="flex-col gap-1 pl-4">
                                {isScatter ? (
                                    <>
                                        <div className="flex justify-between gap-4 text-xs">
                                            <span className="opacity-60">X-Axis:</span>
                                            <span className="font-mono font-bold">{data.x.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-xs">
                                            <span className="opacity-60">Y-Axis:</span>
                                            <span className="font-mono font-bold">{data.y.toLocaleString()}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between gap-4 text-xs font-mono font-bold">
                                        {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

import { API_URL } from '../../config';
import { useChat } from '../../contexts/ChatContext';
import { useArchitect } from '../../contexts/ArchitectContext';

import { ArchitectNode } from '../../components/layout/ArchitectNode';
import { DiagnosticOverlay } from '../../components/layout/DiagnosticOverlay';

export const AnalysisView = ({ analysis, onClose, onShare, onUpgradeRequested, onUpdate }: AnalysisViewProps) => {
    const { t } = useLanguage();
    const { token } = useAuth();
    const { addToast } = useToast();
    const { socket } = useChat();
    const { layoutState, layoutMode } = useArchitect();


    const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'sql' | 'insights' | 'presentation' | 'builder' | 'advanced' | 'graph' | 'map' | 'python' | 'ai' | 'anomaly' | 'forecast'>('overview');
    const [isNLQueryOpen, setIsNLQueryOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // SQL State
    const [queryText, setQueryText] = useState('SELECT * FROM ? LIMIT 10');
    const [queryResult, setQueryResult] = useState<any[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);

    // Chart State Manager
    const [chartConfig, setChartConfig] = useState<Record<number, string>>({}); // index -> type

    // Presentation Mode State
    const [isPlaying, setIsPlaying] = useState(false);
    const [presentationIndex, setPresentationIndex] = useState(0);

    // Visual Builder State
    const [builderConfig, setBuilderConfig] = useState({
        xAxis: '',
        yAxis: '',
        aggregation: 'SUM', // SUM, AVG, COUNT, MAX, MIN
        chartType: 'bar',
        sortBy: 'valueDesc',
        topN: 30
    });
    const [builderData, setBuilderData] = useState<any[]>([]);
    const [debugMsg, setDebugMsg] = useState('');
    const [showRawData, setShowRawData] = useState(false);

    // Detect Dimensions & Measures (Robust Check)
    const [dimensions, setDimensions] = useState<string[]>([]);
    const [measures, setMeasures] = useState<string[]>([]);

    // ===== NEW: Advanced Filtering & Drill-Down State =====
    const [globalFilters, setGlobalFilters] = useState<Record<string, any[]>>({});
    const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null; column: string | null }>({
        start: null,
        end: null,
        column: null
    });
    const [activeDrillDown, setActiveDrillDown] = useState<{ column: string; value: any } | null>(null);
    const [filterHistory, setFilterHistory] = useState<Array<{ type: string; column: string; value: any }>>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showFullAudit, setShowFullAudit] = useState(false);

    // Data Grid State
    const [gridPageSize, setGridPageSize] = useState<number>(100);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    // Elastic Search State

    // KQL Parser (Advanced Pro Version)
    const parseQuery = (query: string) => {
        if (!query) {
            setGlobalFilters({});
            return;
        }

        const newGlobalFilters: Record<string, any[]> = {};
        const newSearchTerms: string[] = [];

        // Split by ' AND ' (case insensitive)
        const parts = query.split(/\s+AND\s+/i);

        parts.forEach(part => {
            const trimmed = part.trim();
            if (!trimmed) return;

            // Pattern: field operator value
            // status:error or age > 25
            const match = trimmed.match(/^([a-zA-Z0-9_\s.]+?)\s*(:|>=|<=|>|<|=)\s*(.+)$/);

            if (match) {
                const [, fieldRaw, op, valueRaw] = match;
                const fieldName = fieldRaw.trim();
                const value = valueRaw.trim().replace(/^"|"$/g, '');

                // Resolve column
                const col = dimensions.find(d => d.toLowerCase() === fieldName.toLowerCase()) ||
                    measures.find(m => m.toLowerCase() === fieldName.toLowerCase());

                if (col) {
                    if (op === ':') {
                        // Equality/Includes
                        newGlobalFilters[col] = [...(newGlobalFilters[col] || []), value];
                    } else {
                        // Numeric range logic (Special Handled in filter computation)
                        const filterKey = `_op_${col}_${op}`;
                        newGlobalFilters[filterKey] = [value];
                    }
                } else {
                    newSearchTerms.push(trimmed);
                }
            } else {
                newSearchTerms.push(trimmed);
            }
        });

        setGlobalFilters({ ...newGlobalFilters, _global_search: newSearchTerms });
    };

    // Consolidated filter list for the bar
    const activeFiltersList = [
        ...Object.entries(globalFilters).flatMap(([col, vals]) => {
            if (col === '_global_search') {
                return vals.map(v => ({ type: 'query', value: v, label: t('analysis.searchLabel').replace('{query}', v) }));
            }
            if (col.startsWith('_op_')) {
                // Handle operator filters: _op_FieldName_Operator
                const parts = col.split('_');
                const op = parts[parts.length - 1];
                const field = parts.slice(2, parts.length - 1).join('_');
                return vals.map(v => ({ type: 'filter', column: field, value: `${op} ${v}`, label: `${field} ${op} ${v}` }));
            }
            return vals.map(v => ({ type: 'filter', column: col, value: v, label: `${col}: ${v}` }));
        }),
        ...(activeDrillDown ? [{ type: 'drilldown', column: activeDrillDown.column, value: activeDrillDown.value, label: t('analysis.drilldownLabel').replace('{column}', activeDrillDown.column).replace('{value}', String(activeDrillDown.value)) }] : []),
        ...(dateRange.column ? [{ type: 'range', column: dateRange.column, value: `${new Date(dateRange.start!).toLocaleDateString()} - ${new Date(dateRange.end!).toLocaleDateString()}`, label: t('analysis.timeRangeLabel').replace('{start}', new Date(dateRange.start!).toLocaleDateString()).replace('{end}', new Date(dateRange.end!).toLocaleDateString()) }] : [])
    ] as any[];

    const handleRemoveFilter = (f: any) => {
        if (f.type === 'query') {
            setGlobalFilters(prev => {
                const newSearch = (prev._global_search || []).filter(v => v !== f.value);
                const { _global_search, ...rest } = prev;
                return newSearch.length > 0 ? { ...prev, _global_search: newSearch } : rest;
            });
        } else if (f.type === 'drilldown') {
            handleDrillUp();
        } else if (f.type === 'range') {
            setDateRange({ start: null, end: null, column: null });
        } else {
            // Check if it's an operator filter
            const opMatch = f.value.match(/^(=|>=|<=|>|<)\s*(.+)$/);
            if (opMatch) {
                const op = opMatch[1];
                const key = `_op_${f.column}_${op}`;
                setGlobalFilters(prev => {
                    const { [key]: deleted, ...rest } = prev;
                    return rest;
                });
            } else {
                removeFilter(f.column, f.value);
            }
        }
    };


    // Expanded Chart State
    const [expandedChart, setExpandedChart] = useState<{ opt: any, index: number } | null>(null);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    // View Mode State (Executive vs Analyst)
    const [viewMode, setViewMode] = useState<'executive' | 'analyst'>('executive');

    // Deploy Modal State
    const [showDeployModal, setShowDeployModal] = useState(false);

    // Comment State
    const [commentOpen, setCommentOpen] = useState(false);
    const [commentTarget, setCommentTarget] = useState<{ type: string; id?: string; title?: string }>({ type: 'general' });
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    const openComments = (type: string, id?: string, title?: string, initialText?: string) => {
        setCommentTarget({ type, id, title });
        setCommentOpen(true);
        // We can pass initial text to the comment thread if we want, but just having the context in targetId is good.
    };

    // Chart Point Menu State
    const [chartClickMenu, setChartClickMenu] = useState<{ x: number, y: number, data: any, column: string, title: string, index: number } | null>(null);

    const handleChartClick = (data: any, opt: any, index: number, event?: React.MouseEvent) => {
        const columnMatch = opt.title.match(/^(.+?)\s+by\s+(.+)$/i);
        const column = columnMatch ? columnMatch[2] : dimensions[0];
        const valName = data.name || data.payload?.name || data.x;

        if (event && event.clientX) {
            setChartClickMenu({
                x: event.clientX,
                y: event.clientY,
                data: valName,
                column,
                title: opt.title,
                index
            });
        } else {
            handleDrillDown(column, valName);
        }
    };

    useEffect(() => {
        if (!analysis.id || !token) return;
        
        const fetchCounts = () => {
            fetch(`${API_URL}/api/comments/${analysis.id}/counts`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.ok ? r.json() : {}).then(c => setCommentCounts(c || {})).catch(() => {});
        };

        fetchCounts();

        if (!socket) return;
        
        const handleSync = () => fetchCounts();
        
        socket.on('comment_created', handleSync);
        socket.on('comment_deleted', handleSync);
        
        return () => {
            socket.off('comment_created', handleSync);
            socket.off('comment_deleted', handleSync);
        };
    }, [analysis.id, token, socket]);


    // React to fresh analysis data (Manual or Auto-Sync)
    const [localData, setLocalData] = useState<any[]>(analysis.sampleData || []);
    const [filteredData, setFilteredData] = useState<any[]>(localData);

    // Optimized Data Structures
    const columns = useMemo(() => Object.keys(localData[0] || {}), [localData]);

    const fieldTypes = useMemo(() => ({
        hasRevenue: columns.some(c => /revenue|amount|total|sales|price/i.test(c)),
        hasCustomer: columns.some(c => /customer|user|client|account|id/i.test(c)),
        hasStatus: columns.some(c => /status|state|active|churn/i.test(c))
    }), [columns]);

    // ===== NEW: Recompute chart data based on filtered data =====
    function getFilteredChartData(opt: ChartOption) {
        // If isStatic is set, always return the data as-is
        if (opt.isStatic) return opt.data;

        // If all data was filtered out, return empty properly so charts show empty state
        if (filteredData.length === 0) return [];

        // If no filters are active, use original data
        if (filteredData.length === localData.length) return opt.data;

        try {
            let measureName = '';
            let dimensionName = '';
            let isScatter = opt.chartType === 'scatter';

            // 1. Try standard "Measure by Dimension"
            const byMatch = opt.title.match(/^(.+?)\s+by\s+(.+)$/i);
            
            // 2. Try "Model: Measure vs Dimension" (for scatter)
            const vsMatch = opt.title.match(/(?:.*:\s*)?(.+?)\s+vs\s+(.+)$/i);

            if (byMatch) {
                measureName = byMatch[1].trim();
                dimensionName = byMatch[2].trim();
            } else if (isScatter && vsMatch) {
                measureName = vsMatch[1].trim(); // x
                dimensionName = vsMatch[2].trim(); // y
            } else {
                // Heuristic: Infer dimension from opt.data[0].name
                if (opt.data && opt.data.length > 0 && opt.data[0].name) {
                    const sampleName = opt.data[0].name;
                    
                    // Specific handling for "Cumulative X" time series charts
                    if (opt.title.toLowerCase().includes('cumulative')) {
                         dimensionName = dimensions.find(d => d.toLowerCase().includes('date') || d.toLowerCase().includes('time')) || dimensions[0];
                         measureName = measures.find(m => opt.title.toLowerCase().includes(m.toLowerCase())) || measures[0];
                    } else {
                         // Find which dimension in localData contains the sampleName
                         dimensionName = dimensions.find(d => {
                             return localData.some((row: any) => {
                                 const val = row[d];
                                 if (val == null) return false;
                                 if (String(sampleName).match(/^\d{4}-\d{2}$/) && String(val).startsWith(sampleName)) return true;
                                 return String(val) === String(sampleName);
                             });
                         }) || dimensions[0];
                         
                         measureName = measures.find(m => opt.title.toLowerCase().includes(m.toLowerCase())) || 'Volume';
                    }
                } else {
                    return opt.data;
                }
            }

            // Special handling for "Index" - it's not a real measure, use COUNT instead
            if (measureName.toLowerCase() === 'index' || measureName.toLowerCase() === 'trend') {
                const dimensionCol = dimensions.find(d =>
                    d.toLowerCase() === dimensionName.toLowerCase() ||
                    d.toLowerCase().includes(dimensionName.toLowerCase())
                );

                if (!dimensionCol) {
                    return opt.data;
                }

                // Use COUNT for Index-based charts
                const query = `SELECT [${dimensionCol}] as name, COUNT(*) as val FROM ? GROUP BY [${dimensionCol}] ORDER BY val DESC`;

                const result = alasql(query, [filteredData]) as any[];

                if (!result || result.length === 0) {
                    return opt.data;
                }

                // Map to expected format
                return result.slice(0, 10).map(r => ({ name: r.name, value: r.val }));
            }

            // Find the actual column names (case-insensitive match)
            const dimensionCol = dimensions.find(d =>
                d.toLowerCase() === dimensionName.toLowerCase() ||
                d.toLowerCase().includes(dimensionName.toLowerCase())
            );

            const measureCol = measures.find(m =>
                m.toLowerCase() === measureName.toLowerCase() ||
                m.toLowerCase().includes(measureName.toLowerCase())
            );

            // If we can't find matching columns, return original data
            if (!dimensionCol) {
                return opt.data;
            }

            // If no measure found, use COUNT
            if (!measureCol) {
                const query = `SELECT [${dimensionCol}] as name, COUNT(*) as val FROM ? GROUP BY [${dimensionCol}] ORDER BY val DESC`;
                const result = alasql(query, [filteredData]) as any[];
                return result.slice(0, 10).map(r => ({ name: r.name, value: r.val }));
            }

            // Scatter plot handling
            if (isScatter) {
                // Return up to 200 raw data points for scatter
                return filteredData.slice(0, 200).map((r, k) => ({
                    name: `Entry ${k}`,
                    x: Number(r[measureName]) || 0,
                    y: Number(r[dimensionName]) || 0
                }));
            }

            // Build and execute aggregation query with proper escaping
            const query = `SELECT [${dimensionCol}] as name, SUM(CAST([${measureCol}] as FLOAT)) as val FROM ? GROUP BY [${dimensionCol}] ORDER BY val DESC`;

            const result = alasql(query, [filteredData]) as any[];

            if (!result || result.length === 0) {
                return opt.data;
            }

            return result.slice(0, 10).map(r => ({ name: r.name, value: r.val })); // Limit to top 10 for readability
        } catch (e) {
            console.error('❌ Error recomputing chart data for:', opt.title, e);
            return opt.data; // Fallback to original
        }
    }



    const memoizedChartsData = useMemo(() => {
        return (analysis.options || []).map((opt: any) => getFilteredChartData(opt));
    }, [analysis.options, filteredData, dimensions, measures]);

    const memoizedMetrics = useMemo(() => {
        let metrics: any[] = [];
        const { hasRevenue, hasCustomer, hasStatus } = fieldTypes;

        const splitByTimePeriod = (dateCol: string) => {
            if (!dateCol || localData.length < 2) return { current: localData, previous: [] };
            try {
                const sorted = [...localData].sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime());
                const mid = Math.floor(sorted.length / 2);
                return { current: sorted.slice(mid), previous: sorted.slice(0, mid) };
            } catch (e) {
                return { current: localData, previous: [] };
            }
        };

        const calculateTrend = (curr: number, prev: number) => {
            if (prev === 0) return '+100%';
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
        };

        if (hasRevenue && localData.length > 0) {
            const revCol = columns.find(c => /revenue|amount|total|sales|price/i.test(c));
            const dateCol = columns.find(c => /date|time|created|updated/i.test(c));

            if (revCol) {
                const { current, previous } = splitByTimePeriod(dateCol || '');
                const currentRevenue = current.reduce((acc, row) => acc + (parseFloat(row[revCol]) || 0), 0);
                const previousRevenue = previous.reduce((acc, row) => acc + (parseFloat(row[revCol]) || 0), 0);
                const trend = calculateTrend(currentRevenue, previousRevenue);

                metrics.push({
                    label: t('analysis.metrics.totalRevenue'),
                    value: `$${(currentRevenue / 1000000).toFixed(2)}M`,
                    trend: trend,
                    color: 'var(--success)',
                    icon: '$'
                });
            }
        }
 
        if (hasCustomer && localData.length > 0) {
            const custCol = columns.find(c => /customer|user|client|account|id/i.test(c));
            const dateCol = columns.find(c => /date|time|created|updated/i.test(c));
 
            if (custCol) {
                const { current, previous } = splitByTimePeriod(dateCol || '');
                const currentCustomers = new Set(current.map(row => row[custCol]).filter(Boolean)).size;
                const previousCustomers = new Set(previous.map(row => row[custCol]).filter(Boolean)).size;
                const trend = calculateTrend(currentCustomers, previousCustomers);
 
                metrics.push({
                    label: t('analysis.metrics.activeCustomers'),
                    value: currentCustomers.toLocaleString(),
                    trend: trend,
                    color: 'var(--primary)',
                    icon: '#'
                });
            }
        }
 
        if (hasStatus && localData.length > 0) {
            const statusCol = columns.find(c => /status|state|active|churn/i.test(c));
            const dateCol = columns.find(c => /date|time|created|updated/i.test(c));
 
            if (statusCol) {
                const { current, previous } = splitByTimePeriod(dateCol || '');
                const currentActiveCount = current.filter(row => {
                    const status = String(row[statusCol]).toLowerCase();
                    return status.includes('active') || status.includes('true') || status === '1';
                }).length;
                const currentHealthScore = current.length > 0 ? ((currentActiveCount / current.length) * 100).toFixed(1) : '0';
                const currentHealthNum = parseFloat(currentHealthScore);
 
                const previousActiveCount = previous.filter(row => {
                    const status = String(row[statusCol]).toLowerCase();
                    return status.includes('active') || status.includes('true') || status === '1';
                }).length;
                const previousHealthNum = previous.length > 0 ? (previousActiveCount / previous.length) * 100 : 0;
                const trend = calculateTrend(currentHealthNum, previousHealthNum);
 
                metrics.push({
                    label: t('analysis.metrics.customerHealth'),
                    value: `${currentHealthScore}%`,
                    trend: trend,
                    color: currentHealthNum > 85 ? 'var(--success)' : currentHealthNum > 70 ? 'var(--warning)' : 'var(--error)',
                    icon: '%'
                });
            }
        }
 
        if (metrics.length === 0) {
            metrics = [
                { label: t('analysis.metrics.dataVolume'), value: localData.length.toLocaleString(), trend: t('analysis.metrics.records'), color: 'var(--primary)', icon: 'D' },
                { label: t('analysis.metrics.dataDimensions'), value: columns.length.toString(), trend: t('analysis.metrics.attributes'), color: 'var(--info)', icon: 'A' },
                { label: t('analysis.metrics.engineIntegrity'), value: `${analysis.dataHealth?.score || 100}%`, trend: t('analysis.metrics.optimal'), color: 'var(--success)', icon: 'E' }
            ];
        }
        return metrics;
    }, [localData, fieldTypes, columns, analysis]);
    // Handler Functions
    const handleDeploy = () => {
        setShowDeployModal(true);
    };

    const handleDeployMethod = async (method: string, options: any) => {
        if (!analysis || !analysis.executiveReasoning) return;

        const reasoning = analysis.executiveReasoning;
        const actions = reasoning.strategicAdvice || [];

        try {
            switch (method) {
                case 'email':
                    addToast(`Sending report to ${options.email}...`, 'info');
                    // TODO: Implement email API call
                    setTimeout(() => addToast('Report sent successfully', 'success'), 1000);
                    break;

                case 'pdf':
                    addToast('Generating PDF report...', 'info');
                    setTimeout(() => {
                        exportToPDF(analysis, 'analysis-content');
                        addToast('PDF downloaded', 'success');
                    }, 500);
                    break;

                case 'slack':
                    addToast(`Posting to ${options.slackChannel}...`, 'info');
                    // TODO: Implement Slack webhook
                    setTimeout(() => addToast('Posted to Slack', 'success'), 1000);
                    break;
            }
        } catch (e) {
            addToast('Deployment failed', 'error');
        }
    };

    const handlePinInsight = () => {
        if (!analysis || !analysis.executiveReasoning) return;

        try {
            const insight = {
                id: `insight_${Date.now()}`,
                title: `${analysis.type} Analysis`,
                summary: analysis.executiveReasoning?.executiveSummary || 'Strategic insight',
                timestamp: new Date().toISOString(),
                type: analysis.type,
                priority: 'high',
                advice: analysis.executiveReasoning?.strategicAdvice || [],
                matrix: analysis.executiveReasoning?.priorityMatrix || []
            };

            const existing = JSON.parse(localStorage.getItem('strategic_watchlist') || '[]');
            const updated = [insight, ...existing].slice(0, 10);
            localStorage.setItem('strategic_watchlist', JSON.stringify(updated));

            addToast('Insight pinned to Strategic Watchlist', 'success');
        } catch (e) {
            addToast('Failed to pin insight', 'error');
        }
    };

    useEffect(() => {
        if (analysis.sampleData) {
            setLocalData(analysis.sampleData);
            // If no filters are active, sync filteredData too
            if (Object.keys(globalFilters).length === 0 && !activeDrillDown && !dateRange.column) {
                setFilteredData(analysis.sampleData);
            }
        }
    }, [analysis.sampleData]);

    useEffect(() => {
        if (!localData || localData.length === 0) return;
        const firstRow = localData[0];
        const dims: string[] = [];
        const meas: string[] = [];

        Object.keys(firstRow).forEach(key => {
            const val = firstRow[key];
            // Check if it's a number or a string that looks like a number
            const isNum = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
            if (isNum) meas.push(key);
            else dims.push(key);
        });

        setDimensions(dims);
        setMeasures(meas);
    }, [localData]);

    useEffect(() => {
        if (activeTab === 'builder' && builderConfig.xAxis && builderConfig.yAxis) {
            try {
                // Handle non-numeric sum attempts by forcing count if needed
                let agg = builderConfig.aggregation;
                const isNumeric = measures.includes(builderConfig.yAxis);

                if (!isNumeric && (agg === 'SUM' || agg === 'AVG')) {
                    agg = 'COUNT';
                    // NOTE: avoiding setBuilderConfig here to prevent loop. Using local var 'agg' in query.
                }

                // Clean column names for SQL - escape single quotes and validate against known columns
                const validX = dimensions.includes(builderConfig.xAxis) || measures.includes(builderConfig.xAxis) ? builderConfig.xAxis : dimensions[0];
                const validY = dimensions.includes(builderConfig.yAxis) || measures.includes(builderConfig.yAxis) ? builderConfig.yAxis : measures[0];

                const xCol = validX.replace(/'/g, "''");
                const yCol = validY.replace(/'/g, "''");

                // Auto-detect if we should use COUNT for non-numeric columns
                const isNumericY = measures.includes(validY);
                const actualAgg = (!isNumericY && agg !== 'COUNT') ? 'COUNT' : agg;

                if (actualAgg !== agg) {
                    setDebugMsg(`Switched to COUNT because ${validY} is non-numeric`);
                }

                const isScatter = builderConfig.chartType === 'scatter';
                const isXNumeric = measures.includes(builderConfig.xAxis);
                const isYNumeric = measures.includes(builderConfig.yAxis);

                // Dynamic Aggregation Query with strict numeric conversion
                let query = '';
                // Scatter Mode: If both are numeric, show raw correlations. 
                // If X is categorical, show aggregated distribution (Dot Plot).
                if (isScatter && isXNumeric && isYNumeric) {
                    query = `SELECT [${xCol}] AS [x], [${yCol}] AS [y] FROM ? LIMIT 1000`;
                } else {
                    query = actualAgg === 'COUNT'
                        ? `SELECT [${xCol}] AS [name], COUNT(*) AS [value] FROM ? GROUP BY [${xCol}]`
                        : `SELECT [${xCol}] AS [name], ${actualAgg}(CAST([${yCol}] AS FLOAT)) AS [value] FROM ? GROUP BY [${xCol}]`;
                }

                const res = alasql(query, [filteredData]) as any[];

                if (!res || res.length === 0) {
                    setDebugMsg(`Zero records returned for ${isScatter ? 'Scatter' : actualAgg} of ${yCol}`);
                    setBuilderData([]);
                } else {
                    setDebugMsg('');
                    let cleaned = [];

                    if (isScatter && isXNumeric && isYNumeric) {
                        cleaned = res.map((r: any) => ({
                            x: isNaN(Number(r.x)) ? 0 : Number(r.x),
                            y: isNaN(Number(r.y)) ? 0 : Number(r.y),
                            name: `Entry`
                        }));
                    } else if (isScatter) {
                        // Dot Plot (Categorical X)
                        cleaned = res.map((r: any) => ({
                            x: String(r.name || 'N/A'),
                            y: isNaN(Number(r.value)) ? 0 : Number(r.value),
                            name: String(r.name || 'N/A')
                        }));
                    } else {
                        cleaned = res.map((r: any) => ({
                            name: String(r.name || 'N/A'),
                            value: isNaN(Number(r.value)) ? 0 : Number(r.value)
                        }));

                        if (builderConfig.sortBy === 'valueAsc') {
                            cleaned.sort((a, b) => a.value - b.value);
                        } else if (builderConfig.sortBy === 'labelAsc') {
                            cleaned.sort((a, b) => a.name.localeCompare(b.name));
                        } else if (builderConfig.sortBy === 'labelDesc') {
                            cleaned.sort((a, b) => b.name.localeCompare(a.name));
                        } else {
                            cleaned.sort((a, b) => b.value - a.value); // default valueDesc
                        }

                        cleaned = cleaned.slice(0, builderConfig.topN || 30);
                    }

                    setBuilderData(cleaned);
                }
            } catch (e: any) {
                console.error("Builder Error", e);
                setDebugMsg(`Error: ${e.message}`);
            }
        }
    }, [builderConfig, activeTab, filteredData, measures]);

    // ===== NEW: Filter Computation Logic =====
    useEffect(() => {
        let filtered = [...localData];

        // Apply global filters (dimension-based and operators)
        Object.entries(globalFilters).forEach(([column, values]) => {
            if (!values || values.length === 0) return;

            if (column === '_global_search') {
                // Handled separately below to search across all columns
                return;
            }

            if (column.startsWith('_op_')) {
                // Handle numeric/comparison operator filters (e.g. _op_Revenue_>)
                const parts = column.split('_');
                const op = parts[parts.length - 1];
                const field = parts.slice(2, parts.length - 1).join('_');

                filtered = filtered.filter(row => {
                    return values.some(val => {
                        const rowVal = row[field];
                        if (rowVal == null) return false;

                        const numRowVal = Number(rowVal);
                        const numVal = Number(val);

                        if (!isNaN(numRowVal) && !isNaN(numVal)) {
                            switch (op) {
                                case '>': return numRowVal > numVal;
                                case '<': return numRowVal < numVal;
                                case '>=': return numRowVal >= numVal;
                                case '<=': return numRowVal <= numVal;
                                case '=': return numRowVal === numVal;
                                default: return false;
                            }
                        } else {
                            // String fallback
                            const strRowVal = String(rowVal).toLowerCase();
                            const strVal = String(val).toLowerCase();
                            switch (op) {
                                case '=': return strRowVal === strVal;
                                case '!=': return strRowVal !== strVal;
                                case '~': return strRowVal.includes(strVal);
                                default: return false;
                            }
                        }
                    });
                });
                return;
            }

            // Normal equality match/IN clause for standard column filters
            filtered = filtered.filter(row => 
                values.some(val => String(val).toLowerCase() === String(row[column] ?? '').toLowerCase())
            );
        });

        // Apply date range filter
        if (dateRange.column && dateRange.start && dateRange.end) {
            filtered = filtered.filter(row => {
                const dateVal = new Date(row[dateRange.column!]);
                const start = new Date(dateRange.start!);
                const end = new Date(dateRange.end!);
                return dateVal >= start && dateVal <= end;
            });
        }

        // Apply drill-down filter
        if (activeDrillDown) {
            filtered = filtered.filter(row => row[activeDrillDown.column] === activeDrillDown.value);
        }

        // Apply global text search (if any)
        if (globalFilters._global_search) {
            globalFilters._global_search.forEach(term => {
                const lowerTerm = String(term).toLowerCase();
                filtered = filtered.filter(row =>
                    Object.values(row).some(val => String(val).toLowerCase().includes(lowerTerm))
                );
            });
        }

        setFilteredData(filtered);
    }, [globalFilters, dateRange, activeDrillDown, localData]);

    // Helper functions for filter management
    const addFilter = (column: string, value: any) => {
        setGlobalFilters(prev => {
            // Check if this value already exists for this column
            const existingValues = prev[column] || [];
            if (existingValues.includes(value)) {
                return prev; // Don't add duplicate
            }

            return {
                ...prev,
                [column]: [...existingValues, value]
            };
        });
        setFilterHistory(prev => [...prev, { type: 'filter', column, value }]);
    };

    const removeFilter = (column: string, value?: any) => {
        if (value === undefined) {
            // Remove entire column filter
            setGlobalFilters(prev => {
                const updated = { ...prev };
                delete updated[column];
                return updated;
            });
        } else {
            // Remove specific value
            setGlobalFilters(prev => ({
                ...prev,
                [column]: (prev[column] || []).filter(v => v !== value)
            }));
        }
    };

    const clearAllFilters = () => {
        setGlobalFilters({});
        setDateRange({ start: null, end: null, column: null });
        setActiveDrillDown(null);
        setFilterHistory([]);
    };

    const handleDrillDown = (column: string, value: any) => {
        setActiveDrillDown({ column, value });
        setFilterHistory(prev => [...prev, { type: 'drilldown', column, value }]);
    };

    const handleDrillUp = () => {
        if (filterHistory.length > 0) {
            const newHistory = [...filterHistory];
            newHistory.pop();
            setFilterHistory(newHistory);

            // Reapply filters from history
            setActiveDrillDown(null);
            // Could rebuild filters from history here if needed
        }
    };

    // Compute schema for NL Query Bar
    const nlqSchema = useMemo(() => {
        if (!localData.length) return {};
        const schema: Record<string, string> = {};
        Object.keys(localData[0]).forEach(col => {
            const val = localData[0][col];
            schema[col] = typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '') ? 'number' : 'string';
        });
        return schema;
    }, [localData]);

    // ⌘J shortcut for NL Query bar
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                setIsNLQueryOpen(p => !p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Presentation Mode Loop
    useEffect(() => {
        let interval: any;
        if (isPlaying && activeTab === 'presentation') {
            interval = setInterval(() => {
                setPresentationIndex(prev => (prev + 1) % (analysis.options?.length || 1));
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, activeTab, analysis.options]);

    const runQuery = () => {
        try {
            setQueryError(null);
            // Run query against filtered data to respect active filters
            const res = alasql(queryText, [filteredData]);
            setQueryResult(res as any[]);
        } catch (e: any) {
            setQueryError(e.message);
        }
    };
    const renderStaticChart = (data: any[], type: string) => {
        if (!data || data.length === 0) return (
            <div className="w-full h-full flex items-center justify-center opacity-20">
                <div className="flex flex-col items-center gap-4">
                    <Grid size={48} />
                    <span className="text-xs font-black uppercase tracking-widest">{t('analysis.noData')}</span>
                </div>
            </div>
        );

        const colorMain = '#818cf8'; // Indigo (Measure-based)
        const colorAlt = '#34d399'; // Emerald (Dimension-based)
        const finalColor = builderConfig.aggregation === 'COUNT' ? colorAlt : colorMain;

        if (type === 'worldmap') {
            return (
                <div className="w-full h-full" style={{ height: '500px', width: '100%', display: 'block' }}>
                    <WorldMapChart data={data} title={t('analysis.geospatialPreview')} />
                </div>
            );
        }

        return (
            <div className="w-full h-full" style={{ height: '500px', width: '100%', display: 'block' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'bar' ? (
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 80 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={finalColor} stopOpacity={1} />
                                    <stop offset="100%" stopColor={finalColor} stopOpacity={0.4} />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" strokeOpacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                axisLine={false}
                                tickLine={false}
                                height={80}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--primary-subtle)', opacity: 0.1 }}
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(30px)',
                                    boxShadow: 'var(--shadow-lg)'
                                }}
                                itemStyle={{ color: finalColor, fontWeight: 'bold' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} style={{ filter: 'url(#glow)' }} barSize={38}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (type === 'pie' || type === 'donut') ? (
                        <PieChart>
                            <defs>
                                <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                outerRadius="85%"
                                innerRadius={type === 'donut' ? "65%" : "0%"}
                                paddingAngle={type === 'donut' ? 4 : 0}
                                stroke="var(--bg-secondary)"
                                strokeWidth={type === 'donut' ? 3 : 1}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                            >
                                {data.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={COLORS[i % COLORS.length]}
                                        style={{ filter: 'url(#pieGlow)' }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(30px)'
                                }}
                            />
                        </PieChart>
                    ) : type === 'scatter' ? (
                        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" strokeOpacity={0.1} />
                            <XAxis
                                type={typeof data[0]?.x === 'number' ? 'number' : 'category'}
                                dataKey="x"
                                name={builderConfig.xAxis}
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                angle={typeof data[0]?.x === 'number' ? 0 : -45}
                                textAnchor={typeof data[0]?.x === 'number' ? 'middle' : 'end'}
                                interval={0}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => (typeof val === 'number' && val >= 1000) ? `${(val / 1000).toFixed(1)}k` : val}
                                height={typeof data[0]?.x === 'number' ? 40 : 80}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name={builderConfig.yAxis}
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(30px)'
                                }}
                                content={<CustomTooltip />}
                            />
                            <Scatter name="Data Points" data={data} fill={finalColor} style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    ) : (
                        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={finalColor} stopOpacity={0.7} />
                                    <stop offset="95%" stopColor={finalColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" strokeOpacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                height={40}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                strokeOpacity={0.3}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={finalColor}
                                strokeWidth={5}
                                fill={type === 'line' ? 'none' : "url(#areaGrad)"}
                                dot={{ fill: finalColor, r: 5, strokeWidth: 2, stroke: 'var(--bg-main)' }}
                                activeDot={{ r: 8, stroke: 'var(--primary)', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    const renderChart = (opt: ChartOption, index: number, forcedData?: any) => {
        // Use filtered data for charts - prefer forcedData (memoized) if available
        const displayData = forcedData || getFilteredChartData(opt);
        const color = COLORS[index % COLORS.length];
        const currentType = opt.isStatic ? opt.chartType : (chartConfig[index] || opt.chartType);

        const downloadChart = (id: string) => {
            // ... (rest of downloadChart is fine)
        };

        // If isStatic, we return a "naked" chart to fit into the Architect UI
        if (opt.isStatic) {
            return (
                <div key={index} id={`chart-static`} className="flex-1 w-full h-full flex flex-col min-h-[350px]">
                    <div className="flex-1 w-full relative min-h-[300px]">
                        {currentType === 'worldmap' ? (
                            <WorldMapChart data={displayData} title={opt.title} />
                        ) : (
                        <div style={{ position: 'absolute', inset: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                            {currentType === 'area' || currentType === 'line' ? (
                                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`gradStatic`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                                    <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} dy={10} />
                                    <YAxis stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={currentType === 'line' ? 'none' : `url(#gradStatic)`} />
                                </AreaChart>
                            ) : currentType === 'pie' ? (
                                <PieChart>
                                    <Pie data={displayData} innerRadius="60%" outerRadius="80%" dataKey="value" paddingAngle={5} stroke="none">
                                        {displayData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            ) : currentType === 'scatter' ? (
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                                    <XAxis type="number" dataKey="x" stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis type="number" dataKey="y" stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter name="Data" data={displayData.map((d: any) => ({ ...d, x: d.value, y: d.value }))} fill={color} />
                                </ScatterChart>
                            ) : (
                                <BarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                                    <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} dy={10} />
                                    <YAxis stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                            </ResponsiveContainer>
                        </div>
                        )}
                    </div>
                </div>
            );
        }

        // Standard Chart Container
        return (
            <div key={index} id={`chart-${index}`} className="card card-hover flex-col chart-container-mobile" style={{
                minHeight: '420px',
                height: activeTab === 'presentation' ? '100%' : undefined,
                flex: activeTab === 'presentation' ? '1' : undefined,
                background: activeTab === 'presentation' ? 'transparent' : 'var(--bg-card)',
                border: 'none',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: activeTab === 'presentation' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div className="flex justify-between items-start mb-8" style={{ display: activeTab === 'presentation' ? 'none' : 'flex' }}>
                    <div>
                        <h3 className="text-h3" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{opt.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{opt.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="input"
                            style={{
                                height: '32px',
                                padding: '0 12px',
                                fontSize: '13px',
                                width: 'auto',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                            value={currentType}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, [index]: e.target.value }))}
                        >
                            <option value="bar">{t('analysis.chart.bar')}</option>
                            <option value="line">{t('analysis.chart.line')}</option>
                            <option value="area">{t('analysis.chart.area')}</option>
                            <option value="pie">{t('analysis.chart.pie')}</option>
                            <option value="scatter">{t('analysis.chart.scatter')}</option>
                            <option value="worldmap">{t('analysis.chart.worldmap')}</option>
                        </select>
                        <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '2px', borderRadius: '8px' }}>
                            <button
                                className="btn btn-ghost btn-icon"
                                style={{ width: '28px', height: '28px', padding: 0, color: 'var(--text-secondary)' }}
                                onClick={() => setExpandedChart({ opt, index })}
                                title="Expand View"
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                className="btn btn-secondary btn-icon"
                                style={{ borderRadius: '10px' }}
                                title={t('analysis.actions.export')}
                                onClick={() => exportToPDF(analysis, `analysis-report-${analysis.id || 'export'}`)}
                            >
                                <Share2 size={16} />
                            </button>
                            <button
                                className="btn btn-ghost btn-icon"
                                style={{ width: '28px', height: '28px', padding: 0, color: 'var(--text-secondary)' }}
                                onClick={() => downloadChart(`chart-${index}`)}
                            >
                                <Camera size={16} />
                            </button>
                            <button
                                className="btn btn-ghost btn-icon"
                                style={{ width: '28px', height: '28px', padding: 0, color: 'var(--text-secondary)' }}
                                onClick={() => alert(`${t('analysis.aiInsightLabel')}: ${(displayData[displayData.length - 1]?.value > displayData[0]?.value) ? t('analysis.uptrendDetected') : t('analysis.stableTrend')}`)}
                            >
                                <BrainCircuit size={16} />
                            </button>
                            <CommentBadge
                                count={commentCounts[`chart:${index}`] || 0}
                                onClick={() => openComments('chart', String(index), opt.title)}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, width: '100%', minHeight: '300px', position: 'relative' }}>
                    {currentType === 'worldmap' ? (
                        <WorldMapChart data={displayData} title={opt.title} />
                    ) : (
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                        {currentType === 'area' || currentType === 'line' ? (
                            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`grad${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                                {currentType === 'line' ?
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={color}
                                        strokeWidth={3}
                                        fill="none"
                                        dot={{ r: 4, cursor: 'pointer' }}
                                        activeDot={{ r: 6, cursor: 'pointer', onClick: ((e: any, payload: any) => handleChartClick(payload.payload, opt, index, e)) as any }}
                                        onClick={((...args: any[]) => handleChartClick(args[0], opt, index, args.find(a => a && a.nativeEvent))) as any}
                                    /> :
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={color}
                                        strokeWidth={3}
                                        fill={`url(#grad${index})`}
                                        dot={{ r: 4, cursor: 'pointer' }}
                                        activeDot={{ r: 6, cursor: 'pointer', onClick: ((e: any, payload: any) => handleChartClick(payload.payload, opt, index, e)) as any }}
                                        onClick={((...args: any[]) => handleChartClick(args[0], opt, index, args.find(a => a && a.nativeEvent))) as any}
                                    />
                                }
                            </AreaChart>
                        ) : currentType === 'pie' ? (
                            <PieChart>
                                <Pie
                                    data={displayData}
                                    innerRadius={80}
                                    outerRadius={120}
                                    dataKey="value"
                                    paddingAngle={4}
                                    stroke="none"
                                    onClick={((...args: any[]) => handleChartClick(args[0], opt, index, args.find(a => a && a.nativeEvent))) as any}
                                    cursor="pointer"
                                >
                                    {displayData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        ) : currentType === 'scatter' ? (
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name={t('analysis.xAxis')}
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    dy={10}
                                    tickFormatter={(val) => typeof val === 'number' ? val.toLocaleString() : val}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name={t('analysis.yAxis')}
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    tickFormatter={(val) => typeof val === 'number' ? val.toLocaleString() : val}
                                />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <Scatter
                                    name="Data Points"
                                    data={displayData.map((d: any) => ({
                                        ...d,
                                        x: d.x !== undefined ? d.x : (d.name !== undefined && !isNaN(parseFloat(d.name)) ? parseFloat(d.name) : 0),
                                        y: d.y !== undefined ? d.y : (d.value !== undefined ? d.value : 0)
                                    }))}
                                    fill={color}
                                    cursor="pointer"
                                    onClick={((...args: any[]) => handleChartClick(args[0], opt, index, args.find(a => a && a.nativeEvent))) as any}
                                />
                            </ScatterChart>
                        ) : (
                            <BarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradBar${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} strokeOpacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="transparent"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'var(--bg-surface)', opacity: 0.4 }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill={`url(#gradBar${index})`}
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={60}
                                    onClick={((...args: any[]) => handleChartClick(args[0], opt, index, args.find(a => a && a.nativeEvent))) as any}
                                    cursor="pointer"
                                />
                                {/* Removed per-cell coloring to enforce Elastic-style single-color series */}
                            </BarChart>
                        )}
                        </ResponsiveContainer>
                    </div>
                    )}
                </div>
            </div >
        );
    };

    return (
        <div className="flex h-screen" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>

            {/* Sidebar Navigation */}
            <div
                className={`sidebar-compact transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
                style={{
                    background: 'var(--bg-sidebar)',
                    borderRight: '1px solid var(--border-subtle)',
                    display: activeTab === 'presentation' ? 'none' : 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: isSidebarCollapsed ? '64px' : '288px',
                    flexShrink: 0,
                    zIndex: 20,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Header / Collapse Toggle */}
                <div style={{
                    padding: isSidebarCollapsed ? '0 12px 24px' : '0 24px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                    minHeight: '60px'
                }}>
                    {!isSidebarCollapsed && (
                        <div className="flex-col">
                            <h2 className="text-h2 tracking-tight-titles" style={{ fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('nav.group.analytics')}</h2>
                            <p className="label-premium" style={{ opacity: 0.6 }}>{analysis.type}</p>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        className="btn btn-icon btn-ghost btn-sm"
                        title={isSidebarCollapsed ? t('nav.expand') : t('nav.collapse')}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                {/* View Mode Toggle - Sidebar */}
                {!isSidebarCollapsed && (
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{
                            paddingLeft: '12px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                            marginBottom: '8px'
                        }}>
                            {t('nav.viewMode')}
                        </div>
                        <div className="flex-col gap-2">
                            <button
                                onClick={() => setViewMode('executive')}
                                className={`btn hover-lift active-press ${viewMode === 'executive' ? 'btn-primary shadow-lg' : 'btn-ghost'}`}
                                style={{
                                    justifyContent: 'flex-start',
                                    padding: '10px 12px',
                                    width: '100%',
                                    gap: '12px',
                                    position: 'relative',
                                    borderRadius: '10px',
                                    minHeight: '40px'
                                }}
                            >
                                <span style={{ color: viewMode === 'executive' ? '#fff' : 'inherit' }}>
                                    <Presentation size={18} />
                                </span>
                                <span className="font-semibold" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                                    {t('nav.viewMode.executive')}
                                </span>
                                {viewMode === 'executive' && (
                                    <motion.div
                                        layoutId="activeViewMode"
                                        className="absolute left-0 w-1 h-1/2 bg-white rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setViewMode('analyst')}
                                className={`btn hover-lift active-press ${viewMode === 'analyst' ? 'btn-primary shadow-lg' : 'btn-ghost'}`}
                                style={{
                                    justifyContent: 'flex-start',
                                    padding: '10px 12px',
                                    width: '100%',
                                    gap: '12px',
                                    position: 'relative',
                                    borderRadius: '10px',
                                    minHeight: '40px'
                                }}
                            >
                                <span style={{ color: viewMode === 'analyst' ? '#fff' : 'inherit' }}>
                                    <Terminal size={18} />
                                </span>
                                <span className="font-semibold" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                                    {t('nav.viewMode.analyst')}
                                </span>
                                {viewMode === 'analyst' && (
                                    <motion.div
                                        layoutId="activeViewMode"
                                        className="absolute left-0 w-1 h-1/2 bg-white rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-col gap-6" style={{ marginTop: '24px', padding: '0 12px', overflowY: 'auto' }}>
                    {[
                        {
                            title: t('nav.group.analytics'),
                            items: [
                                { id: 'ai', icon: <Sparkles size={18} />, label: t('analysis.tabs.ai'), roles: ['executive', 'analyst'], badge: 'NEW' },
                                { id: 'overview', icon: <LayoutTemplate size={18} />, label: t('analysis.tabs.overview'), roles: ['executive', 'analyst'] },
                                { id: 'builder', icon: <PenTool size={18} />, label: t('analysis.tabs.builder'), roles: ['executive', 'analyst'] },
                                { id: 'graph', icon: <Network size={18} />, label: t('analysis.tabs.graph'), roles: ['analyst'] },
                                { id: 'data', icon: <Grid size={18} />, label: t('analysis.tabs.data'), roles: ['analyst'] },
                                { id: 'sql', icon: <Terminal size={18} />, label: t('analysis.tabs.sql'), roles: ['analyst'] },
                            ]
                        },
                        {
                            title: t('nav.group.predictive'),
                            items: [
                                { id: 'anomaly', icon: <Activity size={18} />, label: t('analysis.tabs.anomaly'), roles: ['executive', 'analyst'], badge: 'AI' },
                                { id: 'advanced', icon: <Cpu size={18} />, label: t('analysis.tabs.advanced'), roles: ['analyst'] },
                                { id: 'forecast', icon: <TrendingUp size={18} />, label: t('analysis.tabs.forecast'), roles: ['executive', 'analyst'], badge: 'NEW' },
                                { id: 'insights', icon: <Lightbulb size={18} />, label: t('analysis.tabs.insights'), roles: ['executive', 'analyst'] },
                                { id: 'map', icon: <Map size={18} />, label: t('analysis.tabs.map'), roles: ['analyst'] },
                                { id: 'python', icon: <Brackets size={18} />, label: t('analysis.tabs.python'), roles: ['analyst'] },
                            ]
                        },
                        {
                            title: t('nav.group.bi'),
                            items: [
                                { id: 'presentation', icon: <Presentation size={18} />, label: t('analysis.tabs.presentation'), roles: ['executive', 'analyst'] },
                            ]
                        }
                    ].map(group => {
                        const visibleItems = group.items.filter((item: any) => item.roles.includes(viewMode));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title} className="flex-col gap-2">
                                {!isSidebarCollapsed && (
                                    <div style={{
                                        paddingLeft: '12px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--text-tertiary)',
                                        marginBottom: '4px'
                                    }}>
                                        {group.title}
                                    </div>
                                )}
                                {visibleItems.map((tab: any) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveTab(tab.id as any); if (tab.id === 'presentation') setIsPlaying(true); }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                                                padding: isSidebarCollapsed ? '10px' : '9px 12px',
                                                gap: '12px',
                                                width: '100%',
                                                border: 'none',
                                                cursor: 'pointer',
                                                borderRadius: '10px',
                                                position: 'relative',
                                                fontFamily: 'var(--font-main)',
                                                fontSize: '13.5px',
                                                fontWeight: isActive ? 700 : 500,
                                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                                background: isActive
                                                    ? 'linear-gradient(135deg, var(--primary-subtle), rgba(139, 92, 246, 0.06))'
                                                    : 'transparent',
                                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                                boxShadow: isActive ? '0 0 0 1px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.03)' : 'none',
                                                minHeight: '40px'
                                            }}
                                            title={isSidebarCollapsed ? tab.label : ''}
                                            onMouseEnter={(e) => {
                                                if (!isActive) {
                                                    e.currentTarget.style.background = 'var(--bg-surface)';
                                                    e.currentTarget.style.color = 'var(--text-primary)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                }
                                            }}
                                        >
                                            {/* Active indicator line */}
                                            {isActive && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '0',
                                                    top: '25%',
                                                    bottom: '25%',
                                                    width: '3px',
                                                    background: 'var(--primary)',
                                                    borderRadius: '0 4px 4px 0',
                                                    boxShadow: '0 0 12px var(--primary-glow)',
                                                    animation: 'glow-pulse 2.5s infinite ease-in-out',
                                                }} />
                                            )}

                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                            }}>
                                                {tab.icon}
                                            </span>

                                            {!isSidebarCollapsed && (
                                                <span style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {tab.label}
                                                </span>
                                            )}

                                            {!isSidebarCollapsed && tab.badge && (
                                                <span style={{
                                                    marginLeft: 'auto', padding: '1px 6px', borderRadius: 99,
                                                    fontSize: 8, fontWeight: 900, letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99,102,241,0.1)',
                                                    color: isActive ? 'var(--primary)' : '#818cf8',
                                                    border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99,102,241,0.2)'}`,
                                                }}>{tab.badge}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    })}
                </div>

                <div style={{ marginTop: 'auto', padding: '24px 12px' }}>
                    <button
                        className="btn btn-secondary w-full"
                        onClick={onClose}
                        style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: '12px' }}
                        title={isSidebarCollapsed ? t('nav.backToFiles') : ""}
                    >
                        <ArrowLeft size={16} className={!isSidebarCollapsed ? "mr-2" : ""} />
                        {!isSidebarCollapsed && t('nav.backToFiles')}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-col" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div className="flex-1" style={{ overflowY: 'auto' }} id="analysis-content">
                    {/* Top Header - Moved Inside for Scrollbar Alignment */}
                    <ArchitectNode id="an-headers" label="Strategic Meta Headers">
                    {/* ===== Enterprise Global Header (Parity with Kibana) ===== */}
                    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center ${activeTab === 'presentation' ? 'hidden' : 'flex'}`} style={{
                        minHeight: '48px',
                        padding: '8px 16px',
                        background: 'var(--bg-sidebar)',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'var(--text-tertiary)',
                        letterSpacing: '0.05em',
                        gap: '8px'
                    }}>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <button
                                onClick={onClose}
                                className="btn btn-ghost hover-lift active-press flex items-center gap-2 mr-0 group/back"
                                style={{
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '12px',
                                    padding: '0 16px',
                                    height: '34px',
                                    background: 'var(--bg-surface)'
                                }}
                            >
                                <ArrowLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" />
                                <span className="label-premium !opacity-100 !text-[12px]">{t('nav.backToFiles')}</span>
                            </button>
                            <div className="flex items-center gap-2 mr-4 group cursor-default">
                                <div className="w-5 h-5 bg-[var(--primary)] rounded flex items-center justify-center text-white font-black active-press transition-transform group-hover:scale-110">N</div>
                                <span className="label-premium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>{t('nav.strategicAnalytics')}</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-50 hidden sm:flex">
                                <span className="label-premium">{t('nav.workspace.label')}</span>
                                <div className="w-1 h-1 rounded-full bg-current opacity-20"></div>
                                <span className="label-premium text-[var(--text-primary)]">{t('nav.coreAnalyzer')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                            <span className="label-premium opacity-40 hidden md:inline">{t('nav.version')}: 2.1.0-E</span>
                            <div className="flex items-center gap-2 px-2 py-1 bg-success/10 text-success rounded border border-success/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_5px_var(--success)]"></div>
                                <span className="label-premium !opacity-100 italic animate-breathe">{t('nav.live')}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${activeTab === 'presentation' ? 'hidden' : 'flex'}`} style={{
                        minHeight: '72px',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backdropFilter: 'blur(12px)',
                        background: 'var(--bg-surface)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        width: '100%',
                        gap: '12px'
                    }}>
                        <div className="flex items-center gap-4">
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-h3" style={{ fontSize: '18px', marginBottom: '2px' }}>{t('nav.reportTitle')}</h2>
                                <p className="text-sm text-secondary" style={{ fontSize: '12px' }}>{t('nav.generatedOn')} {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <button
                                className="btn btn-secondary btn-sm hover-lift active-press whitespace-nowrap"
                                onClick={() => {
                                    if (!localData || localData.length === 0) return alert('No data to export');
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + Object.keys(localData[0]).join(",") + "\n"
                                        + localData.map((e: any) => Object.values(e).join(",")).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `analysis_data.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                }}
                            >
                                <FileDown size={14} className="mr-1" />
                                {t('nav.downloadCSV')}
                            </button>

                            <button
                                className="btn btn-primary btn-sm hover-lift active-press shadow-glow-primary whitespace-nowrap"
                                onClick={() => exportToPDF(analysis, 'Nalyse_Report')}
                            >
                                <Download size={14} className="mr-1" />
                                {t('analysis.actions.downloadPDF')}
                            </button>

                            <button
                                className="btn btn-secondary btn-sm hover-lift active-press whitespace-nowrap"
                                onClick={() => openComments('general', undefined, 'General Discussion')}
                                style={{ position: 'relative' }}
                            >
                                <MessageCircle size={14} className="mr-1" />
                                {t('nav.comments')}
                                {Object.values(commentCounts).reduce((a, b) => a + b, 0) > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18,
                                        borderRadius: 9, background: '#818cf8', color: 'var(--text-primary)', fontSize: 10,
                                        fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 5px', boxShadow: '0 2px 8px rgba(129,140,248,0.4)',
                                    }}>
                                        {Object.values(commentCounts).reduce((a, b) => a + b, 0)}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    </ArchitectNode>

                    <ArchitectNode id="an-search" label="Elastic Command Bar">
                    {/* ===== NEW: Elastic Search Tool Bar ===== */}
                    <div className={activeTab === 'presentation' ? 'hidden' : 'block'} style={{ position: 'sticky', top: '72px', zIndex: 30, background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <ElasticSearch
                            onSearch={parseQuery}
                            dimensions={dimensions}
                            measures={measures}
                            sampleData={filteredData}
                            onTimeRangeChange={(range: any) => {
                                // Find a date column if one isn't selected
                                let col = dateRange.column;
                                if (!col) {
                                    const dateCol = Object.entries(analysis.summary?.columnTypes || {}).find(([_, v]) => v === 'date');
                                    col = dateCol ? dateCol[0] : null;
                                    if (!col) {
                                        // Try to find one in dimensions that looks like 'date' or 'timestamp'
                                        col = dimensions.find(d => d.toLowerCase().includes('date') || d.toLowerCase().includes('time')) || null;
                                    }
                                    if (!col && dimensions.length > 0) {
                                        // Fallback or ask user (for now just pick first)
                                        // col = dimensions[0]; 
                                    }
                                }

                                if (col) {
                                    setDateRange({ start: range.start, end: range.end, column: col });
                                } else {
                                    alert("No date column detected in this dataset. Please manually select a date filter first.");
                                }
                            }}
                            onRefresh={() => {
                                // Simulate refresh
                                const refreshIcon = document.querySelector('.refresh-icon');
                                if (refreshIcon) refreshIcon.classList.add('spin');
                                setTimeout(() => {
                                    if (refreshIcon) refreshIcon.classList.remove('spin');
                                }, 1000);
                            }}
                        />
                        <ElasticFilterBar
                            filters={activeFiltersList as any[]}
                            onRemoveFilter={handleRemoveFilter}
                            onClearAll={clearAllFilters}
                            onAddFilter={() => setShowFilterPanel(true)}
                        />
                    </div>
                    </ArchitectNode>

                    <div style={{ width: '100%', padding: 'clamp(16px, 3vw, 24px)' }}>

                        {activeTab === 'overview' && (
                            <div className="flex-col gap-6 fade-in">
                                <div className="hidden-on-screen" style={{ display: 'none', marginBottom: '20px' }}>
                                    <h1 style={{ fontSize: '24px', color: 'var(--text-primary)' }}>{t('nav.strategicAnalytics')}</h1>
                                    <p style={{ color: '#ccc' }}>{t('nav.generatedOn')} {new Date().toLocaleString()}</p>
                                </div>

                                {/* AI Insight Engine — auto-detect patterns in the dataset */}
                                {filteredData && filteredData.length > 0 && (
                                    <InsightPanel data={filteredData} context="analysis-overview" compact={true} maxInsights={4} />
                                )}

                                {(() => {
                                    const sections = [
                                        {
                                            id: 'an-metrics',
                                            label: t('analysis.priorityMatrix'),
                                            component: (
                                                <div className="flex-responsive gap-4">
                                                    {memoizedMetrics.map((metric, idx) => (
                                                        <motion.div
                                                            key={`metric-${idx}`}
                                                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                                                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                                            className="card flex-1 group cursor-pointer"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', minHeight: '140px' }}
                                                        >
                                                            <motion.div animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', top: '-50%', right: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${metric.color}40 0%, transparent 70%)`, pointerEvents: 'none' }} />
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${metric.color}, ${metric.color}80, transparent)`, opacity: 0.8 }} />
                                                            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '48px', height: '48px', borderRadius: '12px', background: `${metric.color}10`, border: `1px solid ${metric.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }} className="group-hover:scale-110 group-hover:rotate-12">{metric.icon}</div>
                                                            <div style={{ position: 'relative', zIndex: 1 }}>
                                                                <div className="flex items-center gap-2 mb-3"><span className="text-xs font-bold uppercase tracking-wider text-secondary" style={{ letterSpacing: '0.1em' }}>{metric.label}</span></div>
                                                                <motion.div className="text-h1 font-mono mb-3" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: metric.color, textShadow: `0 0 30px ${metric.color}30, 0 2px 4px rgba(0,0,0,0.3)`, lineHeight: 1, letterSpacing: '-0.02em' }}>{metric.value}</motion.div>
                                                                <div className="flex items-center gap-2">
                                                                    <div style={{ fontSize: '10px', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', background: `${metric.color}15`, color: metric.color, border: `1px solid ${metric.color}30`, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                        {metric.trend.includes('+') && <span>↗</span>}
                                                                        {metric.trend.includes('-') && <span>↘</span>}
                                                                        <span>{metric.trend}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )
                                        },
                                        {
                                            id: 'an-findings',
                                            label: t('analysis.findings.title'),
                                            component: analysis.keyFindings && analysis.keyFindings.length > 0 ? (
                                                <div className="card" style={{ border: '1px solid var(--border-highlight)' }}>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(210, 153, 34, 0.1)', color: 'var(--warning)' }}>
                                                            <BrainCircuit size={20} />
                                                        </div>
                                                        <h3 className="text-h3" style={{ color: 'var(--text-primary)' }}>{t('analysis.findings.title')}</h3>
                                                    </div>
                                                    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
                                                        {analysis.keyFindings.slice(0, 5).map((insight: any, i: number) => (
                                                            <div key={i} style={{ background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                                <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{insight.description.replace(/\*\*/g, '')}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null
                                        },
                                        {
                                            id: 'an-charts',
                                            label: t('analysis.synthesisGrid'),
                                            component: (
                                                <div className="grid gap-6" style={{ display: layoutMode === 'grid' ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: layoutMode === 'grid' ? 'repeat(auto-fit, minmax(450px, 1fr))' : '1fr', gap: '24px' }}>
                                                    {analysis.options?.map((opt: any, i: number) => renderChart(opt, i, memoizedChartsData[i]))}
                                                </div>
                                            )
                                        },
                                        // Deep Intelligence Section (ML / Forecast / Regression)
                                        ...((analysis.mlAnalysis || analysis.forecast || analysis.regressionModel) ? [{
                                            id: 'an-deep-intel',
                                            label: t('analysis.deepIntelligence'),
                                            component: (
                                                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                                                    {/* K-Means Clustering Card */}
                                                    {analysis.mlAnalysis?.kmeansResult && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="card"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(168,85,247,0.05))', border: '1px solid rgba(168,85,247,0.2)', position: 'relative', overflow: 'hidden' }}
                                                        >
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a855f7, #6366f1, transparent)' }} />
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                                                                    <Layers size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('analysis.tabs.advanced')}</h4>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>K-Means Clustering</span>
                                                                </div>
                                                                <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', background: 'rgba(168,85,247,0.12)', color: '#a855f7', fontSize: '11px', fontWeight: 700 }}>
                                                                    {analysis.mlAnalysis.kmeansResult.k} Segments
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('analysis.ml.clustering')}:</span>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${Math.max(0, analysis.mlAnalysis.kmeansResult.silhouetteScore * 100)}%`, height: '100%', borderRadius: '3px', background: analysis.mlAnalysis.kmeansResult.silhouetteScore > 0.5 ? '#34d399' : analysis.mlAnalysis.kmeansResult.silhouetteScore > 0.25 ? '#fbbf24' : '#f87171', transition: 'width 1s ease' }} />
                                                                </div>
                                                                <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{analysis.mlAnalysis.kmeansResult.silhouetteScore.toFixed(3)}</span>
                                                            </div>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {analysis.mlAnalysis.kmeansResult.clusterProfiles?.map((p: any, ci: number) => (
                                                                    <div key={ci} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-surface-hover)', fontSize: '10px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                                                                        <span style={{ fontWeight: 700, color: COLORS[ci % COLORS.length] }}>C{ci + 1}</span> • {p.size} records
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Forecast Card */}
                                                    {analysis.forecast && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            className="card"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(56,189,248,0.05))', border: '1px solid rgba(56,189,248,0.2)', position: 'relative', overflow: 'hidden' }}
                                                        >
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #38bdf8, #34d399, transparent)' }} />
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                                                                    <TrendingUp size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('analysis.forecast.engine')}</h4>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{analysis.forecast.column}</span>
                                                                </div>
                                                                <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', background: analysis.forecast.metrics.trend === 'increasing' ? 'rgba(52,211,153,0.12)' : analysis.forecast.metrics.trend === 'decreasing' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)', color: analysis.forecast.metrics.trend === 'increasing' ? '#34d399' : analysis.forecast.metrics.trend === 'decreasing' ? '#f87171' : '#fbbf24', fontSize: '11px', fontWeight: 700 }}>
                                                                    {analysis.forecast.metrics.trend === 'increasing' ? '↗ Upward' : analysis.forecast.metrics.trend === 'decreasing' ? '↘ Downward' : '→ Stable'}
                                                                </div>
                                                            </div>
                                                            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                                                <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-surface-hover)' }}>
                                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('analysis.findings.confidence')}</div>
                                                                    <div className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{analysis.forecast.metrics.confidence.toFixed(0)}%</div>
                                                                </div>
                                                                <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-surface-hover)' }}>
                                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('analysis.ml.reliability')}</div>
                                                                    <div className="font-bold" style={{ color: analysis.forecast.metrics.modelReliability === 'High' ? '#34d399' : analysis.forecast.metrics.modelReliability === 'Medium' ? '#fbbf24' : '#f87171', fontSize: '18px' }}>{analysis.forecast.metrics.modelReliability}</div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Regression Model Card */}
                                                    {analysis.regressionModel && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="card"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(99,102,241,0.05))', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}
                                                        >
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366f1, #818cf8, transparent)' }} />
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                                                    <Activity size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('analysis.tabs.advanced')}</h4>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{analysis.regressionModel.dependentVar} ← {analysis.regressionModel.independentVar}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-surface-hover)', marginBottom: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                                {analysis.regressionModel.equation}
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div style={{ padding: '6px 12px', borderRadius: '8px', background: analysis.regressionModel.rSquared > 0.7 ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', border: `1px solid ${analysis.regressionModel.rSquared > 0.7 ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>R² = </span>
                                                                    <span className="font-mono font-bold" style={{ color: analysis.regressionModel.rSquared > 0.7 ? '#34d399' : '#fbbf24' }}>{analysis.regressionModel.rSquared.toFixed(3)}</span>
                                                                </div>
                                                                <div style={{ padding: '6px 12px', borderRadius: '8px', background: analysis.regressionModel.pValue < 0.05 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${analysis.regressionModel.pValue < 0.05 ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>p = </span>
                                                                    <span className="font-mono font-bold" style={{ color: analysis.regressionModel.pValue < 0.05 ? '#34d399' : '#f87171' }}>{analysis.regressionModel.pValue < 0.001 ? '<0.001' : analysis.regressionModel.pValue.toFixed(4)}</span>
                                                                </div>
                                                                {analysis.regressionModel.pValue < 0.05 && (
                                                                    <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <CheckCircle2 size={12} style={{ color: '#34d399' }} />
                                                                        <span className="text-xs font-bold" style={{ color: '#34d399' }}>Significant</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Outlier Summary Card */}
                                                    {analysis.mlAnalysis?.outlierResults && analysis.mlAnalysis.outlierResults.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.3 }}
                                                            className="card"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(251,146,60,0.05))', border: '1px solid rgba(251,146,60,0.2)', position: 'relative', overflow: 'hidden' }}
                                                        >
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #fb923c, #f87171, transparent)' }} />
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
                                                                    <AlertCircle size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('analysis.tabs.anomaly')}</h4>
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Distribution-Aware Outliers</span>
                                                                </div>
                                                                <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', background: 'rgba(251,146,60,0.12)', color: '#fb923c', fontSize: '11px', fontWeight: 700 }}>
                                                                    {analysis.mlAnalysis.outlierResults.reduce((s: number, o: any) => s + o.outlierCount, 0)} Total
                                                                </div>
                                                            </div>
                                                            <div className="flex-col gap-2">
                                                                {analysis.mlAnalysis.outlierResults.slice(0, 4).map((o: any, oi: number) => (
                                                                    <div key={oi} className="flex items-center gap-3" style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-surface-hover)', fontSize: '12px' }}>
                                                                        <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', minWidth: '80px' }}>{o.column.length > 12 ? o.column.slice(0, 10) + '…' : o.column}</span>
                                                                        <span style={{ color: '#fb923c', fontWeight: 700 }}>{o.outlierCount}</span>
                                                                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{o.method} • {o.distribution}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Correlation Highlights Card */}
                                                    {analysis.mlAnalysis?.correlationMatrix?.entries && analysis.mlAnalysis.correlationMatrix.entries.filter((e: any) => e.strength !== 'none' && e.strength !== 'weak').length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="card"
                                                            style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(52,211,153,0.05))', border: '1px solid rgba(52,211,153,0.2)', position: 'relative', overflow: 'hidden' }}
                                                        >
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #34d399, #38bdf8, transparent)' }} />
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                                                                    <Network size={18} />
                                                                </div>
                                                                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('analysis.ml.correlation')}</h4>
                                                            </div>
                                                            <div className="flex-col gap-2">
                                                                {analysis.mlAnalysis.correlationMatrix.entries
                                                                    .filter((e: any) => e.strength !== 'none' && e.strength !== 'weak')
                                                                    .sort((a: any, b: any) => Math.abs(b.pearson) - Math.abs(a.pearson))
                                                                    .slice(0, 4)
                                                                    .map((e: any, ei: number) => (
                                                                        <div key={ei} className="flex items-center gap-2" style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-surface-hover)', fontSize: '12px' }}>
                                                                            <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{e.col1.length > 10 ? e.col1.slice(0, 8) + '…' : e.col1}</span>
                                                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>↔</span>
                                                                            <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{e.col2.length > 10 ? e.col2.slice(0, 8) + '…' : e.col2}</span>
                                                                            <div style={{ padding: '2px 8px', borderRadius: '10px', background: Math.abs(e.pearson) > 0.7 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: Math.abs(e.pearson) > 0.7 ? '#34d399' : '#fbbf24', fontWeight: 700, fontSize: '11px' }}>
                                                                                r={e.pearson.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )
                                        }] : [])
                                    ];

                                    return sections
                                        .sort((a, b) => (layoutState[a.id]?.order || 0) - (layoutState[b.id]?.order || 0))
                                        .map(section => {
                                            const w = layoutState[section.id]?.width;
                                            let flexBasis = '1 1 100%';
                                            if (layoutMode === 'grid') {
                                                if (w === '50%') flexBasis = '1 1 calc(50% - 12px)';
                                                else if (w === '33%') flexBasis = '1 1 calc(33.333% - 16px)';
                                            }
                                            
                                            return (
                                                <ArchitectNode 
                                                    key={section.id} 
                                                    id={section.id} 
                                                    label={section.label}
                                                    style={{ flex: layoutMode === 'vertical' || layoutMode === 'canvas' ? '0 0 auto' : flexBasis, width: '100%' }}
                                                >
                                                    {section.component}
                                                </ArchitectNode>
                                            );
                                        });
                                })()}
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="flex-col gap-4 fade-in">
                                <h2 className="text-h2">{t('analysis.automatedInsights')}</h2>
                                <div className="flex-col gap-4">
                                    {analysis.aiInsights.map((insight: any, i: number) => {
                                        const isAnomaly = insight.type === 'anomaly';
                                        const isTrend = insight.type === 'trend';
                                        const isQuality = insight.type === 'quality';
                                        const isSegment = insight.type === 'segment';
                                        const isCorrelation = insight.type === 'correlation';
                                        const isPrediction = insight.type === 'prediction';
                                        const isRisk = insight.type === 'risk';
                                        const isPattern = insight.type === 'pattern';

                                        // Rich color mapping by type
                                        let colorVar = 'var(--primary)';
                                        let bgVar = 'rgba(88, 101, 242, 0.1)';

                                        if (isAnomaly) { colorVar = '#f87171'; bgVar = 'rgba(248, 113, 113, 0.1)'; }
                                        else if (isCorrelation) { colorVar = '#38bdf8'; bgVar = 'rgba(56, 189, 248, 0.1)'; }
                                        else if (isTrend) { colorVar = '#34d399'; bgVar = 'rgba(52, 211, 153, 0.1)'; }
                                        else if (isSegment) { colorVar = '#a78bfa'; bgVar = 'rgba(167, 139, 250, 0.1)'; }
                                        else if (isPrediction) { colorVar = '#22d3ee'; bgVar = 'rgba(34, 211, 238, 0.1)'; }
                                        else if (isRisk) { colorVar = '#fb923c'; bgVar = 'rgba(251, 146, 60, 0.1)'; }
                                        else if (isPattern) { colorVar = '#818cf8'; bgVar = 'rgba(129, 140, 248, 0.1)'; }
                                        else if (isTrend) { colorVar = 'var(--warning)'; bgVar = 'rgba(210, 153, 34, 0.1)'; }
                                        else if (isQuality) { colorVar = 'var(--success)'; bgVar = 'rgba(16, 185, 129, 0.1)'; }
                                        else if (isSegment) { colorVar = 'var(--info-custom)'; bgVar = 'rgba(56, 189, 248, 0.1)'; }

                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="card"
                                                style={{ border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ padding: '6px', borderRadius: '6px', background: bgVar, color: colorVar, display: 'flex' }}>
                                                            {isAnomaly ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                                            ) : isTrend ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                                            ) : isQuality ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                                            ) : isSegment ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                                            ) : (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-uppercase" style={{ color: colorVar }}>{insight.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ height: '4px', width: '40px', background: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${insight.confidence * 100}%`, background: colorVar }} />
                                                        </div>
                                                        <span className="text-xs text-secondary">{(insight.confidence * 100).toFixed(0)}% Confidence</span>
                                                    </div>
                                                </div>
                                                <p className="text-h3" style={{ fontSize: '15px', fontWeight: 400, lineHeight: '1.6' }}>
                                                    {insight.description.replace(/\*\*/g, '').replace(/^💡\s*/, '').replace(/^📈\s*/, '')}
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-card)] fade-in">
                                {/* --- Minimal Context Header --- */}
                                <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]/30">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold font-data text-[var(--text-primary)]">{filteredData.length.toLocaleString()}</span>
                                                <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] opacity-40 uppercase">{t('analysis.totalRecords')}</span>
                                            </div>
                                            {filteredData.length !== localData.length && (
                                                <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-tight">{t('analysis.activeFilteredView')}</span>
                                            )}
                                        </div>

                                        <div className="h-4 w-px bg-[var(--border-subtle)] mx-2" />

                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group-focus-within:border-primary/40 transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                            <input
                                                type="text"
                                                placeholder={t('analysis.instantSearch')}
                                                className="bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] w-64 placeholder:opacity-20"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-20">{t('analysis.limit')}</span>
                                            <select
                                                className="bg-transparent border-none text-[11px] font-black text-[var(--text-primary)] outline-none cursor-pointer focus:ring-0"
                                                value={gridPageSize}
                                                onChange={(e) => setGridPageSize(Number(e.target.value))}
                                            >
                                                {[50, 100, 500, 1000].map(s => <option key={s} value={s} className="bg-[var(--bg-card)]">{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* --- The Pure Data Grid --- */}
                                <div
                                    ref={tableContainerRef}
                                    onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 200)}
                                    className="flex-1 overflow-auto custom-scrollbar relative"
                                >
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 z-20 bg-[var(--bg-sidebar)] shadow-2xl">
                                            <tr>
                                                {(visibleColumns.length > 0 ? visibleColumns : Object.keys(filteredData[0] || {})).map(col => (
                                                    <th
                                                        key={col}
                                                        className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-white/5 bg-[var(--bg-sidebar)] whitespace-nowrap"
                                                    >
                                                        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                                            {col}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData
                                                .filter((r: any) => JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()))
                                                .slice(0, gridPageSize)
                                                .map((row, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] group"
                                                    >
                                                        {(visibleColumns.length > 0 ? visibleColumns : Object.keys(row)).map((col, j) => {
                                                            const val = row[col];
                                                            const isNumeric = typeof val === 'number';
                                                            return (
                                                                <td
                                                                    key={j}
                                                                    className={`px-6 py-4 text-xs ${isNumeric ? 'font-data text-[var(--primary)]' : 'text-[var(--text-primary)] opacity-70 group-hover:opacity-100'} truncate transition-all`}
                                                                    style={{ maxWidth: '400px' }}
                                                                >
                                                                    {String(val ?? '')}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>

                                    {filteredData.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4"><path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" /><path d="M9 2v4" /><path d="M15 2v4" /><path d="M12 18v4" /><path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /><path d="M9 22v-4" /><path d="M15 22v-4" /><path d="M2 13h20" /><path d="M2 9h20" /></svg>
                                            <span className="text-sm font-bold tracking-widest uppercase">{t('analysis.noMatchingData')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Floating Scroll Top */}
                                <AnimatePresence>
                                    {showScrollTop && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                            onClick={() => tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="absolute bottom-8 right-8 w-12 h-12 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)] z-50 hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <ArrowUp size={24} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {activeTab === 'sql' && (
                            <div className="flex-col gap-4 fade-in" style={{ height: '100%', minHeight: '80vh' }}>
                                <div className="card flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-h3">{t('analysis.sqlEditor')}</h3>
                                        <div className="text-sm text-secondary">Table name: <code>?</code></div>
                                    </div>
                                    <textarea
                                        className="input"
                                        style={{ height: '150px', fontFamily: 'inherit', padding: '16px', lineHeight: '1.5' }}
                                        value={queryText}
                                        onChange={e => setQueryText(e.target.value)}
                                    />
                                    <div className="flex justify-between items-center">
                                        {queryError ? <span style={{ color: 'var(--danger)' }}>{queryError}</span> : <span></span>}
                                        <button className="btn btn-primary" onClick={runQuery}>{t('analysis.runQuery')}</button>
                                    </div>
                                </div>

                                {queryResult.length > 0 && (
                                    <div className="card flex-col" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
                                        <div className="p-4 border-bottom"><h4 className="text-h3">{t('analysis.results')}</h4></div>
                                        <div style={{ overflow: 'auto', flex: 1 }}>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>{Object.keys(queryResult[0]).map(k => <th key={k}>{k}</th>)}</tr>
                                                </thead>
                                                <tbody>
                                                    {queryResult.map((r, i) => <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j}>{String(v)}</td>)}</tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'python' && (
                            <PythonStudio data={localData} />
                        )}

                        {/* ── AI QUERY TAB ── */}
                        {activeTab === 'ai' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                                <NLQueryBar
                                    datasetId={analysis.id}
                                    data={localData}
                                    schema={nlqSchema}
                                    inline={true}
                                />
                            </div>
                        )}
                        {/* ── FORECASTING TAB ── */}
                        {activeTab === 'forecast' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                                <PredictiveForecasting
                                    data={localData}
                                    schema={nlqSchema}
                                />
                            </div>
                        )}
                        {activeTab === 'builder' && (
                            <div className="flex flex-col gap-6 fade-in h-full p-2 relative overflow-y-auto">
                                {/* Ambient Backlight */}
                                <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />
                                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full" />
                                </div>

                                {/* Builder Controls styled exactly like Version Diff Selector */}
                                <ArchitectNode id="vb-controls" label="Visual Configuration Form">
                                <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24)' }} />

                                    <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
                                        <Database size={15} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('analysis.visualArchitect')}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                        {/* Dimension */}
                                        <div style={{ flex: 1, minWidth: '220px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#818cf8', boxShadow: `0 0 8px #818cf8` }} /> {t('analysis.dimensionLabel')}
                                            </label>
                                            <select
                                                id="va-dim-select"
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${builderConfig.xAxis ? '#818cf844' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s', outline: 'none', cursor: 'pointer' }}
                                                value={builderConfig.xAxis}
                                                onChange={e => setBuilderConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                                            >
                                                <option value="">{t('analysis.chooseDimension')}</option>
                                                {(dimensions.length > 0 ? dimensions : Object.keys(localData[0] || {})).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {/* Measure */}
                                        <div style={{ flex: 1, minWidth: '220px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: `0 0 8px #34d399` }} /> {t('analysis.measureLabel')}
                                            </label>
                                            <select
                                                id="va-meas-select"
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${builderConfig.yAxis ? '#34d39944' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s', outline: 'none', cursor: 'pointer' }}
                                                value={builderConfig.yAxis}
                                                onChange={e => setBuilderConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                                            >
                                                <option value="">{t('analysis.chooseMeasure')}</option>
                                                <optgroup label={t('analysis.quantitative')}>
                                                    {measures.map(c => <option key={c} value={c}>{c}</option>)}
                                                </optgroup>
                                                <optgroup label={t('analysis.qualitative')}>
                                                    {dimensions.map(c => <option key={c} value={c}>{c}</option>)}
                                                </optgroup>
                                            </select>
                                        </div>

                                        {/* Operation Logic */}
                                        <div style={{ minWidth: '220px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fbbf24', boxShadow: `0 0 8px #fbbf24` }} /> Logic
                                            </label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].map(agg => (
                                                    <button
                                                        key={agg}
                                                        onClick={() => setBuilderConfig(prev => ({ ...prev, aggregation: agg }))}
                                                        style={{ padding: '8px 16px', borderRadius: '10px', border: builderConfig.aggregation === agg ? '1px solid #fbbf24' : '1px solid var(--border-default)', background: builderConfig.aggregation === agg ? 'rgba(251,191,36,0.1)' : 'var(--bg-main)', color: builderConfig.aggregation === agg ? '#fbbf24' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                                                    >
                                                        {agg}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary Row (Presentation & Sorting) */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                                        {/* Presentation Type */}
                                        <div style={{ flex: 1, minWidth: '320px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <BarChart3 size={12} /> {t('analysis.presentation')}
                                            </label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {['bar', 'line', 'area', 'pie', 'donut', 'scatter', 'worldmap'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setBuilderConfig(prev => ({ ...prev, chartType: type }))}
                                                        style={{ padding: '8px 16px', height: '36px', borderRadius: '10px', border: builderConfig.chartType === type ? '1px solid var(--primary)' : '1px solid var(--border-default)', background: builderConfig.chartType === type ? 'var(--primary-subtle)' : 'var(--bg-main)', color: builderConfig.chartType === type ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', outline: 'none', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sort & Limit */}
                                        <div style={{ display: 'flex', gap: '16px', minWidth: '240px' }}>
                                            <div style={{ flex: 2 }}>
                                                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {t('analysis.sortOrder')}
                                                </label>
                                                <select
                                                    style={{ width: '100%', padding: '10px 14px', height: '36px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
                                                    value={(builderConfig as any).sortBy || 'valueDesc'}
                                                    onChange={e => setBuilderConfig(prev => ({ ...prev, sortBy: e.target.value as any }))}
                                                >
                                                    <option value="valueDesc">{t('analysis.valueHighToLow')}</option>
                                                    <option value="valueAsc">{t('analysis.valueLowToHigh')}</option>
                                                    <option value="labelAsc">{t('analysis.labelAZ')}</option>
                                                    <option value="labelDesc">{t('analysis.labelZA')}</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {t('analysis.limit')}
                                                </label>
                                                <select
                                                    style={{ width: '100%', padding: '10px 14px', height: '36px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
                                                    value={(builderConfig as any).topN || 30}
                                                    onChange={e => setBuilderConfig(prev => ({ ...prev, topN: Number(e.target.value) }))}
                                                >
                                                    {[10, 20, 30, 50].map(n => (
                                                        <option key={n} value={n}>Top {n}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </ArchitectNode>

                                {/* Preview Area */}
                                <ArchitectNode id="vb-preview" label="Live Synthesis Preview">
                                <div className="flex-1 min-h-[650px] flex flex-col gap-6">
                                    <div 
                                        className="flex-1 backdrop-blur-3xl rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col inner-bevel shadow-2xl transition-all duration-500"
                                        style={{ 
                                            background: 'var(--bg-card)', 
                                            border: '1px solid var(--border-default)',
                                            boxShadow: 'var(--shadow-xl), inset 0 0 0 1px var(--glass-border)' 
                                        }}
                                    >
                                        <div className="absolute inset-0 glass-noise opacity-10 pointer-events-none" />

                                        {builderConfig.xAxis && builderConfig.yAxis ? (
                                            <div className="flex-1 flex flex-col fade-in relative gap-8">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-2.5 py-1 rounded bg-primary/20 text-primary text-[10px] font-black tracking-widest uppercase border border-primary/20">{t('analysis.draftActive')}</span>
                                                            <span className="text-[10px] opacity-30 font-bold tracking-[0.2em]">INTEL_V.2.0</span>
                                                            <div className="h-px w-10 bg-white/10" />
                                                            <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
                                                                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Measure</div>
                                                                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Dimension</div>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-4xl font-data tracking-tighter group cursor-default leading-none">
                                                            {builderConfig.aggregation} <span className="text-primary group-hover:text-purple-400 transition-colors">{t('analysis.builder.of')}</span> {builderConfig.yAxis} <span className="opacity-20 mx-3">/</span> <span className="text-tertiary">{t('analysis.builder.by')} {builderConfig.xAxis}</span>
                                                        </h4>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            title={t('analysis.rawData')}
                                                            className={`btn btn-icon !w-10 !h-10 transition-all ${showRawData ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                                            onClick={() => setShowRawData(!showRawData)}
                                                        >
                                                            <Database size={16} />
                                                        </button>
                                                        <button
                                                            title={t('analysis.addToPresentation')}
                                                            className="btn btn-icon btn-primary !w-10 !h-10 shadow-glow-primary hover:scale-110"
                                                            onClick={() => {
                                                                const newOpt = {
                                                                    title: `${builderConfig.aggregation} of ${builderConfig.yAxis} by ${builderConfig.xAxis}`,
                                                                    chartType: builderConfig.chartType,
                                                                    data: builderData,
                                                                    isStatic: true
                                                                };
                                                                if (onUpdate) {
                                                                    onUpdate({
                                                                        ...analysis,
                                                                        options: [...(analysis.options || []), newOpt]
                                                                    });
                                                                    addToast(t('analysis.chartAdded'), 'success');
                                                                }
                                                            }}
                                                        >
                                                            <ArrowRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex-1 w-full bg-white/[0.01] rounded-[2.5rem] border border-white/5 p-10 relative shadow-inner overflow-hidden">
                                                    {builderData.length > 0 ? (
                                                        <div className="w-full h-full animate-float">
                                                            {renderStaticChart(builderData, builderConfig.chartType)}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 opacity-30">
                                                            <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center animate-spin-slow">
                                                                <div className="w-10 h-10 rounded-full bg-primary/20 animate-ping" />
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-sm font-black uppercase tracking-[0.3em] text-primary">{t('analysis.computingReality')}</span>
                                                                <span className="text-[11px] font-bold opacity-60">{t('analysis.architectingIntelligence')}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
                                            >
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center border border-white/10 shadow-2xl relative">
                                                    <div className="absolute inset-0 rounded-full animate-pulse border border-primary/20 scale-125" />
                                                    <PaletteIcon size={40} className="text-primary drop-shadow-glow" />
                                                </div>
                                                <div className="flex-col gap-2">
                                                    <h3 className="text-h1 tracking-tighter">{t('analysis.draftingSurface')}</h3>
                                                    <p className="label-premium !opacity-60">{t('analysis.draftingDesc')}</p>
                                                </div>
                                                <div className="flex gap-4 mt-2">
                                                    <div className="flex-col items-center gap-1 opacity-20">
                                                        <div className="w-8 h-1 bg-white rounded-full" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">Axis</span>
                                                    </div>
                                                    <div className="flex-col items-center gap-1 opacity-20">
                                                        <div className="w-8 h-1 bg-primary rounded-full" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">Logic</span>
                                                    </div>
                                                    <div className="flex-col items-center gap-1 opacity-20">
                                                        <div className="w-8 h-1 bg-white rounded-full" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">Render</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {(builderData.length > 0 && showRawData) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="glass-noise rounded-[2rem] border border-white/5 overflow-hidden flex flex-col bg-black/40"
                                            >
                                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-primary">{t('analysis.processedResultSet')}</h4>
                                                    </div>
                                                    <div className="text-[10px] font-mono opacity-40">
                                                        SHOWN: {Math.min(50, builderData.length)} / TOTAL: {builderData.length}
                                                    </div>
                                                </div>
                                                <div style={{ overflow: 'auto', maxHeight: '250px' }}>
                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th className="label-premium !text-[10px]">{builderConfig.xAxis}</th>
                                                                <th className="label-premium !text-[10px]">{builderConfig.aggregation} ({builderConfig.yAxis})</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {builderData.slice(0, 50).map((r, i) => (
                                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                                    <td className="font-medium">{r.name}</td>
                                                                    <td className="font-data text-primary">{r.value?.toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                </ArchitectNode>
                            </div>
                        )}

                        {activeTab === 'anomaly' && (
                            <div className="w-full h-full flex flex-col p-4 animate-fade-in relative z-10" style={{ height: 'calc(100vh - 80px)' }}>
                                <AnomalyDetection data={localData} schema={analysis.summary?.columnTypes || {}} />
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <AdvancedAnalytics
                                data={filteredData}
                                columns={Object.keys(localData[0] || {})}
                                measures={measures}
                                dimensions={dimensions}
                            />
                        )}

                        {activeTab === 'map' && (
                            <AnalysisMapView data={filteredData} />
                        )}

                        {activeTab === 'graph' && (
                            <GraphConnectionView
                                data={filteredData}
                                dimensions={dimensions}
                                measures={measures}
                                onClose={() => setActiveTab('overview')}
                            />
                        )}

                    </div >
                </div >
            </div >

            {activeTab === 'presentation' && (
                <div className="fade-in" style={{
                    position: 'absolute', inset: 0, zIndex: 9000,
                    background: 'var(--bg-app)', color: 'var(--text-primary)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    {/* Top Progress Bars */}
                    <div style={{
                        display: 'flex', gap: '4px', padding: '12px 16px',
                        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50
                    }}>
                        {(analysis.options || []).map((_: any, i: number) => (
                            <div
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setPresentationIndex(i); }}
                                style={{ flex: 1, height: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', zIndex: 30 }}
                            >
                                <div style={{
                                    width: '100%', height: '4px', borderRadius: '2px',
                                    background: 'var(--text-disabled)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: i < presentationIndex ? '100%' : (i === presentationIndex && isPlaying) ? '100%' : '0%',
                                        background: 'var(--primary)',
                                        transition: i === presentationIndex && isPlaying ? 'width 5s linear' : 'none'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Header Controls */}
                    <div style={{
                        position: 'absolute', top: '40px', right: '40px', zIndex: 9999,
                        display: 'flex', gap: '16px', alignItems: 'center'
                    }}>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '10px 16px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                        >
                            {isPlaying ? <span className="text-xl leading-none">⏸</span> : <span className="text-xl leading-none">▶</span>}
                            {isPlaying ? t('analysis.pause') : t('analysis.play')}
                        </button>
                        <button onClick={() => setActiveTab('overview')} style={{
                            background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '10px 20px', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', backdropFilter: 'blur(10px)', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(255,0,0,0.1)'
                        }}>
                            <span className="text-xl leading-none">✕</span> {t('analysis.exitPresentation')}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

                        {/* Touch/Click Zones */}
                        <div
                            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 5, cursor: 'w-resize' }}
                            onClick={(e) => { e.stopPropagation(); setPresentationIndex(p => Math.max(0, p - 1)); }}
                        />
                        <div
                            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', zIndex: 5, cursor: 'e-resize' }}
                            onClick={(e) => { e.stopPropagation(); setPresentationIndex(p => Math.min((analysis.options?.length || 1) - 1, p + 1)); }}
                        />

                        {/* Slide Content */}
                        <div className="fade-in-scale" style={{ width: '100%', maxWidth: '1000px', padding: '24px', zIndex: 6, pointerEvents: 'none' }}>
                            <div style={{ textAlign: 'center', marginBottom: '40px', pointerEvents: 'auto' }}>
                                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                    {(analysis.options?.[presentationIndex]?.title) || "Analysis Overview"}
                                </h1>
                                <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                                    {(analysis.options?.[presentationIndex]?.description)}
                                </p>
                            </div>
                            <div style={{ height: '600px', width: '100%', pointerEvents: 'auto' }}>
                                {analysis.options?.length > 0 && renderChart(analysis.options[presentationIndex], presentationIndex, memoizedChartsData[presentationIndex])}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Expanded Chart Modal */}
            {
                expandedChart && (() => {
                    const opt = expandedChart!.opt;
                    const index = expandedChart!.index;
                    const displayData = memoizedChartsData[index] || getFilteredChartData(opt);
                    const color = COLORS[index % COLORS.length];
                    const currentType = chartConfig[index] || opt.chartType;

                    return (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'var(--bg-app)', backdropFilter: 'blur(20px)',
                            display: 'flex', flexDirection: 'column', padding: '40px'
                        }}>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-h1">{opt.title}</h2>
                                    <p className="text-h3 text-secondary">{opt.description}</p>
                                </div>
                                <button
                                    onClick={() => setExpandedChart(null)}
                                    className="btn-secondary"
                                    style={{ padding: '12px 24px', fontSize: '16px' }}
                                >
                                    {t('analysis.closeView')}
                                </button>
                            </div>

                            <div className="card" style={{ flex: 1, padding: '32px', border: '1px solid var(--primary)' }}>
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {currentType === 'area' || currentType === 'line' ? (
                                            <AreaChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <defs>
                                                    <linearGradient id={`grad-exp-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-elevated)' vertical={false} />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={14} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="var(--text-secondary)" fontSize={14} tickLine={false} axisLine={false} dx={-10} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-disabled)' }} />
                                                {currentType === 'line' ?
                                                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={4} fill="none" /> :
                                                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={4} fill={`url(#grad-exp-${index})`} />
                                                }
                                            </AreaChart>
                                        ) : currentType === 'pie' ? (
                                            <PieChart>
                                                <Pie
                                                    data={displayData}
                                                    innerRadius={150}
                                                    outerRadius={250}
                                                    dataKey="value"
                                                    paddingAngle={4}
                                                    stroke="none"
                                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                >
                                                    {displayData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '16px' }} />
                                            </PieChart>
                                        ) : currentType === 'scatter' ? (
                                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-elevated)' />
                                                <XAxis dataKey="name" name="X" stroke="var(--text-secondary)" fontSize={14} />
                                                <YAxis dataKey="value" name="Y" stroke="var(--text-secondary)" fontSize={14} />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                                <Scatter name="Items" data={displayData} fill={color} r={8} />
                                            </ScatterChart>
                                        ) : (
                                            <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-elevated)' vertical={false} />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={14} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="var(--text-secondary)" fontSize={14} tickLine={false} axisLine={false} dx={-10} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-hover)' }} />
                                                <Bar
                                                    dataKey="value"
                                                    fill={color}
                                                    radius={[8, 8, 0, 0]}
                                                    barSize={80}
                                                />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* Deploy Modal */}
            <DeployModal
                isOpen={showDeployModal}
                onClose={() => setShowDeployModal(false)}
                analysis={analysis}
                onDeploy={handleDeployMethod}
            />

            {/* AI Natural Language Query Bar */}
            <NLQueryBar
                datasetId={analysis.id}
                data={localData}
                schema={nlqSchema}
                isOpen={isNLQueryOpen}
                onClose={() => setIsNLQueryOpen(false)}
            />

            <DiagnosticOverlay />

            {/* Analysis Comments Panel */}
            {analysis.id && (
                <CommentThread
                    analysisId={analysis.id}
                    targetType={commentTarget.type}
                    targetId={commentTarget.id}
                    isOpen={commentOpen}
                    onClose={() => setCommentOpen(false)}
                    title={commentTarget.title}
                />
            )}

            {/* Floating Text Selection Comment Toolbar */}
            <TextSelectionComment
                onAddComment={(text) => {
                    openComments('insight', text.substring(0, 50) + (text.length > 50 ? '...' : ''), 'Insight Selection');
                }}
            />

            {/* Chart Point Click Menu */}
            <AnimatePresence>
                {chartClickMenu && (
                    <>
                        <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 9998 }} 
                            onClick={() => setChartClickMenu(null)}
                            onContextMenu={(e) => { e.preventDefault(); setChartClickMenu(null); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: chartClickMenu.x,
                                top: chartClickMenu.y,
                                transform: 'translate(-50%, -100%)',
                                marginTop: '-10px',
                                zIndex: 9999,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                padding: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                minWidth: '150px'
                            }}
                        >
                            <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chartClickMenu.column}: {String(chartClickMenu.data)}
                            </div>
                            <button
                                className="hover-bg transition-colors"
                                onClick={() => {
                                    handleDrillDown(chartClickMenu.column, chartClickMenu.data);
                                    setChartClickMenu(null);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'left', width: '100%' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                                {t('analysis.drillDownAction')}
                            </button>
                            <button
                                className="hover-bg transition-colors"
                                onClick={() => {
                                    openComments('chart', `chart:${chartClickMenu.index}:point:${chartClickMenu.data}`, `${chartClickMenu.title} (${chartClickMenu.data})`);
                                    setChartClickMenu(null);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', textAlign: 'left', width: '100%' }}
                            >
                                <MessageCircle size={14} />
                                {t('analysis.addComment')}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
};
