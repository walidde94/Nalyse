import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DiscoverHistogramProps {
    data: any[];
    dateColumn: string | null;
}

export const DiscoverHistogram = ({ data, dateColumn }: DiscoverHistogramProps) => {
    const histogramData = useMemo(() => {
        if (!dateColumn || data.length === 0) return [];

        // Simple automatic binning
        const dates = data.map(d => new Date(d[dateColumn]).getTime()).filter(t => !isNaN(t));
        if (dates.length === 0) return [];

        const min = Math.min(...dates);
        const max = Math.max(...dates);
        const diff = max - min;

        // Decide bin size
        let binSize = 0;

        if (diff < 3600 * 1000) { // < 1 hour -> bin by minute
            binSize = 60 * 1000;
        } else if (diff < 24 * 3600 * 1000) { // < 1 day -> bin by hour
            binSize = 3600 * 1000;
        } else { // > 1 day -> bin by day
            binSize = 24 * 3600 * 1000;
        }

        const bins: Record<string, number> = {};

        // Initialize bins to 0 (optional, for smoother chart)
        // for (let t = min; t <= max; t += binSize) {
        //     bins[t] = 0;
        // }

        dates.forEach(t => {
            const bin = Math.floor(t / binSize) * binSize;
            bins[bin] = (bins[bin] || 0) + 1;
        });

        return Object.entries(bins)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([time, count]) => ({
                time: Number(time),
                label: new Date(Number(time)).toLocaleDateString(), // Simplification
                count
            }));

    }, [data, dateColumn]);

    if (!dateColumn) {
        return (
            <div className="h-[100px] flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl mb-6 inner-bevel">
                <div className="flex flex-col items-center gap-2">
                    <div className="label-premium opacity-40">INTELLIGENCE TIME-SERIES UNAVAILABLE</div>
                    <p className="text-[10px] opacity-20 uppercase tracking-widest">Select a temporal dimension to initialize</p>
                </div>
            </div>
        );
    }

    if (histogramData.length === 0) return null;

    return (
        <div className="h-[180px] w-full mb-6 glass-morphism p-4 rounded-xl relative group shadow-hover inner-bevel overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="label-premium">TEMPORAL DISTRIBUTION ANALYSIS</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} barGap={0} barCategoryGap={2}>
                    <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        cursor={{ fill: 'var(--bg-surface-hover)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="glass-morphism p-3 rounded-lg border border-white/10 shadow-2xl relative">
                                        <div className="absolute inset-0 glass-noise opacity-20 pointer-events-none" />
                                        <div className="label-premium !opacity-60 mb-1">DOCUMENTS</div>
                                        <div className="font-data text-xl text-primary">{payload[0].value}</div>
                                        <div className="text-[10px] opacity-40 mt-1 font-mono">
                                            {new Date(payload[0].payload.time).toLocaleString()}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} hide />
                    <Bar
                        dataKey="count"
                        fill="url(#barGrad)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
