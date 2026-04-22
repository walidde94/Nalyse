import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Code2, Copy, Check, ExternalLink, Palette, BarChart3, PieChart,
    TrendingUp, Layers, Globe, Lock, Loader2, Sparkles, ChevronRight,
    Monitor, Smartphone, Tablet, Settings, Eye, Boxes
} from 'lucide-react';
import { API_URL } from '../../config';

export const EmbedSDKView = ({ token }: { token?: string }) => {
    const [activeTab, setActiveTab] = useState<'quickstart' | 'preview' | 'customize'>('quickstart');
    const [embedType, setEmbedType] = useState<'chart' | 'dashboard' | 'kpi'>('chart');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedBlock(id);
        setTimeout(() => setCopiedBlock(null), 2000);
    };

    const installCode = `npm install @nalyse/embed-sdk`;
    const reactCode = `import { NalyseEmbed } from '@nalyse/embed-sdk';

function App() {
  return (
    <NalyseEmbed
      apiKey="nal_key_YOUR_API_KEY"
      type="${embedType}"
      dashboardId="dash-001"
      theme="${theme}"
      height={400}
      onLoad={() => console.log('Dashboard loaded')}
      onError={(err) => console.error(err)}
    />
  );
}`;

    const htmlCode = `<script src="https://cdn.nalyse.app/embed/v1.js"></script>
<div id="nalyse-embed"></div>
<script>
  Nalyse.embed({
    container: '#nalyse-embed',
    apiKey: 'nal_key_YOUR_API_KEY',
    type: '${embedType}',
    dashboardId: 'dash-001',
    theme: '${theme}',
    height: 400
  });
</script>`;

    const iframeCode = `<iframe
  src="${API_URL}/embed/dash-001?key=nal_key_YOUR_API_KEY&theme=${theme}"
  width="100%"
  height="400"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>`;

    const widgets = [
        { id: 'chart', label: 'Interactive Chart', icon: <BarChart3 size={20} />, desc: 'Line, bar, area, and scatter charts with live data' },
        { id: 'dashboard', label: 'Full Dashboard', icon: <Layers size={20} />, desc: 'Complete analytics dashboard with filters' },
        { id: 'kpi', label: 'KPI Metrics', icon: <TrendingUp size={20} />, desc: 'Single metric display with trend indicators' },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', position: 'relative', minHeight: '100%' }}>
            {/* Atmosphere */}
            <div style={{ position: 'absolute', top: '-5%', left: '25%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.06), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.5)' }}>
                            <Boxes size={22} color="#fff" />
                        </div>
                        Embedded Analytics SDK
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500, marginLeft: '52px' }}>
                        Embed Nalyse analytics directly into your product. React, HTML, or iframe — your choice.
                    </p>
                </div>
            </div>

            {/* Widget Type Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                {widgets.map(w => {
                    const isActive = embedType === w.id;
                    return (
                        <button key={w.id} onClick={() => setEmbedType(w.id as any)} style={{
                            padding: '20px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                            background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.06))' : 'var(--bg-card)',
                            border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                            color: 'var(--text-primary)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
                        }}>
                            {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #6366f1, #ec4899)' }} />}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }}>{w.icon}</div>
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>{w.label}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{w.desc}</p>
                        </button>
                    );
                })}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                {[
                    { id: 'quickstart', label: 'Quick Start Code', icon: <Code2 size={15} /> },
                    { id: 'preview', label: 'Live Preview', icon: <Eye size={15} /> },
                    { id: 'customize', label: 'Customization', icon: <Palette size={15} /> },
                ].map(t => {
                    const isActive = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px',
                            background: isActive ? 'var(--bg-surface)' : 'transparent',
                            border: `1px solid ${isActive ? 'var(--border-color)' : 'transparent'}`,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            {t.icon} {t.label}
                        </button>
                    );
                })}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: 'var(--bg-surface)', borderRadius: '8px', padding: '4px' }}>
                    <button onClick={() => setTheme('dark')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: theme === 'dark' ? '#6366f1' : 'transparent', color: '#fff' }}>Dark</button>
                    <button onClick={() => setTheme('light')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: theme === 'light' ? '#6366f1' : 'transparent', color: '#fff' }}>Light</button>
                </div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab + embedType + theme} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}>

                        {/* ─── QUICKSTART ─────────────────────────── */}
                        {activeTab === 'quickstart' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Install */}
                                <CodeBlock title="1. Install the SDK" language="bash" code={installCode} id="install" copiedBlock={copiedBlock} onCopy={copyCode} />
                                {/* React */}
                                <CodeBlock title="2. React Component" language="jsx" code={reactCode} id="react" copiedBlock={copiedBlock} onCopy={copyCode} />
                                {/* HTML */}
                                <CodeBlock title="Alternative: Vanilla HTML" language="html" code={htmlCode} id="html" copiedBlock={copiedBlock} onCopy={copyCode} />
                                {/* iframe */}
                                <CodeBlock title="Alternative: iFrame Embed" language="html" code={iframeCode} id="iframe" copiedBlock={copiedBlock} onCopy={copyCode} />
                            </div>
                        )}

                        {/* ─── PREVIEW ───────────────────────────── */}
                        {activeTab === 'preview' && (
                            <div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                    {[
                                        { id: 'desktop', icon: <Monitor size={14} />, label: 'Desktop' },
                                        { id: 'tablet', icon: <Tablet size={14} />, label: 'Tablet' },
                                        { id: 'mobile', icon: <Smartphone size={14} />, label: 'Mobile' },
                                    ].map(d => (
                                        <button key={d.id} onClick={() => setPreviewDevice(d.id as any)} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                            background: previewDevice === d.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                                            border: `1px solid ${previewDevice === d.id ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-default)'}`,
                                            color: previewDevice === d.id ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer'
                                        }}>
                                            {d.icon} {d.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                                        transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                        background: theme === 'dark' ? '#0f172a' : '#f8fafc',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '20px', padding: '24px', minHeight: '400px',
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        {/* Mock Browser Chrome */}
                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                            <div style={{ flex: 1, height: '24px', background: theme === 'dark' ? 'var(--bg-surface-hover)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', marginLeft: '8px', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                                                <span style={{ fontSize: '10px', color: theme === 'dark' ? 'var(--text-muted)' : 'rgba(0,0,0,0.3)', fontFamily: 'var(--font-mono)' }}>your-app.com/analytics</span>
                                            </div>
                                        </div>

                                        {/* Simulated Embedded Widget */}
                                        <div style={{ background: theme === 'dark' ? 'var(--bg-surface)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme === 'dark' ? 'var(--border-default)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '12px', padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '20px', height: '20px', background: '#6366f1', borderRadius: '4px' }} />
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: theme === 'dark' ? '#fff' : '#1e293b' }}>Nalyse Embed</span>
                                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', textTransform: 'uppercase' }}>{embedType}</span>
                                                </div>
                                                <span style={{ fontSize: '10px', color: theme === 'dark' ? 'var(--text-muted)' : 'rgba(0,0,0,0.3)' }}>Powered by Nalyse</span>
                                            </div>

                                            {embedType === 'chart' && (
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 16px' }}>
                                                    {[65, 45, 78, 92, 55, 88, 70, 95, 60, 82, 73, 97].map((h, i) => (
                                                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5, type: 'spring' }}
                                                            style={{ flex: 1, background: `linear-gradient(0deg, #6366f1, ${i % 2 === 0 ? '#818cf8' : '#a78bfa'})`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                                                    ))}
                                                </div>
                                            )}
                                            {embedType === 'dashboard' && (
                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} style={{ background: theme === 'dark' ? 'var(--bg-surface)' : 'rgba(0,0,0,0.03)', borderRadius: '8px', padding: '16px' }}>
                                                            <div style={{ width: '40%', height: '8px', background: theme === 'dark' ? 'var(--bg-elevated)' : 'rgba(0,0,0,0.1)', borderRadius: '4px', marginBottom: '12px' }} />
                                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#6366f1', fontFamily: 'var(--font-mono)' }}>{Math.floor(Math.random() * 900) + 100}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {embedType === 'kpi' && (
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                    <div style={{ fontSize: '48px', fontWeight: 900, color: '#6366f1', fontFamily: 'var(--font-mono)' }}>$2.4M</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                                        <TrendingUp size={16} color="#10b981" />
                                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>+12.8%</span>
                                                        <span style={{ fontSize: '12px', color: theme === 'dark' ? 'var(--text-muted)' : 'rgba(0,0,0,0.4)' }}>vs last quarter</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── CUSTOMIZE ──────────────────────────── */}
                        {activeTab === 'customize' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>SDK Configuration</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <SettingRow label="Border Radius" value="12px" type="text" />
                                            <SettingRow label="Font Family" value="Inter, system-ui" type="text" />
                                            <SettingRow label="Accent Color" value="#6366f1" type="color" />
                                            <SettingRow label="Chart Animation" value="true" type="toggle" />
                                            <SettingRow label="Show Watermark" value="true" type="toggle" />
                                            <SettingRow label="Auto-refresh (sec)" value="30" type="text" />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Security & Access</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <SettingRow label="Allowed Domains" value="*.mycompany.com" type="text" />
                                            <SettingRow label="JWT Auth Mode" value="false" type="toggle" />
                                            <SettingRow label="Rate Limit (req/min)" value="60" type="text" />
                                            <SettingRow label="CORS Origins" value="https://app.mycompany.com" type="text" />
                                        </div>
                                    </div>

                                    <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.04))', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Sparkles size={16} color="#818cf8" />
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8' }}>Pro Feature</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                            Enterprise SDK users get access to SSO-based embed authentication, custom CSS injection, and white-label branding removal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ─── Reusable Sub-Components ─── */

const CodeBlock = ({ title, language, code, id, copiedBlock, onCopy }: {
    title: string; language: string; code: string; id: string;
    copiedBlock: string | null; onCopy: (code: string, id: string) => void;
}) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', textTransform: 'uppercase' }}>{language}</span>
                <button onClick={() => onCopy(code, id)} style={{ background: copiedBlock === id ? '#10b981' : 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                    {copiedBlock === id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>
        </div>
        <pre style={{ padding: '20px', margin: 0, fontSize: '12px', lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap', background: 'var(--bg-main)' }}>
            {code}
        </pre>
    </div>
);

const SettingRow = ({ label, value, type }: { label: string; value: string; type: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        {type === 'toggle' ? (
            <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: value === 'true' ? '#6366f1' : 'var(--bg-elevated)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: value === 'true' ? '18px' : '2px', transition: 'left 0.2s' }} />
            </div>
        ) : type === 'color' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: value, border: '1px solid var(--border-color)' }} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{value}</span>
            </div>
        ) : (
            <input type="text" defaultValue={value} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'right', width: '200px', outline: 'none', fontFamily: 'var(--font-mono)' }} />
        )}
    </div>
);
