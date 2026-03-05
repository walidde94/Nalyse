import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Search, ArrowUp, Columns } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface VirtualDataGridProps {
    data: any[];
    columns?: string[];
    rowHeight?: number;
    overscan?: number;
    searchable?: boolean;
    isDark?: boolean;
    onRowClick?: (row: any, index: number) => void;
}

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL DATA GRID
// ═══════════════════════════════════════════════════════════════════

export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({
    data,
    columns: propColumns,
    rowHeight = 40,
    overscan = 10,
    searchable = true,
    isDark = true,
    onRowClick,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);
    const [searchTerm, setSearchTerm] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);

    const bg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(15,23,42,${a})`;

    // Determine columns
    const columns = useMemo(() => {
        if (propColumns && propColumns.length > 0) return propColumns;
        return data.length > 0 ? Object.keys(data[0]) : [];
    }, [data, propColumns]);

    // Filter data by search
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(row =>
            columns.some(col => String(row[col] ?? '').toLowerCase().includes(term))
        );
    }, [data, searchTerm, columns]);

    // Measure container on mount and resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
        setShowScrollTop(e.currentTarget.scrollTop > 200);
    }, []);

    const scrollToTop = useCallback(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Virtual window calculations
    const totalRows = filteredData.length;
    const totalHeight = totalRows * rowHeight;
    const headerHeight = 44;
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(totalRows, startIndex + visibleRows + overscan * 2);
    const offsetY = startIndex * rowHeight;

    const visibleSlice = filteredData.slice(startIndex, endIndex);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search + Stats Bar */}
            {searchable && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderBottom: `1px solid ${bg(0.05)}`,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 10px', borderRadius: '8px',
                        background: bg(0.03), border: `1px solid ${bg(0.06)}`,
                        flex: 1, maxWidth: '300px',
                    }}>
                        <Search size={12} color={fg(0.3)} />
                        <input
                            type="text"
                            placeholder="Search across all columns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', outline: 'none',
                                fontSize: '11px', fontWeight: 600, color: fg(0.8),
                                width: '100%',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: fg(0.3) }}>
                        <Columns size={11} />
                        {columns.length} cols
                    </div>
                    <div style={{
                        fontSize: '10px', fontWeight: 700, color: fg(0.3),
                        padding: '3px 8px', borderRadius: '6px', background: bg(0.03),
                    }}>
                        {filteredData.length.toLocaleString()} / {data.length.toLocaleString()} rows
                    </div>
                </div>
            )}

            {/* Scrollable Grid */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                style={{
                    flex: 1, overflow: 'auto', position: 'relative',
                    // Custom scrollbar
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${bg(0.1)} transparent`,
                }}
            >
                {/* Header (sticky) */}
                <div style={{
                    display: 'flex', position: 'sticky', top: 0, zIndex: 10,
                    background: isDark ? 'rgba(10,10,18,0.95)' : 'rgba(245,245,250,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: `1px solid ${bg(0.06)}`,
                    height: `${headerHeight}px`,
                }}>
                    {columns.map(col => (
                        <div key={col} style={{
                            flex: `0 0 ${Math.max(120, 100 / columns.length)}%`,
                            maxWidth: '300px', minWidth: '100px',
                            padding: '12px 16px',
                            fontSize: '9px', fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: '0.15em',
                            color: fg(0.4), whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderRight: `1px solid ${bg(0.03)}`,
                        }}>
                            {col}
                        </div>
                    ))}
                </div>

                {/* Virtual body */}
                <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: `${offsetY}px`, left: 0, right: 0,
                    }}>
                        {visibleSlice.map((row, localIdx) => {
                            const globalIdx = startIndex + localIdx;
                            const isEven = globalIdx % 2 === 0;
                            return (
                                <div
                                    key={globalIdx}
                                    onClick={() => onRowClick?.(row, globalIdx)}
                                    style={{
                                        display: 'flex',
                                        height: `${rowHeight}px`,
                                        background: isEven ? 'transparent' : bg(0.015),
                                        borderBottom: `1px solid ${bg(0.02)}`,
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = bg(0.04)}
                                    onMouseLeave={e => e.currentTarget.style.background = isEven ? 'transparent' : bg(0.015)}
                                >
                                    {columns.map((col, j) => {
                                        const val = row[col];
                                        const isNumeric = typeof val === 'number';
                                        return (
                                            <div key={j} style={{
                                                flex: `0 0 ${Math.max(120, 100 / columns.length)}%`,
                                                maxWidth: '300px', minWidth: '100px',
                                                padding: '0 16px',
                                                display: 'flex', alignItems: 'center',
                                                fontSize: '11px',
                                                fontWeight: isNumeric ? 700 : 500,
                                                fontFamily: isNumeric ? 'var(--font-mono, monospace)' : 'inherit',
                                                color: isNumeric ? '#818cf8' : fg(0.7),
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                borderRight: `1px solid ${bg(0.02)}`,
                                            }}>
                                                {String(val ?? '')}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scroll to top FAB */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    style={{
                        position: 'absolute', bottom: '16px', right: '16px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                        zIndex: 20,
                    }}
                >
                    <ArrowUp size={14} color="#fff" />
                </button>
            )}
        </div>
    );
};

export default VirtualDataGrid;
