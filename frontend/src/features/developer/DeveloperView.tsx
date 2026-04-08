import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Code2, Key, TerminalSquare, BookOpen, Copy, Trash2, 
    PlusCircle, Play, CheckCircle2, Shield, Network, Zap,
    Cpu, Activity, Layers, Database
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

const PRIMARY_COLOR = '#3b82f6';
const SECONDARY_COLOR = '#10b981';

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
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<{name: string, rawKey: string} | null>(null);

    // API Tester State
    const [testEndpoint, setTestEndpoint] = useState('/api/v1/analysis');
    const [testMethod, setTestMethod] = useState('POST');
    const [testPayload, setTestPayload] = useState('{\n  "datasetId": "your-dataset-id"\n}');
    const [testResponse, setTestResponse] = useState<any>(null);
    const [testApiKey, setTestApiKey] = useState('');

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Just now';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

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
                const keyData = await res.json();
                setKeys([...keys, keyData]);
                setNewKeyName('');
                setNewlyCreatedKey({ name: keyData.name, rawKey: keyData.key });
                setTestApiKey(keyData.key);
                addToast('API Key generated successfully', 'success');
            }
        } catch (e) {
            addToast('Failed to create key', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeKey = async (keyStr: string) => {
        if (!confirm('Revoke this key? External apps using it will completely break.')) return;
        try {
            const res = await fetch(`${API_URL}/api/apikeys/${keyStr}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setKeys(keys.filter(k => k.key !== keyStr));
                addToast('Key securely revoked', 'success');
            }
        } catch (e) {
            addToast('Revoke failed', 'error');
        }
    };

    const runApiTest = async () => {
        if (!testApiKey) {
            addToast('Enter a valid API key in the configuration', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}${testEndpoint}`, {
                method: testMethod,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': testApiKey
                },
                body: testMethod !== 'GET' ? testPayload : undefined
            });
            const data = await res.json();
            setTestResponse(data);
            addToast(`200 OK — Execution successful`, 'success');
        } catch (e) {
            setTestResponse({ error: 'Request Transport Failed', message: (e as any).message });
            addToast('Request Failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const activeKeyLabel = (newlyCreatedKey?.rawKey) || (keys.length > 0 ? 'sk_live_••••••••' : 'YOUR_SECRET_KEY');

    const docSections: ApiSection[] = [
        {
            title: 'Datasets Lifecycle',
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v1/datasets',
                    desc: 'Upload a new dataset (CSV/JSON) directly to the isolated environment via multipart form-data.',
                    payload: 'form-data: { file: File }',
                    curl: `curl -X POST ${API_URL}/api/v1/datasets \\\n  -H "X-API-KEY: ${activeKeyLabel}" \\\n  -F "file=@/path/to/data.csv"`,
                    python: `import requests\n\nfiles = {'file': open('data.csv', 'rb')}\nheaders = {'X-API-KEY': '${activeKeyLabel}'}\n\nres = requests.post('${API_URL}/api/v1/datasets', headers=headers, files=files)\nprint(res.json())`
                },
                {
                    method: 'GET',
                    path: '/api/v1/datasets/:id',
                    desc: 'Retrieve deep metadata, processing schemas, and current inference status for a specific dataset engine.',
                    payload: 'None',
                    curl: `curl -G ${API_URL}/api/v1/datasets/{id} \\\n  -H "X-API-KEY: ${activeKeyLabel}"`
                }
            ]
        },
        {
            title: 'Analytical Engine',
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v1/analysis',
                    desc: 'Trigger the statistical core to generate deep insights, data distributions, and neural parameters.',
                    payload: '{ "datasetId": "UUID" }',
                    curl: `curl -X POST ${API_URL}/api/v1/analysis \\\n  -H "X-API-KEY: ${activeKeyLabel}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"datasetId": "{id}"}'`,
                }
            ]
        }
    ];

    return (
        <div id="developer-api-view" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)', display: 'flex', flexDirection: 'column' }}>

            {/* ─── Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px', flexShrink: 0 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '6px', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="flex items-center gap-3">
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}33, ${SECONDARY_COLOR}33)`, border: `1px solid ${PRIMARY_COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Code2 size={24} style={{ color: PRIMARY_COLOR }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Developer API Core
                            </h1>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                External integration logic • Secure authentication tokens • Technical SDKs
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Global Navigation Tabs ────────────────────────── */}
            <div className="flex items-center gap-2" style={{ marginBottom: '24px', flexWrap: 'wrap', padding: '4px 0' }}>
                {([
                    { id: 'keys' as const, label: 'Access Keys', icon: <Key size={14} /> },
                    { id: 'docs' as const, label: 'Documentation', icon: <BookOpen size={14} /> },
                    { id: 'tester' as const, label: 'API Console', icon: <TerminalSquare size={14} /> }
                ]).map(tab => (
                    <button key={tab.id} onClick={() => setSubTab(tab.id)}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: subTab === tab.id ? `1px solid ${PRIMARY_COLOR}` : '1px solid var(--border-default)', background: subTab === tab.id ? `${PRIMARY_COLOR}15` : 'var(--bg-secondary)', color: subTab === tab.id ? PRIMARY_COLOR : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: subTab === tab.id ? `0 4px 12px ${PRIMARY_COLOR}30` : 'none' }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ═════ TAB 1: KEYS ════════════════════════════════════════════════════════════════════ */}
                {subTab === 'keys' && (
                    <motion.div key="keys" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Generate New Key Pane */}
                        <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})` }} />
                            
                            <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
                                <Shield size={16} style={{ color: PRIMARY_COLOR }} />
                                <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>Issue New Secret</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>Key Identity / Environment Name</label>
                                    <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g., Production Python Backend"
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${newKeyName ? PRIMARY_COLOR + '55' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', outline: 'none' }}
                                        onFocus={e => e.target.style.borderColor = PRIMARY_COLOR}
                                        onBlur={e => e.target.style.borderColor = newKeyName ? PRIMARY_COLOR + '55' : 'var(--border-default)'}
                                    />
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateKey} disabled={loading || !newKeyName}
                                    style={{ padding: '12px 32px', height: '44px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!newKeyName) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 24px ${PRIMARY_COLOR}40`, whiteSpace: 'nowrap' }}>
                                    <PlusCircle size={15} /> Create Access Key
                                </motion.button>
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangleIcon /> Treat these securely. Do not inject secrets into client-facing web bundles.
                            </div>
                        </div>

                        {/* Active Keys List */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Network size={16} style={{ color: 'var(--text-secondary)' }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Provisioned Tokens</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {keys.map((k, i) => (
                                    <motion.div key={k.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ padding: '16px 20px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Key size={18} style={{ color: SECONDARY_COLOR }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '2px', color: 'var(--text-primary)' }}>{k.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <code style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: PRIMARY_COLOR, padding: '2px 8px', borderRadius: '4px', border: `1px solid rgba(59,130,246,0.2)` }}>
                                                        sk_live_••••••••••••••••
                                                    </code>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Issued: {formatDate(k.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button onClick={() => {
                                                if (newlyCreatedKey?.name === k.name) {
                                                    navigator.clipboard.writeText(newlyCreatedKey.rawKey);
                                                    addToast('Key copied to clipboard', 'success');
                                                } else {
                                                    addToast('For security, full keys cannot be recovered. Please generate a new one.', 'error');
                                                }
                                            }}
                                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-main)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:text-white transition-colors">
                                                <Copy size={12} /> Copy Full Key
                                            </button>
                                            <button onClick={() => handleRevokeKey(k.key)}
                                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 size={12} /> Revoke
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {keys.length === 0 && (
                                    <div style={{ padding: '40px', borderRadius: '16px', border: '1px dashed var(--border-default)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <Key size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '13px', fontWeight: 500 }}>No active API keys currently provisioned for this workspace.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═════ TAB 2: DOCUMENTATION ════════════════════════════════════════════════════════════ */}
                {subTab === 'docs' && (
                    <motion.div key="docs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        
                        {/* Auth Guide */}
                        <div style={{ padding: '20px 24px', borderRadius: '14px', background: `linear-gradient(135deg, ${PRIMARY_COLOR}11, ${SECONDARY_COLOR}11)`, border: `1px solid ${PRIMARY_COLOR}33`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Shield size={24} style={{ color: PRIMARY_COLOR, flexShrink: 0 }} />
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Universal Header Authentication</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Every request to the Nalyse Engine must include your provisioned secret token injected within the HTTP Headers as <code style={{ fontSize: '11px', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', color: PRIMARY_COLOR }}>X-API-KEY: {"<YOUR_SECRET>"}</code>.</p>
                            </div>
                        </div>

                        {docSections.map((section, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Layers size={18} style={{ color: SECONDARY_COLOR }} /> {section.title}
                                </h2>
                                
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {section.endpoints.map((ep, i) => (
                                        <div key={i} style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.05em', color: '#fff', background: ep.method === 'GET' ? SECONDARY_COLOR : PRIMARY_COLOR, padding: '4px 10px', borderRadius: '6px' }}>
                                                        {ep.method}
                                                    </span>
                                                    <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{ep.path}</code>
                                                </div>
                                            </div>
                                            <div style={{ padding: '20px' }}>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>{ep.desc}</p>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                                                    
                                                    {/* cURL block */}
                                                    <div style={{ background: '#09090b', borderRadius: '12px', border: '1px solid #27272a', padding: '16px', position: 'relative' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            cURL Binding
                                                            <button onClick={() => { navigator.clipboard.writeText(ep.curl); addToast('Copied cURL format', 'success') }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Copy size={12}/></button>
                                                        </div>
                                                        <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#d4d4d8', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {ep.curl}
                                                        </pre>
                                                    </div>

                                                    {/* Python Block */}
                                                    {ep.python && (
                                                        <div style={{ background: '#09090b', borderRadius: '12px', border: '1px solid #27272a', padding: '16px', position: 'relative' }}>
                                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                Python Framework
                                                                <button onClick={() => { navigator.clipboard.writeText(ep.python as string); addToast('Copied Python snippet', 'success') }} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}><Copy size={12}/></button>
                                                            </div>
                                                            <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#d4d4d8', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                                {ep.python}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ═════ TAB 3: API TESTER ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'tester' && (
                    <motion.div key="tester" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(350px, 1.2fr)', gap: '24px', minHeight: '600px' }}>
                        
                        {/* Request Config Pane */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', borderRadius: '18px', border: '1px solid var(--border-default)', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Cpu size={16} style={{ color: PRIMARY_COLOR }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Execution Shell</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Authorization (X-API-KEY)</label>
                                    <input value={testApiKey} onChange={e => setTestApiKey(e.target.value)} type="password" placeholder="sk_live_..."
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#09090b', border: '1px solid var(--border-subtle)', color: 'var(--success)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Target Node Override</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={testMethod} onChange={e => setTestMethod(e.target.value)}
                                            style={{ width: '100px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 800 }}>
                                            <option>GET</option>
                                            <option>POST</option>
                                        </select>
                                        <input value={testEndpoint} onChange={e => setTestEndpoint(e.target.value)}
                                            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>JSON Payload Structure</label>
                                    <textarea value={testPayload} onChange={e => setTestPayload(e.target.value)}
                                        style={{ width: '100%', height: '220px', padding: '16px', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: '#d4d4d8', fontSize: '12px', fontFamily: 'var(--font-mono)', resize: 'none' }}
                                    />
                                </div>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runApiTest} disabled={loading}
                                    style={{ padding: '14px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`, color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 24px ${PRIMARY_COLOR}40`, marginTop: 'auto' }}>
                                    {loading ? <Zap size={16} className="animate-spin" /> : <Play size={16} fill="white" />}
                                    {loading ? 'Fusing connection...' : 'Fire Network Request'}
                                </motion.button>
                            </div>
                        </div>

                        {/* Interactive Response Console */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: '#050505', borderRadius: '18px', border: '1px solid #1f1f22', overflow: 'hidden' }}>
                            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1f1f22', background: '#0a0a0c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={14} style={{ color: SECONDARY_COLOR }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.1em' }}>OUTPUT STREAM</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                                </div>
                            </div>
                            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                                {testResponse ? (
                                    <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: testResponse.error ? '#f87171' : '#34d399', margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(testResponse, null, 2)}
                                    </pre>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                        <Database size={48} style={{ color: '#fff', marginBottom: '16px' }} />
                                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>Awaiting runtime command execution...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

const AlertTriangleIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;

export default DeveloperView;
