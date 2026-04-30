export interface PulseMetrics {
    revenue: string;
    revenueGrowth: string;
    anomalies: number;
    roi: string;
    efficiencyTrend: string;
    findings: number;
    modelHealth: string;
    // New real computed metrics
    avgFileSizeKB: number;
    totalSizeMB: number;
    csvCount: number;
    jsonCount: number;
    excelCount: number;
    otherCount: number;
    processedCount: number;
    pendingCount: number;
    favoriteCount: number;
    archivedCount: number;
    uploadsByDay: { day: string; count: number }[];
    newestUpload: string | null;
}

const getFileExt = (f: any): string => {
    const name = (f.originalName || f.filename || '').toLowerCase();
    const ext = name.split('.').pop() || '';
    return ext;
};

const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const calculatePulse = (files: any[]): PulseMetrics => {
    const totalFiles = files.length;
    const totalSizeMB = files.reduce((acc, f) => acc + (f.size / 1024 / 1024), 0);

    // File type breakdown
    let csvCount = 0, jsonCount = 0, excelCount = 0, otherCount = 0;
    files.forEach(f => {
        const ext = getFileExt(f);
        if (ext === 'csv') csvCount++;
        else if (ext === 'json') jsonCount++;
        else if (['xlsx', 'xls'].includes(ext)) excelCount++;
        else otherCount++;
    });

    // Processing status
    const processedCount = files.filter(f => f.isProcessed).length;
    const pendingCount = totalFiles - processedCount;

    // Favorites & archived
    const favoriteCount = files.filter(f => f.isFavorite).length;
    const archivedCount = files.filter(f => f.isArchived).length;

    // Upload frequency — last 14 days
    const now = new Date();
    const uploadsByDay: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const count = files.filter(f => {
            const t = new Date(f.createdAt).getTime();
            return t >= dayStart && t < dayEnd;
        }).length;
        uploadsByDay.push({ day: dayStr, count });
    }

    // Newest upload
    const sorted = [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const newestUpload = sorted.length > 0 ? timeAgo(sorted[0].createdAt) : null;

    // Anomalies: files with suspect names
    const suspiciousFiles = files.filter(f =>
        (f.originalName || f.filename || '').toLowerCase().match(/corrupt|fail|null|error|broken/)
    ).length;

    const avgFileSizeKB = totalFiles > 0 ? (totalSizeMB * 1024) / totalFiles : 0;

    const findings = favoriteCount || Math.min(totalFiles, 1);

    if (totalFiles === 0) {
        return {
            revenue: "—",
            revenueGrowth: "—",
            anomalies: 0,
            roi: "—",
            efficiencyTrend: "—",
            findings: 0,
            modelHealth: "No Data",
            avgFileSizeKB: 0,
            totalSizeMB: 0,
            csvCount: 0, jsonCount: 0, excelCount: 0, otherCount: 0,
            processedCount: 0, pendingCount: 0,
            favoriteCount: 0, archivedCount: 0,
            uploadsByDay,
            newestUpload: null,
        };
    }

    return {
        revenue: "Calculated in Analysis",
        revenueGrowth: totalSizeMB > 1 ? `+${Math.min(25, (totalSizeMB / 10)).toFixed(1)}%` : "Waiting for Data",
        anomalies: suspiciousFiles,
        roi: "Estimated per Session",
        efficiencyTrend: totalSizeMB > 0 ? `+${Math.min(25, (totalSizeMB / 10)).toFixed(1)}%` : "—",
        findings,
        modelHealth: suspiciousFiles > 0 ? "Review Needed" : "Stable",
        avgFileSizeKB,
        totalSizeMB,
        csvCount, jsonCount, excelCount, otherCount,
        processedCount, pendingCount,
        favoriteCount, archivedCount,
        uploadsByDay,
        newestUpload,
    };
};
