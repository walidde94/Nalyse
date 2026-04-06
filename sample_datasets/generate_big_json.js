const fs = require('fs');
const path = require('path');

const PRODUCTS = ['Enterprise Server Alpha', 'Cloud Compute Standard', 'Security Gateway', 'Neural AI API', 'Edge Compute Node'];
const REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM'];
const SPEND_CHANNELS = ['Google Ads', 'LinkedIn', 'Direct Sales', 'Partner Network'];

const records = [];

let currentDate = new Date('2024-01-01T00:00:00Z');

console.log('Generating 10,000 JSON records...');

for (let i = 1; i <= 10000; i++) {
    // advance time slightly per record
    currentDate = new Date(currentDate.getTime() + Math.random() * 86400000 * 0.1); 
    
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const channel = SPEND_CHANNELS[Math.floor(Math.random() * SPEND_CHANNELS.length)];

    const units = Math.floor(Math.random() * 500) + 10;
    const basePrice = product.includes('Alpha') ? 5000 : product.includes('API') ? 200 : 1500;
    const revenue = units * basePrice * (1 + (Math.random() * 0.2 - 0.1)); 
    
    const spend = revenue * 0.15 * Math.random();
    const profit = revenue - spend - (revenue * 0.4); 

    const activeUsers = Math.floor(units * (Math.random() * 10 + 2));
    const retentionScore = Math.floor(Math.random() * 40) + 50; // 50 to 90

    records.push({
        id: `TXN-${i.toString().padStart(6, '0')}`,
        date: currentDate.toISOString().split('T')[0],
        timestamp: currentDate.toISOString(),
        product: product,
        region: region,
        channel: channel,
        revenue: parseFloat(revenue.toFixed(2)),
        units_sold: units,
        spend: parseFloat(spend.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        active_users: activeUsers,
        retention_score: retentionScore,
        customer_tier: revenue > 100000 ? 'Enterprise' : 'SMB',
        is_fraud_flag: Math.random() > 0.99 // 1% random anomaly
    });
}

const outputPath = path.join(__dirname, '7_massive_enterprise_dataset.json');
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log(`Successfully generated ${records.length} records to ${outputPath}`);
