import { clickhouse } from '../config/database';
import fs from 'fs';
import { parse } from 'csv-parse';
import { prisma } from '../config/database';

export class ClickHouseService {
    /**
     * Gen 2 HTAP: Create a dedicated MergeTree table for a dataset
     */
    static async createDatasetTable(datasetId: string, headers: string[]) {
        const tableName = `dataset_${datasetId.replace(/-/g, '_')}`;

        // Sanitize headers to valid ClickHouse column names
        const cleanHeaders = headers.map(h =>
            h.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        );

        // All columns as Nullable(String) for initial raw landing area
        const columnsDef = cleanHeaders.map(col => `\`${col}\` Nullable(String)`).join(', ');

        const query = `
            CREATE TABLE IF NOT EXISTS nalyse_gen2.${tableName} (
                _row_id UUID DEFAULT generateUUIDv4(),
                ${columnsDef},
                _inserted_at DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY _inserted_at
        `;

        try {
            await clickhouse.command({ query });
            console.log(`[ClickHouse] Created OLAP table: ${tableName}`);
            return tableName;
        } catch (error) {
            console.error('[ClickHouse] Failed to create table', error);
            throw error;
        }
    }

    /**
     * Stream an active CSV upload directly into ClickHouse
     */
    static async streamCsvToClickHouse(filePath: string, datasetId: string) {
        const tableName = `dataset_${datasetId.replace(/-/g, '_')}`;

        return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(filePath);
            const parser = parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            });

            let headersCreated = false;
            let rowsToInsert: any[] = [];
            let rowsInserted = 0;
            const batchSize = 10000;

            const flushBatch = async () => {
                if (rowsToInsert.length === 0) return;
                const batch = [...rowsToInsert];
                rowsToInsert = [];

                try {
                    await clickhouse.insert({
                        table: tableName,
                        values: batch,
                        format: 'JSONEachRow'
                    });
                    rowsInserted += batch.length;
                } catch (err) {
                    console.error('[ClickHouse] Batch insert error', err);
                }
            };

            fileStream.pipe(parser)
                .on('data', async (row) => {
                    if (!headersCreated) {
                        // Create table on first row derived headers
                        const headers = Object.keys(row);
                        parser.pause();
                        await this.createDatasetTable(datasetId, headers);
                        headersCreated = true;
                        parser.resume();
                    }

                    // Sanitize row keys to match table
                    const cleanRow: any = {};
                    for (const [key, val] of Object.entries(row)) {
                        const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                        cleanRow[cleanKey] = val;
                    }

                    rowsToInsert.push(cleanRow);

                    if (rowsToInsert.length >= batchSize) {
                        parser.pause();
                        await flushBatch();
                        parser.resume();
                    }
                })
                .on('end', async () => {
                    await flushBatch();
                    console.log(`[ClickHouse] Successfully streamed ${rowsInserted} rows to ${tableName}`);
                    resolve(rowsInserted);
                })
                .on('error', (err) => {
                    console.error('[ClickHouse] Stream error', err);
                    reject(err);
                });
        });
    }

    /**
     * Compute blazing fast aggregations over millions of rows
     */
    static async quickStats(tableName: string) {
        try {
            const rs = await clickhouse.query({
                query: `SELECT count() as totalRows, min(_inserted_at) as firstInserted FROM nalyse_gen2.${tableName}`
            });
            const data = await rs.json();
            return data.data[0];
        } catch (error) {
            console.error('[ClickHouse] Query error', error);
            return null;
        }
    }
}
