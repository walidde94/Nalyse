
export const BI_DATASETS: Record<string, any[]> = {
    sales: [
        { Date: '2024-01-01', Product: 'Laptop Pro', Revenue: 2500, 'Units Sold': 2, Region: 'North' },
        { Date: '2024-01-02', Product: 'Mouse', Revenue: 50, 'Units Sold': 10, Region: 'South' },
        { Date: '2024-01-03', Product: 'Monitor', Revenue: 300, 'Units Sold': 5, Region: 'North' },
        { Date: '2024-01-04', Product: 'Laptop Pro', Revenue: 1250, 'Units Sold': 1, Region: 'East' },
        { Date: '2024-01-05', Product: 'Keyboard', Revenue: 100, 'Units Sold': 4, Region: 'West' },
        { Date: '2024-01-06', Product: 'Headset', Revenue: 150, 'Units Sold': 3, Region: 'North' },
        { Date: '2024-01-07', Product: 'Laptop Pro', Revenue: 2500, 'Units Sold': 2, Region: 'South' },
    ],
    marketing: [
        { Channel: 'Social Media', Campaign: 'Summer Sale', Spend: 5000, Leads: 120, 'Cost Per Lead': 41.66 },
        { Channel: 'Email', Campaign: 'Newsletter', Spend: 200, Leads: 50, 'Cost Per Lead': 4.00 },
        { Channel: 'PPC', Campaign: 'Search Ads', Spend: 8000, Leads: 200, 'Cost Per Lead': 40.00 },
        { Channel: 'SEO', Campaign: 'Organic', Spend: 1000, Leads: 80, 'Cost Per Lead': 12.50 },
        { Channel: 'Social Media', Campaign: 'Influencer', Spend: 3000, Leads: 90, 'Cost Per Lead': 33.33 },
    ],
    supply: [
        { 'Product Name': 'Widget A', 'Stock Level': 500, 'Reorder Point': 100, Supplier: 'Acme Corp', 'Delivery Time (Days)': 5 },
        { 'Product Name': 'Widget B', 'Stock Level': 50, 'Reorder Point': 100, Supplier: 'Global Tech', 'Delivery Time (Days)': 12 },
        { 'Product Name': 'Widget C', 'Stock Level': 200, 'Reorder Point': 50, Supplier: 'Acme Corp', 'Delivery Time (Days)': 4 },
        { 'Product Name': 'Widget D', 'Stock Level': 800, 'Reorder Point': 200, Supplier: 'FastTrack', 'Delivery Time (Days)': 2 },
        { 'Product Name': 'Widget E', 'Stock Level': 20, 'Reorder Point': 30, Supplier: 'Global Tech', 'Delivery Time (Days)': 14 },
    ],
    retention: [
        { User: 'User_001', Plan: 'Pro', 'Retention Score': 85, 'Last Login': '2024-01-20' },
        { User: 'User_002', Plan: 'Basic', 'Retention Score': 40, 'Last Login': '2023-12-15' },
        { User: 'User_003', Plan: 'Pro', 'Retention Score': 95, 'Last Login': '2024-01-21' },
        { User: 'User_004', Plan: 'Enterprise', 'Retention Score': 98, 'Last Login': '2024-01-21' },
        { User: 'User_005', Plan: 'Basic', 'Retention Score': 20, 'Last Login': '2023-11-01' },
    ],
    product: [
        { Feature: 'Dashboard', 'Active Users': 450, 'Avg Session (min)': 12, 'Adoption Rate': 85 },
        { Feature: 'Reports', 'Active Users': 300, 'Avg Session (min)': 8, 'Adoption Rate': 60 },
        { Feature: 'Settings', 'Active Users': 100, 'Avg Session (min)': 3, 'Adoption Rate': 20 },
        { Feature: 'API', 'Active Users': 150, 'Avg Session (min)': 25, 'Adoption Rate': 30 },
        { Feature: 'Export', 'Active Users': 200, 'Avg Session (min)': 2, 'Adoption Rate': 40 },
    ],
    executive: [
        { Month: 'Jan', Revenue: 50000, Expenses: 30000, Profit: 20000 },
        { Month: 'Feb', Revenue: 55000, Expenses: 32000, Profit: 23000 },
        { Month: 'Mar', Revenue: 48000, Expenses: 35000, Profit: 13000 },
        { Month: 'Apr', Revenue: 60000, Expenses: 34000, Profit: 26000 },
        { Month: 'May', Revenue: 75000, Expenses: 40000, Profit: 35000 },
    ]
};

export const getBiData = async (type: string) => {
    // Simulate async DB fetching
    return BI_DATASETS[type] || [];
};
