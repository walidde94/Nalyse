import { analyzeFile, analyzeRawData as engineRawAnalysis } from './analysis/engine';

export const analyzeRawData = (records: any[], sourceName: string) => engineRawAnalysis(records, sourceName);

export * from './analysis/engine';
export default analyzeFile;
