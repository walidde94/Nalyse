
import { X, Plus, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterItem {
    type: string;
    column?: string;
    value: any;
    label?: string;
}

interface ElasticFilterBarProps {
    filters: FilterItem[];
    onRemoveFilter: (filter: FilterItem) => void;
    onClearAll: () => void;
    onAddFilter?: () => void;
}

export const ElasticFilterBar = ({ filters, onRemoveFilter, onClearAll, onAddFilter }: ElasticFilterBarProps) => {
    if (filters.length === 0) return null;

    return (
        <div className="w-full px-6 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar animate-in slide-in-from-top-1 duration-300"
            style={{
                background: 'rgba(15, 23, 42, 0.4)',
                borderBottom: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div className="flex items-center gap-2 mr-3 select-none">
                <Filter size={14} className="text-primary opacity-60" />
                <span className="label-premium">Active Constraints</span>
            </div>

            <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                    {filters.map((filter, i) => (
                        <motion.div
                            key={`${filter.column}-${filter.value}-${i}`}
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -10 }}
                            className="flex items-center gap-0 pl-3.5 pr-1.5 py-1.5 rounded-lg transition-all group shadow-lg border relative overflow-hidden hover-lift active-press"
                            style={{
                                background: 'rgba(2, 6, 23, 0.9)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                            title={`${filter.column ? filter.column + ': ' : ''}${filter.value}`}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                style={{ background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}></div>

                            {filter.type === 'query' ? (
                                <Search size={10} className="mr-2.5 text-[var(--primary)]" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full mr-2.5"
                                    style={{
                                        background: filter.type === 'range' ? 'var(--success)' : 'var(--accent)',
                                        boxShadow: `0 0 8px ${filter.type === 'range' ? 'var(--success)' : 'var(--accent)'}`
                                    }} />
                            )}

                            {filter.column && (
                                <span className="label-premium mr-2 !opacity-40" style={{ fontSize: '9px' }}>
                                    {filter.column}
                                </span>
                            )}

                            <span className="font-data text-xs tracking-tight mr-1.5" style={{ color: 'var(--text-primary)' }}>
                                {filter.label || String(filter.value)}
                            </span>

                            <button
                                onClick={() => onRemoveFilter(filter)}
                                className="ml-1 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={13} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button
                onClick={onAddFilter}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed transition-all ml-1 bg-white/5 hover:bg-white/10 hover:border-[var(--primary)] group active-press"
                style={{
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary)'
                }}
                title="Add Filter"
            >
                <Plus size={16} className="group-hover:text-[var(--primary)] transition-colors" />
            </button>

            <div className="flex-1"></div>

            {filters.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="label-premium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 active-press"
                    style={{ color: 'var(--danger)', opacity: 1 }}
                >
                    RESET INTELLIGENCE LAYERS
                </button>
            )}
        </div>
    );
};
