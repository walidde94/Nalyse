import { useState, useEffect } from 'react';
import { Search, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { TimePicker } from './TimePicker';

interface ElasticSearchProps {
    onSearch: (query: string) => void;
    onTimeRangeChange: (range: { start: string | null; end: string | null; label: string }) => void;
    placeholder?: string;
    initialQuery?: string;
    onRefresh?: () => void;
}

export const ElasticSearch = ({
    onSearch,
    onTimeRangeChange,
    placeholder = "Search... (e.g. status:error AND latency > 500)",
    initialQuery = '',
    onRefresh
}: ElasticSearchProps) => {
    const [query, setQuery] = useState(initialQuery);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeLabel, setTimeLabel] = useState('Last 15 minutes');

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    const handleTimeSelect = (range: { start: string | null; end: string | null; label: string }) => {
        setTimeLabel(range.label);
        onTimeRangeChange(range);
        setShowTimePicker(false);
    };

    return (
        <div className="w-full relative z-40 px-6 py-2" style={{ background: 'transparent' }}>
            <div className="flex items-center gap-3 w-full">
                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="flex-1 flex items-center h-10 rounded-xl transition-all relative border overflow-hidden group/search focus-within:border-primary/50 shadow-sm"
                    style={{
                        background: 'var(--bg-main)',
                        borderColor: 'var(--border-default)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
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
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent border-none outline-none font-data text-sm h-full"
                        style={{ color: 'var(--text-primary)', caretColor: 'var(--primary)' }}
                    />
                    <div className="flex items-center gap-2 pr-3">
                        <kbd className="hidden lg:block label-premium opacity-20 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">⏎ ENTER</kbd>
                    </div>
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
