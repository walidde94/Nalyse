import { useState, useMemo } from 'react';
import { Search, Hash, Calendar, Type, Info, Filter, Plus, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldDiscoverySidebarProps {
    data: any[];
    columnTypes: Record<string, string>;
    onFieldClick: (field: string) => void;
    onAddFilter: (field: string, value: any) => void;
    visibleColumns: string[];
    onToggleColumn: (field: string) => void;
}

export const FieldDiscoverySidebar = ({
    data,
    columnTypes,
    onFieldClick,
    onAddFilter,
    visibleColumns,
    onToggleColumn
}: FieldDiscoverySidebarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedField, setExpandedField] = useState<string | null>(null);

    const fields = useMemo(() => {
        if (!data || data.length === 0) return [];
        const allKeys = Object.keys(data[0]);

        return allKeys.map(key => {
            const values = data.map(d => d[key]).filter(v => v !== null && v !== undefined && v !== '');
            const uniqueValues = new Set(values).size;
            const presence = Math.round((values.length / data.length) * 100);

            // Get top values for preview
            const counts: Record<string, number> = {};
            values.slice(0, 1000).forEach(v => counts[String(v)] = (counts[String(v)] || 0) + 1);
            const topValues = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([value, count]) => ({ value, count, pct: Math.round((count / Math.min(values.length, 1000)) * 100) }));

            return {
                name: key,
                type: columnTypes[key] || 'text',
                presence,
                uniqueValues,
                topValues
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [data, columnTypes]);

    const filteredFields = fields.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'number':
            case 'currency':
            case 'percent':
                return <Hash size={14} />;
            case 'date':
                return <Calendar size={14} />;
            default:
                return <Type size={14} />;
        }
    };

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center py-4 gap-4" style={{ width: '40px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-sidebar)' }}>
                <button onClick={() => setIsCollapsed(false)} className="btn btn-icon btn-ghost btn-sm">
                    <ChevronRight size={16} />
                </button>
                <div className="h-px w-4 bg-[var(--border-subtle)]" />
                <div className="flex flex-col gap-3">
                    <Info size={16} className="opacity-30" />
                    <Filter size={16} className="opacity-30" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ width: '280px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-sidebar)' }}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-[var(--primary)]" />
                    <span className="text-xs font-bold uppercase tracking-widest">Available Fields</span>
                </div>
                <button onClick={() => setIsCollapsed(true)} className="btn btn-icon btn-ghost btn-sm">
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-30" size={12} />
                    <input
                        type="text"
                        placeholder="Search fields..."
                        className="w-full text-xs rounded-lg pl-8 p-2"
                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Field List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1">
                <div className="flex flex-col gap-0.5">
                    {filteredFields.map(field => {
                        const isVisible = visibleColumns.length === 0 || visibleColumns.includes(field.name);
                        const isExpanded = expandedField === field.name;

                        return (
                            <div key={field.name} className="flex flex-col">
                                <div
                                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isExpanded ? 'bg-[var(--bg-surface-hover)]' : 'hover:bg-[var(--bg-surface-hover)]'}`}
                                    onClick={() => setExpandedField(isExpanded ? null : field.name)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div
                                            className={`transition-colors ${isVisible ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
                                            onClick={(e) => { e.stopPropagation(); onToggleColumn(field.name); }}
                                        >
                                            {getTypeIcon(field.type)}
                                        </div>
                                        <span className={`text-xs truncate ${isVisible ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] opacity-60'}`}>
                                            {field.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="p-1 hover:text-[var(--primary)]"
                                            onClick={(e) => { e.stopPropagation(); onFieldClick(field.name); }}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-[var(--bg-main)] rounded-lg mx-2 mb-2 p-3 flex flex-col gap-3 shadow-inner"
                                        >
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div className="flex-col gap-1">
                                                    <span className="opacity-40 uppercase font-bold">Presence</span>
                                                    <span className="font-mono text-[var(--success)]">{field.presence}%</span>
                                                </div>
                                                <div className="flex-col gap-1">
                                                    <span className="opacity-40 uppercase font-bold">Unique</span>
                                                    <span className="font-mono text-[var(--primary)]">{field.uniqueValues}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] opacity-40 uppercase font-bold">Top Values</span>
                                                <div className="flex flex-col gap-1">
                                                    {field.topValues.map((v, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex flex-col gap-1 cursor-pointer hover:bg-[var(--bg-surface-hover)] p-1 rounded transition-colors"
                                                            onClick={() => onAddFilter(field.name, v.value)}
                                                        >
                                                            <div className="flex justify-between items-center text-[11px] gap-2">
                                                                <span className="truncate flex-1 opacity-80">{v.value || 'null'}</span>
                                                                <span className="font-mono opacity-40">{v.pct}%</span>
                                                            </div>
                                                            <div className="h-1 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[var(--primary)] opacity-40"
                                                                    style={{ width: `${v.pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
