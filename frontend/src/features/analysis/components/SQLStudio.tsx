import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import alasql from 'alasql';
import {
    Play, Clock, Database, Table2, Columns3, Copy, Download,
    ChevronRight, ChevronDown, Search, Trash2, RotateCcw,
    Sparkles, AlertCircle, CheckCircle2, ArrowUpDown,
    Hash, Type, Calendar, ToggleLeft, FileDown, Loader2,
    Bookmark, BookmarkCheck, X, Info
} from 'lucide-react';

interface SQLStudioProps {
    data: any[];
    columns: string[];
    dimensions: string[];
    measures: string[];
    tableName?: string;
}

// SQL keyword list for basic highlighting
const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
    'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
    'OFFSET', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'FULL', 'CROSS', 'UNION', 'ALL', 'DISTINCT', 'COUNT', 'SUM',
    'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
    'TABLE', 'DROP', 'ALTER', 'ADD', 'ASC', 'DESC', 'TOP', 'EXISTS',
    'CAST', 'CONVERT', 'COALESCE', 'IFNULL', 'ROUND', 'ABS',
    'UPPER', 'LOWER', 'TRIM', 'LENGTH', 'SUBSTR', 'REPLACE',
    'WITH', 'RECURSIVE', 'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK',
    'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE'
];

const SQL_FUNCTIONS = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'ABS', 'UPPER',
    'LOWER', 'TRIM', 'LENGTH', 'SUBSTR', 'REPLACE', 'COALESCE',
    'IFNULL', 'CAST', 'CONVERT', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
    'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE'
];

interface QueryHistoryItem {
    id: number;
    query: string;
    timestamp: Date;
    duration: number;
    rowCount: number;
    success: boolean;
    error?: string;
    bookmarked?: boolean;
}

function detectColumnType(values: any[]): { type: string; icon: any } {
    const sample = values.filter(v => v != null && v !== '').slice(0, 50);
    if (sample.length === 0) return { type: 'unknown', icon: <Type size={12} /> };

    const numericCount = sample.filter(v => !isNaN(Number(v))).length;
    const dateCount = sample.filter(v => {
        if (typeof v !== 'string') return false;
        const d = new Date(v);
        return !isNaN(d.getTime()) && v.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
    }).length;
    const boolCount = sample.filter(v => typeof v === 'boolean' || ['true', 'false', '0', '1'].includes(String(v).toLowerCase())).length;

    if (dateCount > sample.length * 0.7) return { type: 'date', icon: <Calendar size={12} /> };
    if (boolCount > sample.length * 0.7) return { type: 'boolean', icon: <ToggleLeft size={12} /> };
    if (numericCount > sample.length * 0.7) return { type: 'number', icon: <Hash size={12} /> };
    return { type: 'text', icon: <Type size={12} /> };
}

export const SQLStudio = ({ data, columns, dimensions, measures, tableName }: SQLStudioProps) => {
    const TABLE_NAME = tableName || 'dataset';

    // Editor state
    const [queryText, setQueryText] = useState(`SELECT *\nFROM ${TABLE_NAME}\nLIMIT 100`);
    const [queryResult, setQueryResult] = useState<any[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    // Schema browser
    const [schemaOpen, setSchemaOpen] = useState(true);
    const [expandedTable, setExpandedTable] = useState(true);
    const [columnSearch, setColumnSearch] = useState('');

    // History
    const [history, setHistory] = useState<QueryHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Result state
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [resultPage, setResultPage] = useState(0);
    const [resultPageSize] = useState(100);
    const [resultSearch, setResultSearch] = useState('');

    // Editor ref
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const lineCountRef = useRef<HTMLDivElement>(null);

    // Preset queries
    const presets = useMemo(() => [
        { label: 'All Data', query: `SELECT *\nFROM ${TABLE_NAME}\nLIMIT 100` },
        { label: 'Row Count', query: `SELECT COUNT(*) AS total_rows\nFROM ${TABLE_NAME}` },
        ...(measures.length > 0 ? [
            { label: 'Summary Stats', query: `SELECT\n${measures.map(m => `  ROUND(AVG([${m}]), 2) AS avg_${m.replace(/\s+/g, '_')},\n  MIN([${m}]) AS min_${m.replace(/\s+/g, '_')},\n  MAX([${m}]) AS max_${m.replace(/\s+/g, '_')}`).join(',\n')}\nFROM ${TABLE_NAME}` }
        ] : []),
        ...(dimensions.length > 0 && measures.length > 0 ? [
            { label: 'Group By', query: `SELECT [${dimensions[0]}],\n  COUNT(*) AS count,\n  ROUND(SUM([${measures[0]}]), 2) AS total_${measures[0].replace(/\s+/g, '_')}\nFROM ${TABLE_NAME}\nGROUP BY [${dimensions[0]}]\nORDER BY count DESC` },
            { label: 'Top 10', query: `SELECT *\nFROM ${TABLE_NAME}\nORDER BY [${measures[0]}] DESC\nLIMIT 10` }
        ] : []),
        ...(dimensions.length > 0 ? [
            { label: 'Distinct Values', query: `SELECT DISTINCT [${dimensions[0]}], COUNT(*) AS frequency\nFROM ${TABLE_NAME}\nGROUP BY [${dimensions[0]}]\nORDER BY frequency DESC` }
        ] : [])
    ], [TABLE_NAME, dimensions, measures]);

    // Column metadata
    const columnMeta = useMemo(() => {
        if (!data || data.length === 0) return [];
        return columns.map(col => {
            const values = data.map(r => r[col]);
            const { type, icon } = detectColumnType(values);
            const nullCount = values.filter(v => v == null || v === '').length;
            const uniqueCount = new Set(values.filter(v => v != null && v !== '')).size;
            return { name: col, type, icon, nullCount, uniqueCount, total: values.length };
        });
    }, [data, columns]);

    const filteredColumns = useMemo(() => {
        if (!columnSearch) return columnMeta;
        return columnMeta.filter(c => c.name.toLowerCase().includes(columnSearch.toLowerCase()));
    }, [columnMeta, columnSearch]);

    // Sync scroll for editor and highlight
    const syncScroll = useCallback(() => {
        if (editorRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = editorRef.current.scrollTop;
            highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
        }
        if (editorRef.current && lineCountRef.current) {
            lineCountRef.current.scrollTop = editorRef.current.scrollTop;
        }
    }, []);

    // Syntax highlight
    const highlightSQL = useCallback((sql: string): string => {
        let html = sql
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Strings
        html = html.replace(/'([^']*)'/g, '<span style="color:#e5c07b">\'$1\'</span>');

        // Numbers
        html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');

        // Functions
        const funcPattern = new RegExp(`\\b(${SQL_FUNCTIONS.join('|')})\\s*\\(`, 'gi');
        html = html.replace(funcPattern, (match, fn) => `<span style="color:#61afef">${fn}</span>(`);

        // Keywords
        const kwPattern = new RegExp(`\\b(${SQL_KEYWORDS.join('|')})\\b`, 'gi');
        html = html.replace(kwPattern, (match) => `<span style="color:#c678dd;font-weight:700">${match.toUpperCase()}</span>`);

        // Table name
        html = html.replace(new RegExp(`\\b(${TABLE_NAME})\\b`, 'gi'),
            `<span style="color:#98c379">${TABLE_NAME}</span>`);

        // Column refs in brackets
        html = html.replace(/\[([^\]]+)\]/g, '<span style="color:#56b6c2">[$1]</span>');

        // Comments
        html = html.replace(/(--.*$)/gm, '<span style="color:#5c6370;font-style:italic">$1</span>');

        return html;
    }, [TABLE_NAME]);

    const lineCount = queryText.split('\n').length;

    // Run query
    const runQuery = useCallback(async () => {
        if (!queryText.trim()) return;
        setIsRunning(true);
        setQueryError(null);
        setResultPage(0);
        setSortColumn(null);

        const start = performance.now();

        try {
            // Register data as a table
            alasql(`DROP TABLE IF EXISTS ${TABLE_NAME}`);
            alasql(`CREATE TABLE ${TABLE_NAME}`);
            alasql.tables[TABLE_NAME].data = [...data];

            const result = alasql(queryText);
            const duration = performance.now() - start;

            setExecutionTime(duration);

            if (Array.isArray(result) && result.length > 0) {
                setQueryResult(result);
            } else if (Array.isArray(result) && result.length === 0) {
                setQueryResult([]);
            } else {
                setQueryResult([{ result: JSON.stringify(result) }]);
            }

            setHistory(prev => [{
                id: Date.now(),
                query: queryText,
                timestamp: new Date(),
                duration,
                rowCount: Array.isArray(result) ? result.length : 1,
                success: true
            }, ...prev].slice(0, 50));
        } catch (err: any) {
            const duration = performance.now() - start;
            setQueryError(err.message || 'Query execution failed');
            setQueryResult([]);
            setExecutionTime(duration);

            setHistory(prev => [{
                id: Date.now(),
                query: queryText,
                timestamp: new Date(),
                duration,
                rowCount: 0,
                success: false,
                error: err.message
            }, ...prev].slice(0, 50));
        } finally {
            setIsRunning(false);
        }
    }, [queryText, data, TABLE_NAME]);

    // Keyboard shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                runQuery();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [runQuery]);

    // Sorted & filtered results
    const processedResults = useMemo(() => {
        let results = [...queryResult];

        if (resultSearch) {
            results = results.filter(r =>
                Object.values(r).some(v => String(v).toLowerCase().includes(resultSearch.toLowerCase()))
            );
        }

        if (sortColumn) {
            results.sort((a, b) => {
                const av = a[sortColumn];
                const bv = b[sortColumn];
                if (av == null) return 1;
                if (bv == null) return -1;
                const numA = Number(av);
                const numB = Number(bv);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDirection === 'asc' ? numA - numB : numB - numA;
                }
                return sortDirection === 'asc'
                    ? String(av).localeCompare(String(bv))
                    : String(bv).localeCompare(String(av));
            });
        }

        return results;
    }, [queryResult, sortColumn, sortDirection, resultSearch]);

    const paginatedResults = processedResults.slice(resultPage * resultPageSize, (resultPage + 1) * resultPageSize);
    const totalPages = Math.ceil(processedResults.length / resultPageSize);

    // Export CSV
    const exportCSV = () => {
        if (processedResults.length === 0) return;
        const keys = Object.keys(processedResults[0]);
        const csv = [keys.join(','), ...processedResults.map(r => keys.map(k => {
            const v = String(r[k] ?? '');
            return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        }).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'query_results.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // Copy to clipboard
    const copyResults = () => {
        if (processedResults.length === 0) return;
        const keys = Object.keys(processedResults[0]);
        const text = [keys.join('\t'), ...processedResults.map(r => keys.map(k => String(r[k] ?? '')).join('\t'))].join('\n');
        navigator.clipboard.writeText(text);
    };

    const toggleBookmark = (id: number) => {
        setHistory(prev => prev.map(h => h.id === id ? { ...h, bookmarked: !h.bookmarked } : h));
    };

    return (
        <div className="flex fade-in" style={{ height: '100%', minHeight: '85vh', gap: 0 }}>

            {/* ── Schema Browser Sidebar ── */}
            <AnimatePresence>
                {schemaOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            borderRight: '1px solid var(--border-default)',
                            background: 'var(--bg-surface-hover)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            flexShrink: 0,
                            borderRadius: '16px 0 0 16px'
                        }}
                    >
                        {/* Schema Header */}
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid var(--border-default)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={14} style={{ color: '#34d399' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                                    Schema
                                </span>
                            </div>
                            <button
                                onClick={() => setSchemaOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Column Search */}
                        <div style={{ padding: '8px 12px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'var(--bg-surface-hover)', borderRadius: '8px',
                                padding: '6px 10px', border: '1px solid var(--border-default)'
                            }}>
                                <Search size={12} style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Filter columns..."
                                    value={columnSearch}
                                    onChange={e => setColumnSearch(e.target.value)}
                                    style={{
                                        background: 'transparent', border: 'none', outline: 'none',
                                        color: 'var(--text-primary)', fontSize: '11px', width: '100%',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Table Tree */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
                            {/* Table node */}
                            <div>
                                <button
                                    onClick={() => setExpandedTable(!expandedTable)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 8px', background: 'none', border: 'none',
                                        color: '#e5c07b', cursor: 'pointer', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                                        textAlign: 'left'
                                    }}
                                    className="hover:bg-white/5"
                                >
                                    {expandedTable ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    <Table2 size={12} />
                                    <span>{TABLE_NAME}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 400 }}>
                                        {data.length} rows
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {expandedTable && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', paddingLeft: '16px' }}
                                        >
                                            {filteredColumns.map((col, i) => (
                                                <button
                                                    key={col.name}
                                                    onClick={() => {
                                                        // Insert column name at cursor
                                                        if (editorRef.current) {
                                                            const pos = editorRef.current.selectionStart;
                                                            const before = queryText.substring(0, pos);
                                                            const after = queryText.substring(pos);
                                                            setQueryText(before + `[${col.name}]` + after);
                                                            setTimeout(() => {
                                                                editorRef.current?.focus();
                                                                const newPos = pos + col.name.length + 2;
                                                                editorRef.current?.setSelectionRange(newPos, newPos);
                                                            }, 0);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                                                        padding: '4px 8px', background: 'none', border: 'none',
                                                        color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px',
                                                        fontSize: '11px', fontFamily: 'monospace', textAlign: 'left'
                                                    }}
                                                    className="hover:bg-white/5 hover:text-white group"
                                                    title={`${col.type} · ${col.uniqueCount} unique · ${col.nullCount} nulls`}
                                                >
                                                    <span style={{
                                                        color: col.type === 'number' ? '#61afef' :
                                                            col.type === 'date' ? '#e5c07b' :
                                                                col.type === 'boolean' ? '#c678dd' : '#98c379',
                                                        flexShrink: 0
                                                    }}>
                                                        {col.icon}
                                                    </span>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-disabled)', flexShrink: 0 }}>
                                                        {col.type}
                                                    </span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Info Box */}
                            <div style={{
                                margin: '16px 4px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'rgba(52, 211, 153, 0.05)',
                                border: '1px solid rgba(52, 211, 153, 0.1)',
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                lineHeight: 1.5
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                                    <Info size={10} /> Quick Tips
                                </div>
                                <div>Click any column to insert it at the cursor position. Use <code style={{ color: '#61afef' }}>⌘+Enter</code> to run queries.</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* ── Toolbar ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    flexShrink: 0
                }}>
                    {!schemaOpen && (
                        <button
                            onClick={() => setSchemaOpen(true)}
                            style={{
                                padding: '6px 10px', borderRadius: '8px',
                                background: 'var(--bg-surface-hover)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-muted)', cursor: 'pointer',
                                fontSize: '10px', fontWeight: 700, display: 'flex',
                                alignItems: 'center', gap: '4px'
                            }}
                        >
                            <Database size={12} /> Schema
                        </button>
                    )}

                    <button
                        onClick={runQuery}
                        disabled={isRunning || !queryText.trim()}
                        style={{
                            padding: '6px 16px', borderRadius: '8px',
                            background: isRunning ? 'rgba(52, 211, 153, 0.1)' : 'linear-gradient(135deg, #34d399, #059669)',
                            border: 'none',
                            color: 'var(--text-primary)', cursor: isRunning ? 'wait' : 'pointer',
                            fontSize: '11px', fontWeight: 800, display: 'flex',
                            alignItems: 'center', gap: '6px',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            boxShadow: isRunning ? 'none' : '0 2px 12px rgba(52, 211, 153, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                        {isRunning ? 'Running...' : 'Execute'}
                    </button>

                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ⌘+Enter
                    </span>

                    <div style={{ flex: 1 }} />

                    {/* Preset Queries */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-disabled)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>
                            Templates:
                        </span>
                        {presets.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setQueryText(p.query)}
                                style={{
                                    padding: '3px 8px', borderRadius: '6px',
                                    background: 'var(--bg-surface-hover)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    fontSize: '10px', fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                                className="hover:bg-white/10 hover:text-white"
                            >
                                <Sparkles size={9} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }} />

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{
                            padding: '6px 10px', borderRadius: '8px',
                            background: showHistory ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-hover)',
                            border: `1px solid ${showHistory ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-default)'}`,
                            color: showHistory ? '#818cf8' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Clock size={12} /> History {history.length > 0 && `(${history.length})`}
                    </button>
                </div>

                {/* ── Editor & History Split ── */}
                <div style={{ display: 'flex', flexShrink: 0 }}>
                    {/* Editor Area */}
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '220px',
                        borderBottom: '1px solid var(--border-default)',
                        background: '#1a1b26'
                    }}>
                        {/* Line Numbers */}
                        <div
                            ref={lineCountRef}
                            style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '44px',
                                borderRight: '1px solid var(--border-default)',
                                background: 'var(--bg-surface-hover)',
                                overflow: 'hidden', userSelect: 'none',
                                padding: '16px 0', zIndex: 2
                            }}
                        >
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} style={{
                                    height: '20px', lineHeight: '20px',
                                    textAlign: 'right', paddingRight: '10px',
                                    fontSize: '11px', fontFamily: 'monospace',
                                    color: 'var(--text-disabled)'
                                }}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Syntax Highlight Overlay */}
                        <pre
                            ref={highlightRef}
                            aria-hidden="true"
                            style={{
                                position: 'absolute', left: '44px', top: 0, right: 0, bottom: 0,
                                padding: '16px', margin: 0,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                                fontSize: '13px', lineHeight: '20px',
                                color: 'var(--text-primary)',
                                overflow: 'auto',
                                pointerEvents: 'none',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                zIndex: 1
                            }}
                            dangerouslySetInnerHTML={{ __html: highlightSQL(queryText) + '\n' }}
                        />

                        {/* Actual Textarea */}
                        <textarea
                            ref={editorRef}
                            value={queryText}
                            onChange={e => setQueryText(e.target.value)}
                            onScroll={syncScroll}
                            spellCheck={false}
                            style={{
                                position: 'absolute', left: '44px', top: 0, right: 0, bottom: 0,
                                padding: '16px', margin: 0,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                                fontSize: '13px', lineHeight: '20px',
                                color: 'transparent',
                                caretColor: '#34d399',
                                background: 'transparent',
                                border: 'none', outline: 'none',
                                resize: 'none',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                zIndex: 2
                            }}
                        />
                    </div>

                    {/* History Panel */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                style={{
                                    height: '220px',
                                    borderLeft: '1px solid var(--border-default)',
                                    borderBottom: '1px solid var(--border-default)',
                                    background: 'var(--bg-surface-hover)',
                                    display: 'flex', flexDirection: 'column',
                                    overflow: 'hidden', flexShrink: 0
                                }}
                            >
                                <div style={{
                                    padding: '10px 12px',
                                    borderBottom: '1px solid var(--border-default)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                                        Query History
                                    </span>
                                    {history.length > 0 && (
                                        <button
                                            onClick={() => setHistory([])}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                        >
                                            <Trash2 size={10} /> Clear
                                        </button>
                                    )}
                                </div>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    {history.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '11px' }}>
                                            No queries yet. Execute a query to see history.
                                        </div>
                                    ) : (
                                        history.map(h => (
                                            <div
                                                key={h.id}
                                                onClick={() => setQueryText(h.query)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderBottom: '1px solid var(--border-subtle)',
                                                    cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', gap: '3px',
                                                    transition: 'background 0.15s'
                                                }}
                                                className="hover:bg-white/5"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {h.success ? (
                                                        <CheckCircle2 size={10} style={{ color: '#34d399', flexShrink: 0 }} />
                                                    ) : (
                                                        <AlertCircle size={10} style={{ color: '#ef4444', flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: '10px', fontFamily: 'monospace',
                                                        color: 'var(--text-secondary)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap', flex: 1
                                                    }}>
                                                        {h.query.replace(/\n/g, ' ').substring(0, 50)}
                                                    </span>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleBookmark(h.id); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: h.bookmarked ? '#e5c07b' : 'var(--text-disabled)', padding: '2px' }}
                                                    >
                                                        {h.bookmarked ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
                                                    <span>{h.timestamp.toLocaleTimeString()}</span>
                                                    <span>{h.duration.toFixed(0)}ms</span>
                                                    <span>{h.rowCount} rows</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Status Bar ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '6px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    background: queryError ? 'rgba(239, 68, 68, 0.05)' : executionTime != null ? 'rgba(52, 211, 153, 0.03)' : 'transparent',
                    flexShrink: 0
                }}>
                    {queryError ? (
                        <>
                            <AlertCircle size={13} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '11px', color: '#ef4444', fontFamily: 'monospace', flex: 1 }}>
                                {queryError}
                            </span>
                        </>
                    ) : executionTime != null ? (
                        <>
                            <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                            <span style={{ fontSize: '11px', color: '#34d399', fontFamily: 'monospace' }}>
                                Query completed successfully
                            </span>
                            <div style={{ flex: 1 }} />
                            <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                <span>⏱ {executionTime.toFixed(1)}ms</span>
                                <span>📊 {processedResults.length.toLocaleString()} rows</span>
                                <span>📋 {queryResult.length > 0 ? Object.keys(queryResult[0]).length : 0} columns</span>
                            </div>
                        </>
                    ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ready — Write your SQL and press Execute or ⌘+Enter
                        </span>
                    )}
                </div>

                {/* ── Results Area ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {queryResult.length > 0 ? (
                        <>
                            {/* Results Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 16px',
                                borderBottom: '1px solid var(--border-default)',
                                background: 'var(--bg-surface)',
                                flexShrink: 0
                            }}>
                                <Columns3 size={14} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Result Set
                                </span>

                                <div style={{ flex: 1 }} />

                                {/* Result search */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'var(--bg-surface-hover)', borderRadius: '6px',
                                    padding: '4px 8px', border: '1px solid var(--border-default)'
                                }}>
                                    <Search size={11} style={{ color: 'var(--text-disabled)' }} />
                                    <input
                                        type="text"
                                        placeholder="Filter results..."
                                        value={resultSearch}
                                        onChange={e => setResultSearch(e.target.value)}
                                        style={{
                                            background: 'transparent', border: 'none', outline: 'none',
                                            color: 'var(--text-primary)', fontSize: '11px', width: '140px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                </div>

                                {/* Action buttons */}
                                <button
                                    onClick={copyResults}
                                    style={{
                                        padding: '4px 8px', borderRadius: '6px',
                                        background: 'var(--bg-surface-hover)',
                                        border: '1px solid var(--border-default)',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px'
                                    }}
                                    className="hover:bg-white/10"
                                    title="Copy to clipboard"
                                >
                                    <Copy size={11} /> Copy
                                </button>
                                <button
                                    onClick={exportCSV}
                                    style={{
                                        padding: '4px 8px', borderRadius: '6px',
                                        background: 'var(--bg-surface-hover)',
                                        border: '1px solid var(--border-default)',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px'
                                    }}
                                    className="hover:bg-white/10"
                                    title="Export as CSV"
                                >
                                    <FileDown size={11} /> CSV
                                </button>
                            </div>

                            {/* Results Table */}
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            {Object.keys(queryResult[0]).map(col => (
                                                <th
                                                    key={col}
                                                    onClick={() => {
                                                        if (sortColumn === col) {
                                                            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setSortColumn(col);
                                                            setSortDirection('asc');
                                                        }
                                                    }}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: '8px 16px',
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        color: sortColumn === col ? '#34d399' : 'var(--text-muted)',
                                                        background: 'var(--bg-elevated)',
                                                        borderBottom: '1px solid var(--border-default)',
                                                        whiteSpace: 'nowrap',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        fontFamily: 'monospace'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {col}
                                                        {sortColumn === col ? (
                                                            <span style={{ fontSize: '8px' }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                                        ) : (
                                                            <ArrowUpDown size={9} style={{ opacity: 0.3 }} />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedResults.map((row, i) => (
                                            <tr
                                                key={i}
                                                style={{ transition: 'background 0.15s' }}
                                                className="hover:bg-white/[0.02]"
                                            >
                                                {Object.keys(queryResult[0]).map((col, j) => {
                                                    const val = row[col];
                                                    const isNum = typeof val === 'number' || (!isNaN(Number(val)) && val !== null && val !== '');
                                                    return (
                                                        <td
                                                            key={j}
                                                            style={{
                                                                padding: '6px 16px',
                                                                fontSize: '12px',
                                                                fontFamily: isNum ? "'JetBrains Mono', monospace" : 'inherit',
                                                                color: val === null || val === '' ? 'var(--text-disabled)' :
                                                                    isNum ? '#61afef' : 'var(--text-secondary)',
                                                                borderBottom: '1px solid var(--border-default)',
                                                                maxWidth: '300px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                fontStyle: (val === null || val === '') ? 'italic' : 'normal'
                                                            }}
                                                        >
                                                            {val === null || val === '' ? 'NULL' : String(val)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '8px 16px',
                                    borderTop: '1px solid var(--border-default)',
                                    background: 'var(--bg-surface)',
                                    flexShrink: 0
                                }}>
                                    <button
                                        onClick={() => setResultPage(p => Math.max(0, p - 1))}
                                        disabled={resultPage === 0}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px',
                                            background: 'var(--bg-surface-hover)',
                                            border: '1px solid var(--border-default)',
                                            color: resultPage === 0 ? 'var(--text-disabled)' : 'var(--text-muted)',
                                            cursor: resultPage === 0 ? 'default' : 'pointer',
                                            fontSize: '10px', fontWeight: 700
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                        Page {resultPage + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setResultPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={resultPage >= totalPages - 1}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px',
                                            background: 'var(--bg-surface-hover)',
                                            border: '1px solid var(--border-default)',
                                            color: resultPage >= totalPages - 1 ? 'var(--text-disabled)' : 'var(--text-muted)',
                                            cursor: resultPage >= totalPages - 1 ? 'default' : 'pointer',
                                            fontSize: '10px', fontWeight: 700
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '16px', opacity: 0.3
                        }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(99, 102, 241, 0.1))',
                                border: '1px solid var(--border-default)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Database size={28} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>No Results Yet</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Write a SQL query above and click Execute to see results
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
