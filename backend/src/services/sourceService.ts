import axios from 'axios';

export class SourceService {
    async fetchData(source: any): Promise<any[]> {
        if (source.type === 'rest_api') {
            const { url, headers, rootKey } = source.config;
            const response = await axios.get(url, { headers });
            let data = response.data;

            // If the data is nested under a key e.g. { "results": [...] }
            if (rootKey && data[rootKey]) {
                data = data[rootKey];
            }

            if (!Array.isArray(data)) {
                throw new Error('Remote response is not an array. Please specify a correct rootKey.');
            }
            return data;
        }

        if (source.type === 'postgresql' || source.type === 'mysql') {
            return [
                { id: 1, name: 'Sample Transaction', amount: 450, date: new Date().toISOString() },
                { id: 2, name: 'Live Data Point', amount: 890, date: new Date().toISOString() }
            ];
        }

        if (source.type === 'stripe') {
            return Array.from({ length: 50 }, (_, i) => ({
                id: `pi_${1000 + i}`,
                amount: Math.floor(Math.random() * 500) + 10,
                currency: 'usd',
                status: Math.random() > 0.1 ? 'succeeded' : 'failed',
                customer_email: `user${i}@example.com`,
                created: new Date(Date.now() - i * 86400000).toISOString()
            }));
        }

        if (source.type === 'salesforce') {
            return Array.from({ length: 40 }, (_, i) => ({
                Id: `0015${i}00000ABC`,
                Name: `Enterprise Corp ${i}`,
                StageName: ['Prospecting', 'Qualification', 'Needs Analysis', 'Closed Won', 'Closed Lost'][Math.floor(Math.random() * 5)],
                Amount: Math.floor(Math.random() * 50000) + 5000,
                Probability: Math.floor(Math.random() * 100),
                CloseDate: new Date(Date.now() + i * 86400000).toISOString().split('T')[0]
            }));
        }

        if (source.type === 'hubspot') {
            return Array.from({ length: 45 }, (_, i) => ({
                contactId: `10${i}`,
                firstname: `Lead ${i}`,
                lifecycle_stage: ['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer'][Math.floor(Math.random() * 6)],
                hubspot_score: Math.floor(Math.random() * 100),
                last_activity_date: new Date(Date.now() - i * 43200000).toISOString()
            }));
        }

        if (source.type === 'google_analytics') {
            return Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                sessions: Math.floor(Math.random() * 1000) + 500,
                bounce_rate: (Math.random() * 40 + 20).toFixed(2),
                avg_session_duration: Math.floor(Math.random() * 120) + 60,
                goal_completions: Math.floor(Math.random() * 50)
            }));
        }

        return [];
    }
}
