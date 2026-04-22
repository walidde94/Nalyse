import { useState } from 'react';
import { Clock, ChevronRight, Calendar, X } from 'lucide-react';

interface TimePickerProps {
    onSelect: (range: { start: string | null; end: string | null; label: string }) => void;
    onClose: () => void;
}

export const TimePicker = ({ onSelect, onClose }: TimePickerProps) => {
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const quickSelects = [
        { label: 'Last 15 minutes', duration: 15 * 60 * 1000 },
        { label: 'Last 30 minutes', duration: 30 * 60 * 1000 },
        { label: 'Last 1 hour', duration: 60 * 60 * 1000 },
        { label: 'Last 24 hours', duration: 24 * 60 * 60 * 1000 },
        { label: 'Last 7 days', duration: 7 * 24 * 60 * 60 * 1000 },
        { label: 'Last 30 days', duration: 30 * 24 * 60 * 60 * 1000 },
        { label: 'Last 1 year', duration: 365 * 24 * 60 * 60 * 1000 },
    ];

    const handleQuickSelect = (item: typeof quickSelects[0]) => {
        const end = new Date();
        const start = new Date(end.getTime() - item.duration);
        onSelect({
            start: start.toISOString(),
            end: end.toISOString(),
            label: item.label
        });
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            const startDate = new Date(customStart);
            const endDate = new Date(customEnd);
            const fmt = (d: Date) => d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            onSelect({
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                label: `${fmt(startDate)} - ${fmt(endDate)}`
            });
        }
    };

    return (
        <div
            className="flex flex-responsive w-full md:h-[440px] rounded-2xl border shadow-2xl overflow-hidden glass-noise"
            style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                minHeight: 'fit-content'
            }}
        >
            {/* Sidebar: Quick Select */}
            <div
                className="w-full md:w-[240px] flex flex-col border-b md:border-b-0 md:border-r"
                style={{
                    background: 'rgba(0,0,0,0.15)',
                    borderColor: 'var(--border-subtle)'
                }}
            >
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    <Clock size={14} className="text-primary opacity-60" />
                    <span className="label-premium">Quick Select</span>
                </div>
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {quickSelects.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleQuickSelect(item)}
                            className="w-full text-left px-5 py-3 text-sm transition-all flex justify-between items-center group hover:bg-white/[0.03] active-press"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <span className="group-hover:text-primary transition-colors font-medium">{item.label}</span>
                            <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-primary transition-all" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Area: Custom Range */}
            <div className="flex-1 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="icon-glass p-2 text-primary shadow-[0_0_10px_var(--primary-glow)]">
                            <Calendar size={18} />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight-titles">Absolute Time Range</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-icon active-press"
                        style={{ padding: '8px', border: 'none', background: 'transparent' }}
                    >
                        <X size={20} className="opacity-40 hover:opacity-100 hover:text-danger transition-all" />
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="label-premium !opacity-60 mb-1">Start Date</label>
                        <input
                            type="datetime-local"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm font-data outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all inner-bevel"
                            style={{ colorScheme: 'dark', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label-premium !opacity-60 mb-1">End Date</label>
                        <input
                            type="datetime-local"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm font-data outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all inner-bevel"
                            style={{ colorScheme: 'dark', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                <div className="mt-auto flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)', opacity: 0.5 }}>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost px-4 h-10 hover:bg-white/5 active-press rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCustomApply}
                        disabled={!customStart || !customEnd}
                        className="btn btn-primary px-8 h-10 shadow-lg shadow-primary/20 hover-lift active-press rounded-xl font-bold"
                        style={{
                            opacity: (!customStart || !customEnd) ? 0.4 : 1,
                            cursor: (!customStart || !customEnd) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Apply Intelligent Range
                    </button>
                </div>
            </div>
        </div>
    );
};
