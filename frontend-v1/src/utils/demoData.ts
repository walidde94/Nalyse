
export const DEMO_DATA: Record<string, string> = {
    'sales': `Date,Region,Product,Revenue,Units Sold,Customer Type
2023-01-01,North America,SaaS Basic,15000,150,New
2023-01-02,Europe,SaaS Pro,25000,50,Existing
2023-01-03,Asia,SaaS Enterprise,50000,10,Existing
2023-01-04,North America,SaaS Basic,12000,120,New
2023-01-05,Europe,SaaS Pro,28000,56,Existing
2023-01-06,Asia,SaaS Basic,8000,80,New
2023-01-07,North America,SaaS Enterprise,45000,9,Existing
2023-01-08,Europe,SaaS Basic,16000,160,New
2023-01-09,Asia,SaaS Pro,22000,44,Existing
2023-01-10,North America,SaaS Pro,30000,60,Existing`,

    'retention': `User ID,Signup Date,Last Active,Sessions,Plan,Retention Score
1001,2023-01-01,2023-01-20,15,Free,85
1002,2023-01-02,2023-01-05,2,Free,20
1003,2023-01-03,2023-01-21,25,Pro,95
1004,2023-01-04,2023-01-15,8,Basic,60
1005,2023-01-05,2023-01-21,30,Enterprise,98
1006,2023-01-06,2023-01-06,1,Free,10
1007,2023-01-07,2023-01-19,12,Basic,75
1008,2023-01-08,2023-01-20,18,Pro,88
1009,2023-01-09,2023-01-11,4,Free,40
1010,2023-01-10,2023-01-21,22,Pro,92`,

    'supply': `Product ID,Product Name,Stock Level,Reorder Point,Supplier,Delivery Time (Days)
P-101,Laptop Stand,450,100,TechGear Inc,5
P-102,USB-C Hub,120,150,ConnectWorld,12
P-103,Monitor Arm,85,50,ErgoLife,7
P-104,Mechanical Keyboards,200,80,KeyMasters,15
P-105,Mouse Pad,500,200,OfficeDeps,3
P-106,Webcam 4K,60,40,VisionTech,8
P-107,Headset,150,100,AudioPro,6
P-108,Desk Lamp,90,50,BrightLite,9`,

    'marketing': `Campaign,Channel,Spend,Impressions,Clicks,Leads,Cost Per Lead
Q1-Launch,Facebook,5000,150000,2500,120,41.67
Q1-Launch,LinkedIn,8000,80000,1200,150,53.33
Q1-Launch,Google Ads,6000,120000,3500,200,30.00
Evergreen,SEO,2000,50000,5000,300,6.67
Webinar-Series,Email,500,10000,800,50,10.00
Q1-Retargeting,Facebook,3000,60000,1500,80,37.50
Q1-Retargeting,Google Ads,4000,50000,1000,70,57.14`,

    'product': `Feature,Event Name,User Segment,Count,Avg Time Spent (s)
Dashboard,View,Admin,4500,120
Dashboard,View,User,12000,60
Reports,Create,Admin,800,300
Reports,Export,Admin,600,15
Settings,Update,Admin,200,45
Onboarding,Complete,User,300,600
Onboarding,Dropoff,User,50,120
VisualBuilder,Create Chart,User,1500,180`,

    'executive': `Department,KPI,Target,Actual,Status,Owner
Sales,Monthly Revenue,100000,105000,On Track,Sarah J.
Sales,New Logos,50,45,At Risk,Sarah J.
marketing,Leads,500,620,Exceeding,Mike T.
Engineering,Uptime,99.9,99.95,On Track,David L.
Customer Success,NPS,70,72,On Track,Jenny W.
Product,Feature Velocity,20,15,At Risk,David L.
Finance,Burn Rate,50000,48000,On Track,Robert K.`
};
