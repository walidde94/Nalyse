import { useState } from 'react';
import { X, Filter, Search, Calendar, Zap, Database, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */
interface FilterItem {
    type: string;
    column?: string;
    value: any;
    label?: string;
    enabled?: boolean;
}

interface ElasticFilterBarProps {
    filters: FilterItem[];
    onRemoveFilter: (filter: FilterItem) => void;
    onClearAll: () => void;
    onAddFilter?: () => void;
}

/* ─────────────────────────────────────────────────────────
   Main Component — Active Filter Pills Display
   ───────────────────────────────────────────────────────── */
export const ElasticFilterBar = ({
    filters,
    onRemoveFilter,
    onClearAll,
    onAddFilter,
}: ElasticFilterBarProps) => {
    const [disabledFilters, setDisabledFilters] = useState<Set<number>>(new Set());

    if (filters.length === 0) return null;

    const toggleFilter = (idx: number) => {
        setDisabledFilters(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="efb-root">
            <div className="efb-bar">
                {/* Label */}
                <div className="efb-bar-label">
                    <Filter size={13} />
                    <span>Filters</span>
                    <span className="efb-count">{filters.length}</span>
                </div>

                {/* Pills */}
                <div className="efb-pills">
                    <AnimatePresence mode="popLayout">
                        {filters.map((filter, i) => {
                            const isDisabled = disabledFilters.has(i);
                            return (
                                <motion.div
                                    key={`${filter.column}-${filter.value}-${i}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.85, y: 4 }}
                                    animate={{ opacity: isDisabled ? 0.35 : 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: -4 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className={`efb-pill ${isDisabled ? 'efb-pill-disabled' : ''} efb-pill-${filter.type}`}
                                >
                                    {/* Type indicator */}
                                    <div className="efb-pill-indicator">
                                        {filter.type === 'query' ? (
                                            <Search size={10} />
                                        ) : filter.type === 'range' ? (
                                            <Calendar size={10} />
                                        ) : filter.type === 'drilldown' ? (
                                            <Zap size={10} />
                                        ) : (
                                            <Database size={10} />
                                        )}
                                    </div>

                                    {/* Column name */}
                                    {filter.column && (
                                        <span className="efb-pill-field">{filter.column}</span>
                                    )}

                                    {/* Separator */}
                                    {filter.column && <span className="efb-pill-sep">:</span>}

                                    {/* Value */}
                                    <span className="efb-pill-value">
                                        {filter.label || String(filter.value)}
                                    </span>

                                    {/* Toggle enabled/disabled */}
                                    <button
                                        className="efb-pill-toggle"
                                        onClick={(e) => { e.stopPropagation(); toggleFilter(i); }}
                                        title={isDisabled ? 'Enable filter' : 'Disable filter'}
                                    >
                                        {isDisabled ? <EyeOff size={10} /> : <Eye size={10} />}
                                    </button>

                                    {/* Remove */}
                                    <button
                                        className="efb-pill-remove"
                                        onClick={() => onRemoveFilter(filter)}
                                    >
                                        <X size={11} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                <div className="efb-spacer" />

                {/* Clear all */}
                <button className="efb-clear-all" onClick={onClearAll}>
                    <RotateCcw size={11} />
                    <span>Clear</span>
                </button>
            </div>

            {/* ═══ STYLES ═══ */}
            <style>{`
                .efb-root {
                    position: relative;
                    z-index: 30;
                }

                /* ── Bar ── */
                .efb-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border-subtle);
                    min-height: 40px;
                    position: relative;
                    overflow-x: auto;
                }
                .efb-bar::-webkit-scrollbar { height: 0; }
                .efb-bar::before {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--primary-glow), transparent);
                    opacity: 0.25;
                }

                .efb-bar-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    white-space: nowrap;
                    flex-shrink: 0;
                    padding-right: 10px;
                    border-right: 1px solid var(--border-subtle);
                    margin-right: 4px;
                }
                .efb-count {
                    background: var(--primary);
                    color: var(--text-primary);
                    font-size: 9px;
                    font-weight: 900;
                    padding: 1px 6px;
                    border-radius: 8px;
                    line-height: 1.4;
                    min-width: 18px;
                    text-align: center;
                }

                /* ── Pills ── */
                .efb-pills {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .efb-pill {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 4px 3px 6px;
                    border-radius: 8px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    font-size: 11px;
                    transition: all 0.2s;
                    cursor: default;
                    white-space: nowrap;
                    position: relative;
                    overflow: hidden;
                }
                .efb-pill::before {
                    content: '';
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 2px;
                    background: var(--primary);
                    border-radius: 2px 0 0 2px;
                }
                .efb-pill:hover {
                    border-color: var(--primary);
                    box-shadow: 0 0 12px -4px var(--primary-glow);
                }
                .efb-pill-disabled { text-decoration: line-through; }
                .efb-pill-disabled::before { background: var(--text-muted) !important; }
                .efb-pill-query::before { background: var(--accent) !important; }
                .efb-pill-drilldown::before { background: var(--warning) !important; }
                .efb-pill-range::before { background: var(--success) !important; }

                .efb-pill-indicator {
                    width: 20px; height: 20px; border-radius: 5px;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary); background: var(--primary-subtle);
                    flex-shrink: 0;
                }
                .efb-pill-query .efb-pill-indicator { color: var(--accent); background: rgba(139, 92, 246, 0.1); }
                .efb-pill-drilldown .efb-pill-indicator { color: var(--warning); background: rgba(245, 158, 11, 0.1); }
                .efb-pill-range .efb-pill-indicator { color: var(--success); background: rgba(16, 185, 129, 0.1); }

                .efb-pill-field {
                    font-weight: 800;
                    color: var(--text-muted);
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .efb-pill-sep { color: var(--text-muted); opacity: 0.3; font-weight: 300; }
                .efb-pill-value {
                    font-weight: 700;
                    color: var(--text-primary);
                    max-width: 180px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .efb-pill-toggle, .efb-pill-remove {
                    width: 20px; height: 20px; border-radius: 5px;
                    display: flex; align-items: center; justify-content: center;
                    border: none; background: transparent;
                    color: var(--text-muted); cursor: pointer;
                    transition: all 0.15s;
                    flex-shrink: 0;
                    opacity: 0;
                }
                .efb-pill:hover .efb-pill-toggle,
                .efb-pill:hover .efb-pill-remove { opacity: 1; }
                .efb-pill-toggle:hover { background: var(--primary-subtle); color: var(--primary); }
                .efb-pill-remove:hover { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

                .efb-spacer { flex: 1; }

                /* ── Clear All ── */
                .efb-clear-all {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: var(--danger);
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .efb-clear-all:hover {
                    background: rgba(239, 68, 68, 0.08);
                    border-color: rgba(239, 68, 68, 0.2);
                }

                @media (max-width: 640px) {
                    .efb-bar { padding: 4px 10px; flex-wrap: wrap; }
                }
            `}</style>
        </div>
    );
};
