import { clickhouse } from '../config/database';
import fs from 'fs';
import { parse } from 'csv-parse';

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
        // We use MergeTree for blazing fast aggregations
        const columnsDef = cleanHeaders.map(col => `\`${col}\` Nullable(String)`).join(', ');

        const query = `
            CREATE TABLE IF NOT EXISTS nalyse_gen2.${tableName} (
                _row_id UUID DEFAULT generateUUIDv4(),
                ${columnsDef},
                _inserted_at DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY _inserted_at
            SETTINGS index_granularity = 8192
        `;

        try {
            await clickhouse.command({ query });
            console.log(`[ClickHouse] Created/Verified OLAP table: ${tableName}`);
            return tableName;
        } catch (error) {
            console.error('[ClickHouse] Failed to create table', error);
            throw error;
        }
    }

    /**
     * Highly optimized parallel ingestion stream for huge CSVs
     * Capable of millions of rows per second by piping directly
     */
    static async streamCsvToClickHouse(filePath: string, datasetId: string): Promise<number> {
        const tableName = `dataset_${datasetId.replace(/-/g, '_')}`;

        return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 * 64 }); // 64MB chunks
            const parser = parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            });

            let headersCreated = false;
            let rowsToInsert: any[] = [];
            let totalRowsInserted = 0;
            const BATCH_SIZE = 50000; // Increased batch size for max throughput
            let activeFlushCount = 0;

            const flushBatch = async (batch: any[]) => {
                if (batch.length === 0) return;
                activeFlushCount++;
                try {
                    await clickhouse.insert({
                        table: `nalyse_gen2.${tableName}`,
                        values: batch,
                        format: 'JSONEachRow'
                    });
                    totalRowsInserted += batch.length;

                    // Simple backpressure: if Clickhouse gets overwhelmed, we slow down the filesystem
                    if (activeFlushCount > 3) {
                        parser.pause();
                        setTimeout(() => parser.resume(), 100);
                    }
                } catch (err) {
                    console.error('[ClickHouse] Batch insert error', err);
                    reject(err);
                } finally {
                    activeFlushCount--;
                }
            };

            fileStream.pipe(parser)
                .on('data', async (row) => {
                    if (!headersCreated) {
                        const headers = Object.keys(row);
                        parser.pause();
                        try {
                            await this.createDatasetTable(datasetId, headers);
                        } catch (e) {
                            reject(e);
                        }
                        headersCreated = true;
                        parser.resume();
                    }

                    // Strict sanitization
                    const cleanRow: any = {};
                    for (const [key, val] of Object.entries(row)) {
                        const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                        cleanRow[cleanKey] = val;
                    }

                    rowsToInsert.push(cleanRow);

                    if (rowsToInsert.length >= BATCH_SIZE) {
                        const batch = [...rowsToInsert];
                        rowsToInsert = [];
                        flushBatch(batch);
                    }
                })
                .on('end', async () => {
                    if (rowsToInsert.length > 0) {
                        await flushBatch(rowsToInsert);
                    }

                    // Wait for all async flushes to finish
                    const waitInterval = setInterval(() => {
                        if (activeFlushCount === 0) {
                            clearInterval(waitInterval);
                            console.log(`[ClickHouse] Stream complete! Inserted ${totalRowsInserted} rows into ${tableName}`);
                            resolve(totalRowsInserted);
                        }
                    }, 100);
                })
                .on('error', (err) => {
                    console.error('[ClickHouse] Parser stream error', err);
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
