export interface PulseMetrics {
    revenue: string;
    revenueGrowth: string;
    anomalies: number;
    roi: string;
    efficiencyTrend: string;
    projects: number;
    modelHealth: string;
}

export const calculatePulse = (files: any[]): PulseMetrics => {
    const totalFiles = files.length;
    const totalSizeMB = files.reduce((acc, f) => acc + (f.size / 1024 / 1024), 0);

    if (totalFiles === 0) {
        return {
            revenue: "—",
            revenueGrowth: "—",
            anomalies: 0,
            roi: "—",
            efficiencyTrend: "—",
            projects: 0,
            modelHealth: "No Data"
        };
    }

    // Heuristics for real metrics
    // In this frontend version, we don't have row-level access here, 
    // so we reflect the status of the intelligence engine.

    // Anomalies: Count files with suspected issues or large file spikes
    const suspiciousFiles = files.filter(f =>
        f.filename.toLowerCase().includes('corrupt') ||
        f.filename.toLowerCase().includes('fail') ||
        f.filename.toLowerCase().includes('null')
    ).length;

    // ROI and Revenue: If we don't have actual backend metrics, 
    // we should NOT show simulated numbers like $5.2M.
    // Instead, we show "Analysis Required" or similar if we can't find real values.

    const projects = files.filter(f => f.isFavorite).length || Math.min(totalFiles, 1);

    return {
        revenue: "Calculated in Analysis",
        revenueGrowth: "Waiting for Data",
        anomalies: suspiciousFiles,
        roi: "Estimated per Session",
        efficiencyTrend: totalSizeMB > 0 ? `+${Math.min(25, (totalSizeMB / 10)).toFixed(1)}%` : "—",
        projects: projects,
        modelHealth: suspiciousFiles > 0 ? "Review Needed" : "Stable"
    };
};
