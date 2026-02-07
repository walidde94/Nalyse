import React, { useState } from 'react';
import alasql from 'alasql';
import { PremiumGate } from '../../components/subscription/PremiumGate';
import { Link2, BarChart3 } from 'lucide-react';

import { API_URL } from '../../config';

interface CorrelationViewProps {
    files: any[];
    token: string;
    onUpgradeRequested?: () => void;
}

export const CorrelationView: React.FC<CorrelationViewProps> = ({ files, token, onUpgradeRequested }) => {
    const [selectedIdA, setSelectedIdA] = useState<string>('');
    const [selectedIdB, setSelectedIdB] = useState<string>('');

    const [dataA, setDataA] = useState<any[]>([]);
    const [dataB, setDataB] = useState<any[]>([]);

    const [joinKeyA, setJoinKeyA] = useState('');
    const [joinKeyB, setJoinKeyB] = useState('');

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadFile = async (id: string, target: 'A' | 'B') => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/files/${id}/analyze`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (target === 'A') setDataA(json.sampleData || []);
            else setDataB(json.sampleData || []);
        } catch (e) {
            setError('Failed to load file data');
        } finally {
            setLoading(false);
        }
    };

    const runCorrelation = () => {
        if (!dataA.length || !dataB.length || !joinKeyA || !joinKeyB) {
            setError('Please select files and join keys');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = alasql(`SELECT a.*, b.* FROM ? AS a JOIN ? AS b ON a.[${joinKeyA}] = b.[${joinKeyB}] LIMIT 100`, [dataA, dataB]);
            setResults(res as any[]);
            if ((res as any[]).length === 0) setError('No matching records found');
        } catch (e: any) {
            setError('Join failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const columnsA = dataA.length > 0 ? Object.keys(dataA[0]) : [];
    const columnsB = dataB.length > 0 ? Object.keys(dataB[0]) : [];

    return (
        <PremiumGate
            feature="Correlation Engine"
            description="Discover relationships and hidden patterns across multiple datasets by joining them with our advanced correlation engine."
            onUpgrade={() => onUpgradeRequested?.()}
        >
            <div className="flex-col gap-6 fade-in" style={{ maxWidth: '1400px', margin: '0 auto', height: '100%' }}>

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-h2">Correlation Engine</h2>
                        <p className="text-sec">Join two datasets to find commonalities and relationships.</p>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={runCorrelation} disabled={loading || !joinKeyA || !joinKeyB}>
                        {loading ? 'Processing...' : 'Run Correlation'}
                    </button>
                </div>

                {/* Configuration Panel */}
                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '32px', alignItems: 'start' }}>

                    {/* Source A */}
                    <div className="flex-col gap-4">
                        <div className="flex-col gap-2">
                            <label className="text-sm font-bold">Primary Index (Left)</label>
                            <select
                                className="input"
                                value={selectedIdA}
                                onChange={(e) => { setSelectedIdA(e.target.value); loadFile(e.target.value, 'A'); }}
                            >
                                <option value="">Select File...</option>
                                {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
                            </select>
                        </div>

                        {dataA.length > 0 && (
                            <div className="flex-col gap-2 fade-in">
                                <label className="text-sm">Join Key</label>
                                <select className="input" value={joinKeyA} onChange={e => setJoinKeyA(e.target.value)}>
                                    <option value="">Select Field...</option>
                                    {columnsA.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="text-sm text-tertiary">{dataA.length} records loaded</div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center" style={{ paddingTop: '32px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 10px var(--primary)' }}>
                            <Link2 size={18} />
                        </div>
                    </div>

                    {/* Source B */}
                    <div className="flex-col gap-4">
                        <div className="flex-col gap-2">
                            <label className="text-sm font-bold">Secondary Index (Right)</label>
                            <select
                                className="input"
                                value={selectedIdB}
                                onChange={(e) => { setSelectedIdB(e.target.value); loadFile(e.target.value, 'B'); }}
                            >
                                <option value="">Select File...</option>
                                {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
                            </select>
                        </div>

                        {dataB.length > 0 && (
                            <div className="flex-col gap-2 fade-in">
                                <label className="text-sm">Join Key</label>
                                <select className="input" value={joinKeyB} onChange={e => setJoinKeyB(e.target.value)}>
                                    <option value="">Select Field...</option>
                                    {columnsB.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="text-sm text-tertiary">{dataB.length} records loaded</div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Results Area */}
                {error && (
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px' }}>
                        {error}
                    </div>
                )}

                <div className="card flex-col" style={{ flex: 1, minHeight: '400px', padding: 0, overflow: 'hidden' }}>
                    <div className="p-4 border-bottom flex justify-between items-center bg-surface">
                        <h3 className="text-h3">Results Preview</h3>
                        {results.length > 0 && <span className="text-sm font-mono text-gradient">{results.length} matches found</span>}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {results.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-secondary flex-col gap-2">
                                <span style={{ opacity: 0.5 }}><BarChart3 size={32} /></span>
                                Configure join settings above to see results.
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {Object.keys(results[0]).map(k => <th key={k}>{k}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={i}>
                                            {Object.values(r).map((v: any, j) => (
                                                <td key={j}>{String(v)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </PremiumGate>
    );
};
