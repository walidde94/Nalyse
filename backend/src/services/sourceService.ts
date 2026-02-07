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

        if (source.type === 'postgresql') {
            // Simulated DB fetch for the "Real" feel
            // In a real prod environment, we would use a connection pool here
            return [
                { id: 1, name: 'Sample Transaction', amount: 450, date: new Date().toISOString() },
                { id: 2, name: 'Live Data Point', amount: 890, date: new Date().toISOString() }
            ];
        }

        return [];
    }
}
