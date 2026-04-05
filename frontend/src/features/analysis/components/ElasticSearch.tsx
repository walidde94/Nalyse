import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Calendar, ChevronDown, RefreshCw, Hash, Type, Columns, Zap, ArrowRight, Star, Clock, Trash2, Bookmark, Save, X } from 'lucide-react';
import { TimePicker } from './TimePicker';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Saved Queries Storage ─── */
interface SavedQuery {
    id: string;
    name: string;
    query: string;
    starred: boolean;
    createdAt: number;
}

const STORAGE_KEY_SAVED = 'nalyse_saved_queries';
const STORAGE_KEY_HISTORY = 'nalyse_query_history';
const MAX_HISTORY = 20;

function loadSavedQueries(): SavedQuery[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]'); } catch { return []; }
}
function persistSavedQueries(queries: SavedQuery[]) {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(queries));
}
function loadHistory(): string[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]'); } catch { return []; }
}
function persistHistory(history: string[]) {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

/* ─── Types ─── */
interface ElasticSearchProps {
    onSearch: (query: string) => void;
    onTimeRangeChange: (range: { start: string | null; end: string | null; label: string }) => void;
    placeholder?: string;
    initialQuery?: string;
    onRefresh?: () => void;
    dimensions?: string[];
    measures?: string[];
    sampleData?: any[];
}

type SuggestionKind = 'field' | 'operator' | 'value' | 'keyword';

interface Suggestion {
    kind: SuggestionKind;
    label: string;
    description?: string;
    fieldType?: 'dimension' | 'measure';
    icon?: React.ReactNode;
    insertText: string;
}

/* ─── Helpers ─── */
const OPERATORS = [
    { label: ':', description: 'equals / contains', insertText: ':' },
    { label: '>', description: 'greater than', insertText: '>' },
    { label: '<', description: 'less than', insertText: '<' },
    { label: '>=', description: 'greater or equal', insertText: '>=' },
    { label: '<=', description: 'less or equal', insertText: '<=' },
];

const KEYWORDS: Suggestion[] = [
    { kind: 'keyword', label: 'AND', description: 'Combine conditions', insertText: ' AND ', icon: <Zap size={12} /> },
];

function getUniqueValues(data: any[], field: string, limit = 12): string[] {
    const seen = new Set<string>();
    for (const row of data) {
        const val = row[field];
        if (val !== null && val !== undefined && val !== '') {
            seen.add(String(val));
            if (seen.size >= limit) break;
        }
    }
    return Array.from(seen).sort();
}

/* ─── Parse cursor context ─── */
function parseCursorContext(query: string, cursorPos: number) {
    const textBefore = query.slice(0, cursorPos);

    // Split by AND to get the current clause
    const clauses = textBefore.split(/\s+AND\s+/i);
    const currentClause = (clauses[clauses.length - 1] || '').trimStart();

    // Check if we just finished typing AND and need a new field
    if (/\s+AND\s*$/i.test(textBefore)) {
        return { phase: 'field' as const, partial: '', field: null, operator: null };
    }

    // Match field:value or field>value patterns
    const opMatch = currentClause.match(/^([a-zA-Z0-9_\s.]+?)\s*(:|>=|<=|>|<|=)\s*(.*?)$/);
    if (opMatch) {
        const [, field, op, valuePartial] = opMatch;
        return { phase: 'value' as const, partial: valuePartial.trim(), field: field.trim(), operator: op };
    }

    // Match field with trailing space (operator phase)
    const fieldWithSpace = currentClause.match(/^([a-zA-Z0-9_\s.]+?)\s+$/);
    if (fieldWithSpace) {
        return { phase: 'operator' as const, partial: '', field: fieldWithSpace[1].trim(), operator: null };
    }

    // Currently typing a field name
    return { phase: 'field' as const, partial: currentClause.trim(), field: null, operator: null };
}


export const ElasticSearch = ({
    onSearch,
    onTimeRangeChange,
    placeholder = "Filter... (e.g. status:error AND revenue > 500)",
    initialQuery = '',
    onRefresh,
    dimensions = [],
    measures = [],
    sampleData = [],
}: ElasticSearchProps) => {
    const [query, setQuery] = useState(initialQuery);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeLabel, setTimeLabel] = useState('Last 15 minutes');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState(0);

    // ═══ Saved Queries & History State ═══
    const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(loadSavedQueries);
    const [queryHistory, setQueryHistory] = useState<string[]>(loadHistory);
    const [showSavedPanel, setShowSavedPanel] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveQueryName, setSaveQueryName] = useState('');
    const [savedPanelTab, setSavedPanelTab] = useState<'history' | 'saved'>('history');

    const addToHistory = useCallback((q: string) => {
        if (!q.trim()) return;
        setQueryHistory(prev => {
            const filtered = prev.filter(h => h !== q);
            const updated = [q, ...filtered].slice(0, MAX_HISTORY);
            persistHistory(updated);
            return updated;
        });
    }, []);

    const handleSaveQuery = useCallback(() => {
        if (!query.trim() || !saveQueryName.trim()) return;
        const newQuery: SavedQuery = {
            id: `sq_${Date.now()}`,
            name: saveQueryName.trim(),
            query: query.trim(),
            starred: false,
            createdAt: Date.now(),
        };
        setSavedQueries(prev => {
            const updated = [newQuery, ...prev];
            persistSavedQueries(updated);
            return updated;
        });
        setShowSaveDialog(false);
        setSaveQueryName('');
    }, [query, saveQueryName]);

    const toggleStarQuery = useCallback((id: string) => {
        setSavedQueries(prev => {
            const updated = prev.map(q => q.id === id ? { ...q, starred: !q.starred } : q);
            persistSavedQueries(updated);
            return updated;
        });
    }, []);

    const deleteSavedQuery = useCallback((id: string) => {
        setSavedQueries(prev => {
            const updated = prev.filter(q => q.id !== id);
            persistSavedQueries(updated);
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setQueryHistory([]);
        persistHistory([]);
    }, []);

    const applySavedQuery = useCallback((q: string) => {
        setQuery(q);
        setShowSavedPanel(false);
        setShowSuggestions(false);
        onSearch(q);
        addToHistory(q);
    }, [onSearch, addToHistory]);

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                setShowSavedPanel(false);
                setShowSaveDialog(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // All available fields
    const allFields = useMemo(() => [
        ...dimensions.map(d => ({ name: d, type: 'dimension' as const })),
        ...measures.map(m => ({ name: m, type: 'measure' as const })),
    ], [dimensions, measures]);

    // Build suggestions based on cursor context
    const suggestions = useMemo((): Suggestion[] => {
        if (!showSuggestions) return [];
        if (allFields.length === 0) return [];

        const ctx = parseCursorContext(query, cursorPos);

        switch (ctx.phase) {
            case 'field': {
                const partial = ctx.partial.toLowerCase();
                const fieldSuggestions = allFields
                    .filter(f => !partial || f.name.toLowerCase().includes(partial))
                    .slice(0, 15)
                    .map(f => ({
                        kind: 'field' as const,
                        label: f.name,
                        description: f.type === 'dimension' ? 'Text / Category' : 'Numeric / Measure',
                        fieldType: f.type,
                        icon: f.type === 'dimension'
                            ? <Type size={12} />
                            : <Hash size={12} />,
                        insertText: f.name,
                    }));

                // Also suggest AND keyword if we already have content
                if (ctx.partial === '' && query.trim().length > 0) {
                    return [...KEYWORDS, ...fieldSuggestions];
                }

                // If partial matches AND
                if ('and'.startsWith(partial) && partial.length > 0 && query.trim().length > partial.length) {
                    return [...KEYWORDS.filter(k => k.label.toLowerCase().startsWith(partial)), ...fieldSuggestions];
                }

                return fieldSuggestions;
            }

            case 'operator': {
                return OPERATORS.map(op => ({
                    kind: 'operator' as const,
                    label: op.label,
                    description: op.description,
                    icon: <ArrowRight size={12} />,
                    insertText: op.insertText,
                }));
            }

            case 'value': {
                if (!ctx.field) return [];
                // Find the actual column name (case-insensitive)
                const col = allFields.find(f => f.name.toLowerCase() === ctx.field!.toLowerCase());
                if (!col) return [];

                const uniqueVals = getUniqueValues(sampleData, col.name, 20);
                const partial = (ctx.partial || '').toLowerCase();

                return uniqueVals
                    .filter(v => !partial || v.toLowerCase().includes(partial))
                    .slice(0, 12)
                    .map(v => ({
                        kind: 'value' as const,
                        label: v,
                        description: col.name,
                        icon: <Columns size={12} />,
                        insertText: v,
                    }));
            }

            default:
                return [];
        }
    }, [query, cursorPos, showSuggestions, allFields, sampleData]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(0);
    }, [suggestions.length]);

    // Scroll selected item into view
    useEffect(() => {
        if (suggestionsRef.current) {
            const item = suggestionsRef.current.children[selectedIndex] as HTMLElement;
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const applySuggestion = useCallback((suggestion: Suggestion) => {
        const ctx = parseCursorContext(query, cursorPos);

        let newQuery = '';

        switch (ctx.phase) {
            case 'field': {
                // Replace the partial text with the full field name
                const textBefore = query.slice(0, cursorPos);
                const textAfter = query.slice(cursorPos);

                // Find where current clause starts
                const lastAndIndex = textBefore.search(/\s+AND\s*$/i);
                const clauseStart = lastAndIndex >= 0
                    ? lastAndIndex + textBefore.slice(lastAndIndex).match(/\s+AND\s*/i)![0].length
                    : (() => {
                        // Find last AND boundary or start
                        const parts = textBefore.split(/(\s+AND\s+)/i);
                        let offset = 0;
                        for (let i = 0; i < parts.length - 1; i++) offset += parts[i].length;
                        return offset;
                    })();

                if (suggestion.kind === 'keyword') {
                    newQuery = textBefore.trimEnd() + suggestion.insertText + textAfter;
                } else {
                    newQuery = query.slice(0, clauseStart) + suggestion.insertText + textAfter;
                }
                break;
            }

            case 'operator': {
                newQuery = query.slice(0, cursorPos).trimEnd() + suggestion.insertText + query.slice(cursorPos);
                break;
            }

            case 'value': {
                const textBefore = query.slice(0, cursorPos);
                const textAfter = query.slice(cursorPos);

                // Find the operator position in current clause
                const clauses = textBefore.split(/\s+AND\s+/i);
                const currentClause = clauses[clauses.length - 1] || '';
                const opMatch = currentClause.match(/^([a-zA-Z0-9_\s.]+?)\s*(:|>=|<=|>|<|=)\s*/);

                if (opMatch) {
                    const beforeClause = textBefore.slice(0, textBefore.length - currentClause.length);
                    newQuery = beforeClause + opMatch[1].trim() + opMatch[2] + suggestion.insertText + textAfter;
                } else {
                    newQuery = textBefore + suggestion.insertText + textAfter;
                }
                break;
            }
        }

        setQuery(newQuery);

        // If a VALUE was selected, the filter expression is complete → auto-submit
        if (suggestion.kind === 'value') {
            setShowSuggestions(false);
            // Use setTimeout to ensure state update has propagated
            setTimeout(() => {
                onSearch(newQuery);
            }, 0);
        } else {
            setShowSuggestions(true);
            // Move cursor to end of inserted text
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const newPos = newQuery.length;
                    inputRef.current.setSelectionRange(newPos, newPos);
                    setCursorPos(newPos);
                }
            });
        }
    }, [query, cursorPos, onSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        setShowSavedPanel(false);
        onSearch(query);
        addToHistory(query);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                break;
            case 'Enter':
                if (suggestions[selectedIndex]) {
                    e.preventDefault();
                    applySuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Tab':
                if (suggestions[selectedIndex]) {
                    e.preventDefault();
                    applySuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowSuggestions(false);
                break;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setCursorPos(e.target.selectionStart || val.length);
        if (val.trim() === '') {
            setShowSuggestions(false);
            if (queryHistory.length > 0 || savedQueries.length > 0) setShowSavedPanel(true);
        } else {
            setShowSavedPanel(false);
            setShowSuggestions(true);
        }
    };

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        setCursorPos((e.target as HTMLInputElement).selectionStart || 0);
        if (allFields.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleInputFocus = () => {
        if (query.trim() === '' && (queryHistory.length > 0 || savedQueries.length > 0)) {
            setShowSavedPanel(true);
            setShowSuggestions(false);
        } else if (allFields.length > 0) {
            setCursorPos(inputRef.current?.selectionStart || query.length);
            setShowSuggestions(true);
        }
    };

    const handleTimeSelect = (range: { start: string | null; end: string | null; label: string }) => {
        setTimeLabel(range.label);
        onTimeRangeChange(range);
        setShowTimePicker(false);
    };

    const kindBadge = (kind: SuggestionKind, fieldType?: 'dimension' | 'measure') => {
        switch (kind) {
            case 'field':
                return fieldType === 'measure'
                    ? { text: 'MEASURE', color: 'var(--success)', bg: 'rgba(34,197,94,0.12)' }
                    : { text: 'FIELD', color: 'var(--primary)', bg: 'var(--primary-subtle)' };
            case 'operator':
                return { text: 'OPERATOR', color: 'var(--warning)', bg: 'rgba(234,179,8,0.12)' };
            case 'value':
                return { text: 'VALUE', color: 'var(--accent)', bg: 'rgba(139,92,246,0.12)' };
            case 'keyword':
                return { text: 'KEYWORD', color: 'var(--info)', bg: 'rgba(6,182,212,0.12)' };
        }
    };

    return (
        <div className="w-full relative z-40 px-6 py-2" style={{ background: 'transparent' }} ref={containerRef}>
            <div className="flex items-center gap-3 w-full">
                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="flex-1 relative"
                >
                    <div
                        className="flex items-center h-10 rounded-xl transition-all relative border overflow-hidden group/search focus-within:border-primary/50 shadow-sm"
                        style={{
                            background: 'var(--bg-main)',
                            borderColor: showSuggestions && suggestions.length > 0 ? 'var(--primary)' : 'var(--border-default)',
                            boxShadow: showSuggestions && suggestions.length > 0
                                ? '0 0 0 1px var(--primary), 0 4px 20px -4px var(--primary-glow)'
                                : 'inset 0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <div className="absolute inset-0 glass-noise opacity-20 pointer-events-none" />
                        <button
                            type="submit"
                            className="btn btn-ghost h-full px-3 flex items-center justify-center border-none rounded-none active-press"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Search size={16} className="group-focus-within/search:text-primary transition-colors" />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onClick={handleInputClick}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent border-none outline-none font-data text-sm h-full"
                            style={{ color: 'var(--text-primary)', caretColor: 'var(--primary)' }}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <div className="flex items-center gap-2 pr-3">
                            {/* Save Query Button */}
                            {query.trim() && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowSaveDialog(!showSaveDialog); }}
                                    title="Save this query"
                                    style={{
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', opacity: 0.5, padding: '2px',
                                        display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.color = 'var(--warning)'; }}
                                    onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0.5'; (e.target as HTMLElement).style.color = 'var(--text-muted)'; }}
                                >
                                    <Bookmark size={14} />
                                </button>
                            )}
                            {allFields.length > 0 && (
                                <span style={{
                                    fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em',
                                    color: 'var(--text-muted)', opacity: 0.4,
                                    fontFamily: 'var(--font-mono)',
                                }}>
                                    {allFields.length} FIELDS
                                </span>
                            )}
                            <kbd className="hidden lg:block label-premium opacity-20 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">⏎ ENTER</kbd>
                        </div>
                    </div>

                    {/* ═══ SUGGESTIONS DROPDOWN ═══ */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                ref={suggestionsRef}
                                className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-glow, var(--border-subtle))',
                                    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border-subtle)',
                                    backdropFilter: 'blur(20px)',
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    transformOrigin: 'top',
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    padding: '8px 12px 6px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <span style={{
                                        fontSize: '9px', fontWeight: 900, letterSpacing: '0.1em',
                                        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                    }}>
                                        {suggestions[0]?.kind === 'field' ? '◆ Available Fields' :
                                         suggestions[0]?.kind === 'operator' ? '◆ Select Operator' :
                                         suggestions[0]?.kind === 'value' ? '◆ Select Value' : '◆ Suggestions'}
                                    </span>
                                    <span style={{
                                        fontSize: '9px', color: 'var(--text-muted)', opacity: 0.4,
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                        ↑↓ Navigate · ⏎ Select · ESC Close
                                    </span>
                                </div>

                                {/* Items */}
                                {suggestions.map((s, i) => {
                                    const badge = kindBadge(s.kind, s.fieldType);
                                    const isSelected = i === selectedIndex;
                                    return (
                                        <div
                                            key={`${s.kind}-${s.label}-${i}`}
                                            onClick={() => applySuggestion(s)}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                                                borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                                                transition: 'all 0.1s ease',
                                            }}
                                        >
                                            {/* Icon */}
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                                                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                                color: isSelected ? '#fff' : 'var(--text-muted)',
                                                flexShrink: 0,
                                                transition: 'all 0.15s ease',
                                            }}>
                                                {s.icon}
                                            </div>

                                            {/* Label */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '13px', fontWeight: 600,
                                                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    fontFamily: s.kind === 'operator' ? 'var(--font-mono)' : 'inherit',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {s.label}
                                                </div>
                                                {s.description && (
                                                    <div style={{
                                                        fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6,
                                                        marginTop: '1px',
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    }}>
                                                        {s.description}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Type Badge */}
                                            <span style={{
                                                fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em',
                                                padding: '2px 6px', borderRadius: '4px',
                                                background: badge.bg, color: badge.color,
                                                fontFamily: 'var(--font-mono)',
                                                flexShrink: 0,
                                            }}>
                                                {badge.text}
                                            </span>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ SAVE QUERY DIALOG ═══ */}
                    <AnimatePresence>
                        {showSaveDialog && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-glow, var(--border-subtle))',
                                    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(20px)',
                                    zIndex: 101, padding: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Save size={14} style={{ color: 'var(--warning)' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Save Query</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        autoFocus
                                        value={saveQueryName}
                                        onChange={e => setSaveQueryName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveQuery(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                                        placeholder="Query name (e.g. High-value Errors)"
                                        style={{
                                            flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border-default)',
                                            padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)',
                                            fontSize: '12px', outline: 'none',
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveQuery}
                                        disabled={!saveQueryName.trim()}
                                        style={{
                                            background: 'var(--primary)', border: 'none', padding: '8px 16px',
                                            borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 700,
                                            cursor: 'pointer', opacity: saveQueryName.trim() ? 1 : 0.4,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >Save</button>
                                    <button
                                        onClick={() => setShowSaveDialog(false)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                    ><X size={16} /></button>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                                    {query.length > 60 ? query.substring(0, 60) + '...' : query}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ SAVED QUERIES & HISTORY PANEL ═══ */}
                    <AnimatePresence>
                        {showSavedPanel && !showSuggestions && (queryHistory.length > 0 || savedQueries.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-glow, var(--border-subtle))',
                                    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border-subtle)',
                                    backdropFilter: 'blur(20px)',
                                    maxHeight: '380px', overflowY: 'auto',
                                    zIndex: 100, transformOrigin: 'top',
                                }}
                            >
                                {/* Tab Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0', borderBottom: '1px solid var(--border-subtle)',
                                }}>
                                    {(['history', 'saved'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setSavedPanelTab(tab)}
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                padding: '10px 12px', cursor: 'pointer',
                                                background: savedPanelTab === tab ? 'var(--primary-subtle)' : 'transparent',
                                                borderBottom: savedPanelTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                                color: savedPanelTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                                                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.08em', border: 'none', transition: 'all 0.2s',
                                            }}
                                        >
                                            {tab === 'history' ? <Clock size={12} /> : <Star size={12} />}
                                            {tab === 'history' ? `Recent (${queryHistory.length})` : `Saved (${savedQueries.length})`}
                                        </button>
                                    ))}
                                </div>

                                {/* History Tab */}
                                {savedPanelTab === 'history' && (
                                    <div>
                                        {queryHistory.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.5 }}>No search history yet</div>
                                        ) : (
                                            <>
                                                {queryHistory.map((h, i) => (
                                                    <div
                                                        key={`${h}-${i}`}
                                                        onClick={() => applySavedQuery(h)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            padding: '8px 12px', cursor: 'pointer',
                                                            transition: 'background 0.1s',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-subtle)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <Clock size={12} style={{ color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0 }} />
                                                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</span>
                                                    </div>
                                                ))}
                                                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button onClick={clearHistory} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                                                        <Trash2 size={10} /> Clear history
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Saved Tab */}
                                {savedPanelTab === 'saved' && (
                                    <div>
                                        {savedQueries.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.5 }}>
                                                <Bookmark size={20} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                                No saved queries. Type a query and click <Bookmark size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> to save.
                                            </div>
                                        ) : (
                                            [...savedQueries].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(sq => (
                                                <div
                                                    key={sq.id}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '8px 12px', cursor: 'pointer',
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-subtle)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleStarQuery(sq.id); }}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: sq.starred ? 'var(--warning)' : 'var(--text-muted)', opacity: sq.starred ? 1 : 0.3, transition: 'all 0.15s', flexShrink: 0 }}
                                                    >
                                                        <Star size={13} fill={sq.starred ? 'currentColor' : 'none'} />
                                                    </button>
                                                    <div onClick={() => applySavedQuery(sq.query)} style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sq.name}</div>
                                                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{sq.query}</div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSavedQuery(sq.id); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', opacity: 0, transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => { (e.currentTarget.style.opacity as any) = '1'; e.currentTarget.style.color = 'var(--danger)'; }}
                                                        onMouseLeave={e => { (e.currentTarget.style.opacity as any) = '0'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Time Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        className={`btn btn-secondary flex items-center gap-2.5 px-4 h-10 rounded-xl transition-all hover-lift active-press ${showTimePicker ? 'border-glow-primary' : ''}`}
                    >
                        <Calendar size={15} className={showTimePicker ? "text-primary shadow-[0_0_8px_var(--primary-glow)]" : "text-muted"} strokeWidth={2.5} />
                        <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{timeLabel}</span>
                        <ChevronDown size={14} className={`opacity-40 transition-transform duration-300 ${showTimePicker ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    {showTimePicker && (
                        <div className="absolute top-12 right-0 w-[90vw] md:w-[680px] z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right shadow-2xl" style={{ maxWidth: 'calc(100vw - 32px)' }}>
                            <TimePicker onSelect={handleTimeSelect} onClose={() => setShowTimePicker(false)} />
                        </div>
                    )}
                </div>

                {/* Refresh */}
                <button
                    onClick={onRefresh}
                    className="btn btn-secondary btn-icon h-10 w-10 flex items-center justify-center rounded-xl transition-all hover-lift active-press"
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className="refresh-icon group-hover:text-primary transition-colors" />
                </button>
            </div>
        </div>
    );
};
