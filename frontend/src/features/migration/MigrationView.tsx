import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

interface MigrationViewProps {
    onClose: () => void;
}

import { API_URL } from '../../config';

export const MigrationView: React.FC<MigrationViewProps> = ({ onClose }) => {
    const { token } = useAuth();
    const { addToast } = useToast();

    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Processing, 4: Success
    const [file, setFile] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);

    // Config
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [exclude, setExclude] = useState<string[]>([]);
    const [newName, setNewName] = useState('');

    // --- Step 1: Upload ---
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const selectedFile = e.target.files[0];

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Upload
            const res = await fetch(`${API_URL}/api/files/upload?type=migration_temp`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFile(data.file);

            // Analyze for Preview
            const analyzeRes = await fetch(`${API_URL}/api/files/${data.file.id}/analyze`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const analysis = await analyzeRes.json();

            if (analysis.sampleData && analysis.sampleData.length > 0) {
                setPreviewData(analysis.sampleData);
                const cols = Object.keys(analysis.sampleData[0]);
                setColumns(cols);
                // Init mapping
                const initialMap: Record<string, string> = {};
                cols.forEach(c => initialMap[c] = c);
                setMapping(initialMap);
            }

            setStep(2);
        } catch (err: any) {
            addToast(err.message || 'Upload error', 'error');
        }
    };

    // --- Step 2: Transform ---
    const handleMigrate = async () => {
        setStep(3);
        try {
            const res = await fetch(`${API_URL}/api/files/${file.id}/transform`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    mapping,
                    exclude,
                    newName: newName || `Migrated ${file.originalName}`
                })
            });

            if (!res.ok) throw new Error('Migration failed');
            await res.json();

            addToast('Data migration successful!', 'success');
            setStep(4);
            // We could trigger a global file refresh here if we had context, 
            // but user will see it in dashboard next time.
        } catch (err: any) {
            addToast(err.message, 'error');
            setStep(2);
        }
    };

    // Render Steps
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="text-h2">Data Migration Tool</h2>
                    <p className="text-sec">Import, clean, and transform your data professionally.</p>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: step >= s ? 'var(--primary)' : 'var(--text-secondary)',
                        opacity: step >= s ? 1 : 0.5
                    }}>
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: step >= s ? 'var(--primary)' : 'var(--bg-surface)',
                            color: step >= s ? 'white' : 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold'
                        }}>{s}</div>
                        <span style={{ fontWeight: 500 }}>
                            {s === 1 ? 'Upload' : s === 2 ? 'Map & Clean' : s === 3 ? 'Process' : 'Complete'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {step === 1 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', border: '2px dashed var(--border-default)', borderRadius: '12px', margin: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-h3">Upload Source File</h3>
                            <p className="text-sec" style={{ marginTop: '8px' }}>Support CSV, JSON, Excel</p>
                        </div>
                        <label className="btn btn-primary btn-lg" style={{ cursor: 'pointer' }}>
                            Select File
                            <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept=".csv,.json,.xlsx" />
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Dataset Name</label>
                                <input
                                    className="input"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder={file?.originalName ? `Migrated ${file.originalName}` : 'New Dataset Name'}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflow: 'auto', padding: '16px 0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)' }}>Source Column</th>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)' }}>Include</th>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)' }}>Target Name</th>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)' }}>Sample Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {columns.map(col => (
                                        <tr key={col} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{col}</td>
                                            <td style={{ padding: '12px 8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!exclude.includes(col)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setExclude(exclude.filter(c => c !== col));
                                                        } else {
                                                            setExclude([...exclude, col]);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 8px' }}>
                                                <input
                                                    className="input"
                                                    style={{ height: '32px' }}
                                                    value={mapping[col]}
                                                    disabled={exclude.includes(col)}
                                                    onChange={e => setMapping({ ...mapping, [col]: e.target.value })}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                {previewData[0] ? String(previewData[0][col]).slice(0, 30) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary" onClick={handleMigrate}>Migrate Data</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-default)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <h3 className="text-h3" style={{ marginTop: '24px' }}>Migrating Data...</h3>
                        <p className="text-sec">Cleaning, transforming, and saving your dataset.</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {step === 4 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>✓</div>
                        <h3 className="text-h3" style={{ marginTop: '24px' }}>Migration Complete!</h3>
                        <p className="text-sec">Your new dataset is ready for analysis.</p>
                        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary" onClick={() => { setStep(1); setFile(null); }}>Migrate Another</button>
                            <button className="btn btn-primary" onClick={onClose}>Go to Dashboard</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
