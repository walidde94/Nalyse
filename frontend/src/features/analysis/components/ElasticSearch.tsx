import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Calendar, ChevronDown, RefreshCw, Hash, Type, Columns, Zap, ArrowRight } from 'lucide-react';
import { TimePicker } from './TimePicker';
import { motion, AnimatePresence } from 'framer-motion';

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
        onSearch(query);
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
        setShowSuggestions(true);
    };

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        setCursorPos((e.target as HTMLInputElement).selectionStart || 0);
        if (allFields.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleInputFocus = () => {
        if (allFields.length > 0) {
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
