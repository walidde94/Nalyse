export const mockAnalysis = {
    id: 1,
    type: 'sales_performance',
    createdAt: new Date().toISOString(),
    confidenceScore: 0.92,
    sampleData: [
        { id: 101, region: 'North', sales: 4500, category: 'Electronics', date: '2023-01-01' },
        { id: 102, region: 'South', sales: 3200, category: 'Furniture', date: '2023-01-02' },
        { id: 103, region: 'East', sales: 5100, category: 'Electronics', date: '2023-01-03' },
        { id: 104, region: 'West', sales: 2800, category: 'Furniture', date: '2023-01-04' },
        { id: 105, region: 'North', sales: 3900, category: 'Office', date: '2023-01-05' },
        { id: 106, region: 'South', sales: 6000, category: 'Electronics', date: '2023-01-06' },
        { id: 107, region: 'East', sales: 4200, category: 'Office', date: '2023-01-07' },
        { id: 108, region: 'West', sales: 3100, category: 'Furniture', date: '2023-01-08' },
    ],
    aiInsights: [
        "**Strong Regional Performance**: South region is outperforming others by 15%.",
        "**Electronics Dominance**: This category accounts for 60% of total revenue.",
        "**Weekend Spike**: Sales trend upward on Fridays and Saturdays."
    ],
    options: [
        { title: 'Regional Breakdown', description: 'Sales distribution by region', chartType: 'pie', data: [{ name: 'North', value: 8400, fill: '#6366f1' }, { name: 'South', value: 9200, fill: '#10b981' }, { name: 'East', value: 9300, fill: '#f43f5e' }, { name: 'West', value: 5900, fill: '#fbbf24' }] },
        { title: 'Category Sales', description: 'Total revenue per category', chartType: 'bar', data: [{ name: 'Electronics', value: 15600, fill: '#6366f1' }, { name: 'Furniture', value: 9100, fill: '#10b981' }, { name: 'Office', value: 8100, fill: '#f43f5e' }] }
    ]
};
