import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsedAt?: string;
}

interface ApiEndpoint {
    method: 'GET' | 'POST';
    path: string;
    desc: string;
    payload: string;
    curl: string;
    python?: string;
    js?: string;
}

interface ApiSection {
    title: string;
    endpoints: ApiEndpoint[];
}

export const DeveloperView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [subTab, setSubTab] = useState<'keys' | 'docs' | 'tester'>('keys');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [loading, setLoading] = useState(false);

    // API Tester State
    const [testEndpoint, setTestEndpoint] = useState('/api/v2/datasets');
    const [testMethod, setTestMethod] = useState('POST');
    const [testPayload, setTestPayload] = useState('{\n  "datasetId": "your-dataset-id"\n}');
    const [testResponse, setTestResponse] = useState<any>(null);



    const fetchKeys = async () => {
        try {
            const res = await fetch(`${API_URL}/api/apikeys`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setKeys(await res.json());
        } catch (e) {
            addToast('Failed to load keys', 'error');
        }
    };

    useEffect(() => { fetchKeys(); }, [token]);

    const handleCreateKey = async () => {
        if (!newKeyName) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/apikeys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newKeyName })
            });
            if (res.ok) {
                const key = await res.json();
                setKeys([...keys, key]);
                setNewKeyName('');
                addToast('API Key generated successfully', 'success');
            }
        } catch (e) {
            addToast('Failed to create key', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeKey = async (keyStr: string) => {
        if (!confirm('Revoke this key? External apps using it will break.')) return;
        try {
            const res = await fetch(`${API_URL}/api/apikeys/${keyStr}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setKeys(keys.filter(k => k.key !== keyStr));
                addToast('Key revoked', 'success');
            }
        } catch (e) {
            addToast('Revoke failed', 'error');
        }
    };

    const runApiTest = async () => {
        if (keys.length === 0) {
            addToast('Create an API key first', 'info');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}${testEndpoint}`, {
                method: testMethod,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': keys[0].key
                },
                body: testMethod !== 'GET' ? testPayload : undefined
            });
            const data = await res.json();
            setTestResponse(data);
        } catch (e) {
            setTestResponse({ error: 'Request failed', message: (e as any).message });
        } finally {
            setLoading(false);
        }
    };

    const docSections: ApiSection[] = [
        {
            title: 'Datasets',
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v2/datasets',
                    desc: 'Upload a new dataset (CSV/JSON) via multipart form-data. Or retrieve paginated list (GET).',
                    payload: 'form-data: { file: File }',
                    curl: `curl -X GET ${API_URL}/api/v2/datasets \\\n  -H "X-API-KEY: ${keys[0]?.key || 'YOUR_KEY'}"`,
                    python: `import requests\n\nheaders = {'X-API-KEY': '${keys[0]?.key || 'YOUR_KEY'}'}\n\nres = requests.get('${API_URL}/api/v2/datasets?page=1&limit=50', headers=headers)\nprint(res.json())`
                },
                {
                    method: 'GET',
                    path: '/api/v2/analyses',
                    desc: 'Retrieve paginated analysis executions.',
                    payload: 'None',
                    curl: `curl -G ${API_URL}/api/v2/analyses \\\n  -H "X-API-KEY: ${keys[0]?.key || 'YOUR_KEY'}"`
                }
            ]
        },
        {
            title: 'Analysis Engine',
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v2/analysis',
                    desc: 'Trigger the statistical core to generate insights and distributions.',
                    payload: '{ "datasetId": "UUID" }',
                    curl: `curl -X POST ${API_URL}/api/v2/analysis \\\n  -H "X-API-KEY: ${keys[0]?.key || 'YOUR_KEY'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"datasetId": "{id}"}'`,
                }
            ]
        },
        {
            title: 'Visual Assets',
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v2/charts',
                    desc: 'Get JSON metadata for bar, pie, and line charts tailored to the data.',
                    payload: '{ "datasetId": "UUID", "type": "bar" }',
                    curl: `curl -X POST ${API_URL}/api/v2/charts \\\n  -H "X-API-KEY: ${keys[0]?.key || 'YOUR_KEY'}" \\\n  -d '{"datasetId": "{id}", "type": "bar"}'`
                }
            ]
        }
    ];

    return (
        <div className="flex-col gap-8 fade-in" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Dubai, sans-serif' }}>
            <header className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-h1">Developer API</h1>
                    <p className="text-sec">Build external applications powered by Nalyse Intelligence.</p>
                </div>
                <div className="flex gap-1 p-1 bg-bg-surface rounded-xl">
                    <button className={`btn btn-sm ${subTab === 'keys' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSubTab('keys')}>Keys</button>
                    <button className={`btn btn-sm ${subTab === 'docs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSubTab('docs')}>Documentation</button>
                    <button className={`btn btn-sm ${subTab === 'tester' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSubTab('tester')}>API Console</button>
                </div>
            </header>

            {subTab === 'keys' && (
                <div className="flex-col gap-10 py-4">
                    <div className="card p-8 flex-col gap-6 glass">
                        <h3 className="text-h3">Generate New Access Key</h3>
                        <div className="flex gap-4">
                            <input
                                className="input" style={{ flex: 1 }} placeholder="Key Name (e.g. Marketing Dashboard)"
                                value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleCreateKey} disabled={loading}>{loading ? 'Generating...' : 'Create Secret Key'}</button>
                        </div>
                        <p className="text-xs text-tertiary">Secret keys are intended for server-side use. Never expose them in client-side code.</p>
                    </div>

                    <div className="flex-col gap-4">
                        <h3 className="text-h2">Active Secret Keys</h3>
                        <div className="flex-col gap-3">
                            {keys.map(k => (
                                <div key={k.id} className="card p-6 flex justify-between items-center bg-bg-card">
                                    <div className="flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{k.name}</span>
                                            <code className="text-xs bg-bg-surface px-2 py-0.5 rounded text-primary">{k.key.substring(0, 12)}...</code>
                                        </div>
                                        <span className="text-[10px] text-tertiary uppercase font-black">Created {new Date(k.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(k.key); addToast('Key copied', 'success'); }}>Copy</button>
                                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleRevokeKey(k.key)}>Revoke</button>
                                    </div>
                                </div>
                            ))}
                            {keys.length === 0 && <div className="p-10 text-center border-dashed border-2 border-subtle rounded-xl text-sec">No API keys found.</div>}
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'docs' && (
                <div className="flex-col gap-12 py-4">
                    <div className="card p-6 bg-primary-subtle border-primary mb-4">
                        <h4 className="font-bold text-primary mb-2">Authentication</h4>
                        <p className="text-sm">Include your API key in every request header as <code>X-API-KEY: YOUR_KEY</code>.</p>
                    </div>

                    {docSections.map(section => (
                        <div key={section.title} className="flex-col gap-6">
                            <h2 className="text-h2" style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '16px' }}>{section.title}</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {section.endpoints.map(ep => (
                                    <div key={ep.path} className="card p-8 flex-col gap-6 bg-bg-card">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <span className={`badge ${ep.method === 'GET' ? 'bg-success' : 'bg-primary'}`} style={{ color: 'white', padding: '4px 12px', fontWeight: 900 }}>{ep.method}</span>
                                                <code className="font-bold text-lg">{ep.path}</code>
                                            </div>
                                            <span className="text-xs text-tertiary">v2 Stable</span>
                                        </div>
                                        <p className="text-sec">{ep.desc}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-bg-app p-5 rounded-xl border border-subtle">
                                                <span className="text-[10px] font-black text-tertiary block mb-3 uppercase tracking-widest">cURL Command</span>
                                                <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap" style={{ maxHeight: '150px' }}>{ep.curl}</pre>
                                                <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => { navigator.clipboard.writeText(ep.curl); addToast('Copied to clipboard', 'success'); }}>Copy Snippet</button>
                                            </div>

                                            {ep.python || ep.js ? (
                                                <div className="bg-bg-app p-5 rounded-xl border border-subtle">
                                                    <span className="text-[10px] font-black text-tertiary block mb-3 uppercase tracking-widest">{ep.python ? 'Python SDK' : 'JavaScript Fetch'}</span>
                                                    <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap" style={{ maxHeight: '150px' }}>{ep.python || ep.js}</pre>
                                                    <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => { navigator.clipboard.writeText((ep.python || ep.js)!); addToast('Copied to clipboard', 'success'); }}>Copy Snippet</button>
                                                </div>
                                            ) : (
                                                <div className="bg-bg-app p-5 rounded-xl border border-subtle flex items-center justify-center opacity-40">
                                                    <span className="text-xs italic">Other SDKs coming soon</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {subTab === 'tester' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
                    <div className="flex-col gap-6">
                        <section className="card p-8 flex-col gap-6">
                            <h3 className="text-h3">Request Configuration</h3>
                            <div className="flex-col gap-4">
                                <div className="flex gap-4">
                                    <select className="input" style={{ width: '120px' }} value={testMethod} onChange={e => setTestMethod(e.target.value)}>
                                        <option>GET</option>
                                        <option>POST</option>
                                    </select>
                                    <input className="input" style={{ flex: 1 }} value={testEndpoint} onChange={e => setTestEndpoint(e.target.value)} />
                                </div>
                                <div className="flex-col gap-2">
                                    <span className="text-xs font-bold text-tertiary">REQUEST BODY (JSON)</span>
                                    <textarea
                                        className="input" style={{ height: '200px', fontFamily: 'monospace' }}
                                        value={testPayload} onChange={e => setTestPayload(e.target.value)}
                                    />
                                </div>
                                <button className="btn btn-primary btn-lg w-full" onClick={runApiTest} disabled={loading}>{loading ? 'Executing...' : 'Send Request'}</button>
                            </div>
                        </section>
                    </div>

                    <div className="flex-col gap-4">
                        <h4 className="text-xs font-black text-tertiary tracking-widest uppercase">Response Output</h4>
                        <div className="card p-6 bg-bg-surface h-full" style={{ minHeight: '500px', overflow: 'auto' }}>
                            {testResponse ? (
                                <pre className="text-xs font-mono" style={{ color: testResponse.error ? 'var(--danger)' : 'inherit' }}>
                                    {JSON.stringify(testResponse, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-30">
                                    <span>Waiting for request...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
